-- Roles (user / moderator / admin), blocking, admin panel RPCs.
-- Admins may read and change everything; moderators may only block / unblock plain users.
-- Blocked users keep read access but cannot write anything any more.

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  add column blocked_at timestamptz,
  add column blocked_by uuid,
  add column blocked_reason text check (blocked_reason is null or length(blocked_reason) <= 300);

create index profiles_staff on public.profiles (role) where role <> 'user';

-- first admin
update public.profiles set role = 'admin' where display_name = 'Y0loFrodo'::citext;

-- ---------------------------------------------------------------- role helpers (security definer: usable inside RLS)
create or replace function public.my_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.my_role() = 'admin';
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.my_role() in ('admin', 'moderator');
$$;

create or replace function public.is_blocked()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and blocked_at is not null);
$$;

-- ---------------------------------------------------------------- profiles: role / block fields only through the RPCs
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
  end if;
  return new;
end;
$$;

drop policy "users update their own profile" on public.profiles;
create policy "users update their own profile" on public.profiles
  for update using (auth.uid() = id and not public.is_blocked()) with check (auth.uid() = id);

-- ---------------------------------------------------------------- rotations: admins see and edit everything, blocked users cannot write
drop policy "public rotations are readable by everyone" on public.rotations;
create policy "public rotations are readable by everyone" on public.rotations
  for select using (is_public or auth.uid() = owner_id or public.is_admin());

drop policy "owners insert their rotations" on public.rotations;
create policy "owners insert their rotations" on public.rotations
  for insert with check (auth.uid() = owner_id and not public.is_blocked());

drop policy "owners update their rotations" on public.rotations;
create policy "owners update their rotations" on public.rotations
  for update using ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin())
  with check ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin());

drop policy "owners delete their rotations" on public.rotations;
create policy "owners delete their rotations" on public.rotations
  for delete using ((auth.uid() = owner_id and not public.is_blocked()) or public.is_admin());

-- copy_rotation: blocked users may not copy either
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
  if public.is_blocked() then
    raise exception 'account blocked';
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

-- ---------------------------------------------------------------- keybinds / action bars / sessions: no writes while blocked
drop policy "users manage their own keybinds" on public.keybinds;
create policy "users read their own keybinds" on public.keybinds
  for select using (auth.uid() = user_id);
create policy "users write their own keybinds" on public.keybinds
  for insert with check (auth.uid() = user_id and not public.is_blocked());
create policy "users update their own keybinds" on public.keybinds
  for update using (auth.uid() = user_id and not public.is_blocked()) with check (auth.uid() = user_id);
create policy "users delete their own keybinds" on public.keybinds
  for delete using (auth.uid() = user_id and not public.is_blocked());

drop policy "users manage their own action bars" on public.action_bars;
create policy "users read their own action bars" on public.action_bars
  for select using (auth.uid() = user_id);
create policy "users write their own action bars" on public.action_bars
  for insert with check (auth.uid() = user_id and not public.is_blocked());
create policy "users update their own action bars" on public.action_bars
  for update using (auth.uid() = user_id and not public.is_blocked()) with check (auth.uid() = user_id);
create policy "users delete their own action bars" on public.action_bars
  for delete using (auth.uid() = user_id and not public.is_blocked());

drop policy "users insert their own sessions" on public.sessions;
create policy "users insert their own sessions" on public.sessions
  for insert with check (auth.uid() = user_id and not public.is_blocked());

-- ---------------------------------------------------------------- feedback: staff may read, admins may delete
create policy "staff read feedback" on public.feedback
  for select using (public.is_staff());
create policy "admins delete feedback" on public.feedback
  for delete using (public.is_admin());

-- ---------------------------------------------------------------- admin panel RPCs
-- user list with auth data; e-mail only for admins
create or replace function public.admin_list_users()
returns table (
  id uuid, display_name text, role text, blocked_at timestamptz, blocked_reason text, blocked_by_name text,
  created_at timestamptz, email text, email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  rotations bigint, public_rotations bigint, sessions bigint, keybinds bigint, has_action_bars boolean
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
           (select count(*) from public.rotations r where r.owner_id = p.id),
           (select count(*) from public.rotations r where r.owner_id = p.id and r.is_public),
           (select count(*) from public.sessions s where s.user_id = p.id),
           (select count(*) from public.keybinds k where k.user_id = p.id),
           exists (select 1 from public.action_bars a where a.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profiles b on b.id = p.blocked_by
    order by p.created_at desc;
end;
$$;

-- block / unblock: moderators only plain users, admins everyone except themselves and other admins
create or replace function public.admin_block_user(target uuid, reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  if target = auth.uid() then
    raise exception 'you cannot block yourself';
  end if;
  select role into target_role from public.profiles where id = target;
  if target_role is null then
    raise exception 'user not found';
  end if;
  if target_role = 'admin' or (target_role = 'moderator' and not public.is_admin()) then
    raise exception 'not allowed for this user';
  end if;
  perform set_config('rs3.admin', 'on', true);
  update public.profiles set blocked_at = now(), blocked_by = auth.uid(), blocked_reason = left(reason, 300) where id = target;
  perform set_config('rs3.admin', 'off', true);
end;
$$;

create or replace function public.admin_unblock_user(target uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_staff() then
    raise exception 'staff only';
  end if;
  select role into target_role from public.profiles where id = target;
  if target_role is null then
    raise exception 'user not found';
  end if;
  if target_role <> 'user' and not public.is_admin() then
    raise exception 'not allowed for this user';
  end if;
  perform set_config('rs3.admin', 'on', true);
  update public.profiles set blocked_at = null, blocked_by = null, blocked_reason = null where id = target;
  perform set_config('rs3.admin', 'off', true);
end;
$$;

-- role changes: admins only, never their own role
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
  perform set_config('rs3.admin', 'off', true);
  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

-- rename any user (admins)
create or replace function public.admin_rename_user(target uuid, new_name text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  update public.profiles set display_name = new_name::citext where id = target;
  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

-- delete any account (admins, not themselves): auth user goes, everything else cascades
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if target = auth.uid() then
    raise exception 'use "delete my account" for your own account';
  end if;
  delete from auth.users where id = target;
  if not found then
    raise exception 'user not found';
  end if;
end;
$$;
