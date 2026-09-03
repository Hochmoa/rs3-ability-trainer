-- RS3 Ability Trainer – initial schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Everything is protected by row level security; the frontend only holds the anon/publishable key.

create extension if not exists citext;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name citext not null unique
    check (length(display_name) between 3 and 20 and display_name ~ '^[A-Za-z0-9 _-]+$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are public" on public.profiles
  for select using (true);

create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- only the display name may change through the API
create or replace function public.protect_profile()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- profile row from the display name given at sign-up (raw_user_meta_data.display_name).
-- A taken or invalid name must not break the registration: fall back to player-xxxxxxxx,
-- the user can rename on the account page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wanted text := new.raw_user_meta_data ->> 'display_name';
  fallback text := 'player-' || left(replace(new.id::text, '-', ''), 8);
begin
  begin
    insert into public.profiles (id, display_name) values (new.id, coalesce(wanted, fallback));
  exception
    when unique_violation or check_violation then
      insert into public.profiles (id, display_name) values (new.id, fallback);
  end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- display-name availability check for the sign-up form (anon may call it)
create or replace function public.display_name_taken(name text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where display_name = name::citext);
$$;

-- account deletion: removes the auth user; profiles/rotations/keybinds/sessions cascade
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------- rotations
create table public.rotations (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  -- RotationStep[] exactly as in the frontend: [{"kind":"ability","id":"sever"}, ...]
  steps jsonb not null
    check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 200),
  is_public boolean not null default true,
  source_id uuid references public.rotations (id) on delete set null,
  -- derived by the client for explorer filters, e.g. {"Melee","Defence"}
  styles text[] not null default '{}',
  copies integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rotations_public_updated on public.rotations (updated_at desc) where is_public;
create index rotations_public_copies on public.rotations (copies desc) where is_public;
create index rotations_owner on public.rotations (owner_id);

-- every step must be an object with kind + id (a CHECK may not contain a subquery, so it goes through a function)
create or replace function public.rotation_steps_valid(steps jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(steps) = 'array'
     and not exists (
       select 1 from jsonb_array_elements(steps) s
       where jsonb_typeof(s) <> 'object'
          or not (s ? 'kind') or not (s ? 'id')
          or s ->> 'kind' not in ('ability', 'prayer', 'special')
     );
$$;

alter table public.rotations add constraint rotations_steps_shape check (public.rotation_steps_valid(steps));

alter table public.rotations enable row level security;

create policy "public rotations are readable by everyone" on public.rotations
  for select using (is_public or auth.uid() = owner_id);

create policy "owners insert their rotations" on public.rotations
  for insert with check (auth.uid() = owner_id);

create policy "owners update their rotations" on public.rotations
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owners delete their rotations" on public.rotations
  for delete using (auth.uid() = owner_id);

-- copies counter can only move through copy_rotation(); updated_at is always server time
create or replace function public.protect_rotation_counters()
returns trigger
language plpgsql
as $$
begin
  if new.copies <> old.copies and current_setting('rs3.copying', true) is distinct from 'on' then
    new.copies := old.copies;
  end if;
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger rotations_protect_counters
  before update on public.rotations
  for each row execute function public.protect_rotation_counters();

-- "Copy to my rotations": private copy for the caller, keeps the origin, bumps the counter
create or replace function public.copy_rotation(source uuid, new_id uuid default gen_random_uuid())
returns public.rotations
language plpgsql
security definer set search_path = public
as $$
declare
  src public.rotations;
  result public.rotations;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;
  select * into src from public.rotations where id = source and (is_public or owner_id = auth.uid());
  if not found then
    raise exception 'rotation not found';
  end if;
  insert into public.rotations (id, owner_id, name, steps, is_public, source_id, styles)
  values (new_id, auth.uid(), src.name, src.steps, false, src.id, src.styles)
  returning * into result;
  perform set_config('rs3.copying', 'on', true);
  update public.rotations set copies = copies + 1 where id = src.id;
  perform set_config('rs3.copying', 'off', true);
  return result;
end;
$$;

-- ---------------------------------------------------------------- keybinds (synced per account)
create table public.keybinds (
  user_id uuid not null references public.profiles (id) on delete cascade,
  entity_key text not null check (entity_key ~ '^(ability|prayer|special):[a-z0-9-]+$'),
  -- {"code":"KeyQ","ctrl":false,"shift":false,"alt":false}
  keybind jsonb not null check (keybind ? 'code'),
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_key)
);

alter table public.keybinds enable row level security;

create policy "users manage their own keybinds" on public.keybinds
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------- sessions (scoreboard later)
create table public.sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rotation_id uuid references public.rotations (id) on delete set null,
  rotation_name text not null,
  accuracy numeric(5, 2) not null check (accuracy between 0 and 100),
  perfect integer not null default 0,
  late integer not null default 0,
  too_early integer not null default 0,
  wrong integer not null default 0,
  missed integer not null default 0,
  settings jsonb not null,
  loadout jsonb,
  results jsonb not null,
  started_at timestamptz not null,
  ended_at timestamptz not null
);

create index sessions_rotation on public.sessions (rotation_id, accuracy desc);

alter table public.sessions enable row level security;

create policy "users insert their own sessions" on public.sessions
  for insert with check (auth.uid() = user_id);

create policy "users read their own sessions" on public.sessions
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------- explorer view (owner name joined)
create view public.public_rotations
with (security_invoker = true) as
  select r.id, r.name, r.steps, r.styles, r.copies, r.source_id, r.created_at, r.updated_at,
         p.display_name as owner_name
  from public.rotations r
  join public.profiles p on p.id = r.owner_id
  where r.is_public;
