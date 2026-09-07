-- Guide accounts: one account per boss ("Vorkath", "Rasial", "Telos", "Angel of Death", …) that holds the PvME loadouts
-- and rotations, so that players can copy them from the Explore page and the Shared setups page. They show up with a
-- "Guide" badge (profiles.kind = 'guide', exposed as public_rotations.owner_kind and the setup RPCs' `kind`) and can
-- never be signed in to: auth.users.encrypted_password stays NULL and the account is banned until the year 2999.
--
-- The accounts are created by public.ensure_guide_account(name) – security definer, not callable through the API –
-- from later migrations that seed the content (tools/guide-seed-to-sql.py generates them). The id of a guide account
-- is a deterministic function of its name (public.guide_id), so every seed can address it and a re-run is a no-op.
--
--  1. profiles.kind ('player' | 'guide') – only changeable through ensure_guide_account (protect_profile keeps it)
--  2. public_profiles + public_rotations expose it (kind / owner_kind)
--  3. list_public_setups() / get_public_setup() return it next to display_name
--  4. guide_id(name) + ensure_guide_account(name)

-- ---------------------------------------------------------------- 1. profiles.kind
alter table public.profiles
  add column kind text not null default 'player' check (kind in ('player', 'guide'));

create index profiles_guides on public.profiles (kind) where kind = 'guide';

-- kind moves only inside ensure_guide_account (same rs3.admin guard the admin RPCs use for role / block fields);
-- a player must not be able to give themselves the Guide badge through "update my profile"
create or replace function public.protect_profile()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.created_at := old.created_at;
  if current_setting('rs3.admin', true) is distinct from 'on' then
    new.role := old.role;
    new.blocked_at := old.blocked_at;
    new.blocked_by := old.blocked_by;
    new.blocked_reason := old.blocked_reason;
    new.kind := old.kind;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------- 2. public_profiles / public_rotations
-- (create or replace may append columns to a view, so the grants and dependents stay)
create or replace view public.public_profiles
with (security_invoker = false) as
  select id, display_name, kind from public.profiles where blocked_at is null;

grant select on public.public_profiles to anon, authenticated;

create or replace view public.public_rotations
with (security_invoker = true) as
  select r.id, r.name, r.steps, r.styles, r.copies, r.source_id, r.created_at, r.updated_at,
         p.display_name as owner_name,
         p.kind as owner_kind
  from public.rotations r
  join public.public_profiles p on p.id = r.owner_id
  where r.is_public;

-- ---------------------------------------------------------------- 3. shared-setup RPCs (bodies as in 0007, plus kind)
-- the returned table changes, so the function has to be dropped; it was callable by everyone (default execute grant)
drop function public.list_public_setups();

create function public.list_public_setups()
returns table (
  user_id uuid, display_name text, kind text, updated_at timestamptz, settings jsonb,
  loadout_names text[], keybinds bigint, has_action_bars boolean
)
language sql
stable
security definer set search_path = public
as $$
  select s.user_id, p.display_name::text, p.kind, s.updated_at, s.settings,
         (select coalesce(array_agg(l ->> 'name' order by ord), '{}')
            from jsonb_array_elements(s.loadouts -> 'loadouts') with ordinality as t(l, ord)),
         (select count(*) from public.keybinds k where k.user_id = s.user_id),
         exists (select 1 from public.action_bars a where a.user_id = s.user_id)
  from public.setups s
  join public.profiles p on p.id = s.user_id
  where s.is_public and p.blocked_at is null
  order by s.updated_at desc
  limit 100;
$$;

grant execute on function public.list_public_setups() to anon, authenticated;

create or replace function public.get_public_setup(target uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'user_id', s.user_id,
    'display_name', p.display_name,
    'kind', p.kind,
    'updated_at', s.updated_at,
    'settings', s.settings,
    'loadouts', s.loadouts,
    'enemy', s.enemy,
    'keybinds', coalesce((select jsonb_object_agg(k.entity_key, k.keybind) from public.keybinds k where k.user_id = s.user_id), '{}'::jsonb),
    'action_bars', (select a.setup from public.action_bars a where a.user_id = s.user_id)
  )
  from public.setups s
  join public.profiles p on p.id = s.user_id
  where s.user_id = target
    and (s.is_public or s.user_id = auth.uid() or public.is_admin())
    and p.blocked_at is null;
$$;

-- ---------------------------------------------------------------- 4. guide accounts
-- deterministic id from the display name: 00000000-0000-0000-0000-<first 12 hex chars of md5('guide:<name>')>
-- (real accounts get random v4 ids, so the all-zero prefix cannot collide with one)
create or replace function public.guide_id(name text)
returns uuid
language sql
immutable
as $$
  select ('00000000-0000-0000-0000-' || substr(md5('guide:' || name), 1, 12))::uuid;
$$;

-- Creates the auth user + profile for a guide account (or returns the id when it exists). Sign-in is impossible:
-- no password, banned until 2999, and the mail address guide+<slug>@rs3trainer.hochware.com has no mailbox.
-- The profile comes from the on_auth_user_created trigger (0001) – it falls back to "player-xxxxxxxx" when the name is
-- taken, which is checked here so a seed cannot silently run under the wrong name.
create or replace function public.ensure_guide_account(name text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  gid uuid := public.guide_id(name);
  slug text := trim(both '-' from lower(regexp_replace(name, '[^A-Za-z0-9]+', '-', 'g')));
  actual citext;
begin
  if name is null or length(name) not between 3 and 20 or name !~ '^[A-Za-z0-9 _-]+$' then
    raise exception 'guide name "%" is not a valid display name (3-20 chars, letters, digits, space, _ -)', name;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, banned_until,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', gid, 'authenticated', 'authenticated',
    'guide+' || slug || '@rs3trainer.hochware.com', null, now(), '2999-12-31 00:00:00+00',
    '{"provider": "email", "providers": ["email"]}'::jsonb, jsonb_build_object('display_name', name), false, now(), now(),
    -- GoTrue scans these as strings and chokes on NULL when it lists users, so they are '' like on its own rows
    '', '', '', '', '', '', '', ''
  )
  on conflict (id) do nothing;

  select display_name into actual from public.profiles where id = gid;
  if actual is null then
    raise exception 'profile for guide "%" was not created', name;
  end if;
  if actual <> name::citext then
    raise exception 'guide name "%" is taken by another account (the guide got "%")', name, actual;
  end if;

  perform set_config('rs3.admin', 'on', true);
  update public.profiles set kind = 'guide' where id = gid and kind <> 'guide';
  perform set_config('rs3.admin', 'off', true);
  return gid;
end;
$$;

-- both are for migrations / the service role only
revoke execute on function public.guide_id(text) from public, anon, authenticated;
revoke execute on function public.ensure_guide_account(text) from public, anon, authenticated;
