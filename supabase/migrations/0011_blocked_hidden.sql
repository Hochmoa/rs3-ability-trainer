-- Blocked users disappear from the explorer: public_profiles (the only name source of public_rotations) lists
-- unblocked users only, so their public rotations are no longer joined in. The shared-setup RPCs (0007) already
-- exclude blocked users; the owner still sees their own rotations through the rotations table.
create or replace view public.public_profiles
with (security_invoker = false) as
  select id, display_name from public.profiles where blocked_at is null;

grant select on public.public_profiles to anon, authenticated;
