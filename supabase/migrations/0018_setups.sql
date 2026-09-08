-- Setups (docs/plan-setups.md, 2026-09-08): a setup = boss + one loadout + its rotations is the unit players share
-- and copy. This replaces three things at once:
--   * the per-account "shared setup" bundle (settings + loadouts + keybinds + action bars) and the two RPCs that
--     handed out other players' keybinds and action bars – nothing of that is shared any more
--   * the per-rotation public flag, the explorer view and copy_rotation – rotations are only ever part of a setup
--   * the 36 per-boss guide accounts – one guide account "PVME" holds every PvME setup (seeded by 0019)
-- Keybinds live in action_bars.setup since the bars rework; the legacy per-entity keybinds table goes.
-- Settings + enemy config keep syncing, into a private user_settings row.

-- ---------------------------------------------------------------- 1. the old bundle and its public read path
drop function if exists public.list_public_setups();
drop function if exists public.get_public_setup(uuid);
drop trigger if exists setups_touch on public.setups;
drop function if exists public.touch_setups();
drop table if exists public.setups;

-- ---------------------------------------------------------------- 2. guide accounts of the old shape
-- one account per boss; their rotations and bundles go with them (profiles → rotations cascade)
delete from auth.users where id in (select id from public.profiles where kind = 'guide');

-- ---------------------------------------------------------------- 3. setups
create table public.setups (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- '' = general practice
  boss text not null default '' check (length(boss) <= 60),
  name text not null check (length(name) between 1 and 60),
  -- "Ranged", "Magic/Melee" – for the filter chips; '' = not known
  style text not null default '' check (length(style) <= 40),
  -- Loadout exactly as the frontend stores it (its id is the setup's loadoutId)
  loadout jsonb not null check (jsonb_typeof(loadout) = 'object' and (loadout ? 'id') and octet_length(loadout::text) <= 200000),
  is_public boolean not null default false,
  -- the public setup this one was copied from
  source_id uuid references public.setups (id) on delete set null,
  -- presets.json id when it came from a PvME preset (the guide account's rows, and copies of them)
  preset_id text check (preset_id is null or length(preset_id) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index setups_owner on public.setups (owner_id);
create index setups_public_boss on public.setups (boss, name) where is_public;

alter table public.setups enable row level security;

create policy "public setups are readable by everyone" on public.setups
  for select using (is_public or auth.uid() = owner_id or public.is_admin());
create policy "owners insert their setups" on public.setups
  for insert with check (auth.uid() = owner_id and not public.is_blocked());
create policy "owners update their setups" on public.setups
  for update using ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin())
  with check ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin());
create policy "owners delete their setups" on public.setups
  for delete using ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin());

-- owner and creation are fixed, updated_at is always server time
create or replace function public.protect_setup()
returns trigger
language plpgsql
as $$
begin
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger setups_protect
  before update on public.setups
  for each row execute function public.protect_setup();

-- at most 400 setups per account (the guide account holds ~130)
create or replace function public.setups_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.setups where owner_id = new.owner_id) >= 400 then
    raise exception 'too many setups';
  end if;
  return new;
end;
$$;

create trigger setups_limit
  before insert on public.setups
  for each row execute function public.setups_limit();

-- ---------------------------------------------------------------- 4. rotations belong to a setup
drop view if exists public.public_rotations;
drop function if exists public.copy_rotation(uuid, uuid);
drop trigger if exists rotations_protect_counters on public.rotations;
drop function if exists public.protect_rotation_counters();
drop policy "public rotations are readable by everyone" on public.rotations;
drop index if exists public.rotations_public_updated;
drop index if exists public.rotations_public_copies;

alter table public.rotations
  add column setup_id uuid references public.setups (id) on delete cascade,
  -- order inside the setup (0 = first)
  add column position integer check (position is null or position between 0 and 999),
  drop column is_public,
  drop column copies,
  drop column source_id,
  drop column styles;

-- rows from before this migration keep setup_id null: the client puts them into a setup on its next sync
create index rotations_setup on public.rotations (setup_id);

create policy "rotations of public setups are readable by everyone" on public.rotations
  for select using (
    auth.uid() = owner_id or public.is_admin()
    or exists (select 1 from public.setups s where s.id = rotations.setup_id and s.is_public)
  );

create or replace function public.protect_rotation()
returns trigger
language plpgsql
as $$
begin
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger rotations_protect
  before update on public.rotations
  for each row execute function public.protect_rotation();

-- a rotation may only point at a setup of the same owner
create or replace function public.rotation_setup_owner()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.setup_id is not null and not exists (select 1 from public.setups s where s.id = new.setup_id and s.owner_id = new.owner_id) then
    raise exception 'setup does not belong to the rotation owner';
  end if;
  return new;
end;
$$;

create trigger rotations_setup_owner
  before insert or update on public.rotations
  for each row execute function public.rotation_setup_owner();

-- ---------------------------------------------------------------- 5. what the Setups page reads
-- security_invoker: the setups / rotations policies apply, public_profiles (definer) supplies names and the guide kind
create view public.public_setups
with (security_invoker = true) as
  select s.id, s.owner_id, p.display_name as owner_name, p.kind as owner_kind,
         s.boss, s.name, s.style, s.preset_id, s.updated_at,
         (select count(*) from public.rotations r where r.setup_id = s.id)::int as rotation_count,
         (select coalesce(array_agg(r.name order by r.position, r.name), '{}') from public.rotations r where r.setup_id = s.id) as rotation_names
  from public.setups s
  join public.public_profiles p on p.id = s.owner_id
  where s.is_public;

create view public.setup_users
with (security_invoker = true) as
  select s.owner_id, p.display_name, p.kind, count(*)::int as setups, max(s.updated_at) as updated_at
  from public.setups s
  join public.public_profiles p on p.id = s.owner_id
  where s.is_public
  group by s.owner_id, p.display_name, p.kind;

grant select on public.public_setups, public.setup_users to anon, authenticated;

-- ---------------------------------------------------------------- 6. settings + enemy: private per account
create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  enemy jsonb check (enemy is null or jsonb_typeof(enemy) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "users read their own settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "users write their own settings" on public.user_settings
  for insert with check (auth.uid() = user_id and not public.is_blocked());
create policy "users update their own settings" on public.user_settings
  for update using (auth.uid() = user_id and not public.is_blocked())
  with check (auth.uid() = user_id and not public.is_blocked());
create policy "users delete their own settings" on public.user_settings
  for delete using (auth.uid() = user_id);

create or replace function public.touch_user_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_settings_touch
  before insert or update on public.user_settings
  for each row execute function public.touch_user_settings();

revoke all on table public.user_settings from anon;

-- ---------------------------------------------------------------- 7. the legacy per-entity keybinds
drop table if exists public.keybinds;
drop function if exists public.touch_keybinds();

-- ---------------------------------------------------------------- 8. admin overview counts setups instead
drop function public.admin_list_users();
create or replace function public.admin_list_users()
returns table (
  id uuid, display_name text, role text, blocked_at timestamptz, blocked_reason text, blocked_by_name text,
  created_at timestamptz, email text, email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  setups bigint, public_setups bigint, rotations bigint, sessions bigint, has_action_bars boolean
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  return query
    select p.id, p.display_name::text, p.role, p.blocked_at, p.blocked_reason, b.display_name::text,
           p.created_at,
           case when public.is_admin() then u.email::text else null end,
           u.email_confirmed_at, u.last_sign_in_at,
           (select count(*) from public.setups s where s.owner_id = p.id),
           (select count(*) from public.setups s where s.owner_id = p.id and s.is_public),
           (select count(*) from public.rotations r where r.owner_id = p.id),
           (select count(*) from public.sessions s where s.user_id = p.id),
           exists (select 1 from public.action_bars a where a.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profiles b on b.id = p.blocked_by
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
