-- Hardening after the read-only review of 2026-09-05 (review-code.md A.12). Nothing here changes what the client
-- does; it narrows what the publishable key can reach and makes silent failures loud.
--
--  1. profiles are readable only by their owner and staff; display names stay public through public_profiles
--  2. public_rotations joins public_profiles instead of profiles (it is security_invoker, so it would go blank otherwise)
--  3. client_errors: size check on `extra`, at most 60 inserts per fingerprint per hour
--  4. feedback: at most 20 inserts per user agent per hour
--  5. admin_set_role: the "user not found" check ran after a set_config() that reset FOUND – it could never fire
--  6. keybinds: updated_at is server time like on action_bars and setups
--  7. grants: anon cannot touch sessions / setups / keybinds / action_bars at all (the client never does), and
--     the admin_* RPCs are callable by signed-in users only (they check the role themselves)
--
-- Not changed on purpose: setups.is_public stays default true (product decision pending – see the account page's
-- toggle); blocked users' rotations stay in the explorer as before.

-- ---------------------------------------------------------------- 1. profiles: own row or staff
drop policy "profiles are public" on public.profiles;

create policy "own profile or staff" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

-- Display names for the explorer and the setups pages. A view without security_invoker reads profiles as its owner
-- (postgres), so the profiles RLS does not apply – and the view exposes nothing but id + display_name.
create or replace view public.public_profiles
with (security_invoker = false) as
  select id, display_name from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------- 2. explorer view: names through public_profiles
create or replace view public.public_rotations
with (security_invoker = true) as
  select r.id, r.name, r.steps, r.styles, r.copies, r.source_id, r.created_at, r.updated_at,
         p.display_name as owner_name
  from public.rotations r
  join public.public_profiles p on p.id = r.owner_id
  where r.is_public;

-- ---------------------------------------------------------------- 3. client_errors: size + rate
alter table public.client_errors
  add constraint client_errors_extra_size check (extra is null or octet_length(extra::text) <= 4000);

-- security definer: the counting query must see the rows anon cannot select
create or replace function public.client_errors_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.client_errors
        where fingerprint = new.fingerprint and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many reports of this error in the last hour';
  end if;
  return new;
end;
$$;

create trigger client_errors_rate_limit
  before insert on public.client_errors
  for each row execute function public.client_errors_rate_limit();

-- ---------------------------------------------------------------- 4. feedback: rate per user agent
create index if not exists feedback_user_agent_created on public.feedback (user_agent, created_at desc);

create or replace function public.feedback_rate_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (select count(*) from public.feedback
        where user_agent is not distinct from new.user_agent and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'too much feedback from this browser in the last hour';
  end if;
  return new;
end;
$$;

create trigger feedback_rate_limit
  before insert on public.feedback
  for each row execute function public.feedback_rate_limit();

-- ---------------------------------------------------------------- 5. admin_set_role: check FOUND right after the update
create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target = auth.uid() then
    raise exception 'you cannot change your own role';
  end if;
  if new_role not in ('user', 'moderator', 'admin') then
    raise exception 'unknown role';
  end if;
  perform set_config('rs3.admin', 'on', true);
  update public.profiles set role = new_role where id = target;
  if not found then
    raise exception 'user not found';
  end if;
  perform set_config('rs3.admin', 'off', true);
end;
$$;

-- ---------------------------------------------------------------- 6. keybinds: updated_at is server time
create or replace function public.touch_keybinds()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger keybinds_touch
  before insert or update on public.keybinds
  for each row execute function public.touch_keybinds();

-- ---------------------------------------------------------------- 7. grants
-- the client reads / writes these four tables only while signed in; the public paths are the definer RPCs
revoke all on table public.sessions, public.setups, public.keybinds, public.action_bars from anon;

-- admin RPCs: signed-in users only (each one still checks is_admin / is_staff itself)
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_block_user(uuid, text) from public, anon;
revoke execute on function public.admin_unblock_user(uuid) from public, anon;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
revoke execute on function public.admin_rename_user(uuid, text) from public, anon;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_block_user(uuid, text) to authenticated;
grant execute on function public.admin_unblock_user(uuid) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_rename_user(uuid, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
