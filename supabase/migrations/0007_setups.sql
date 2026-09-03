-- Setups: settings, loadouts and the enemy config per account (synced like the action bars), plus a
-- public overview. On the "Setups" page anyone – signed in or not – can look at a user's complete
-- setup (settings, loadouts, keybinds, action bars) and load it into their own browser.
-- Sharing is on by default and can be switched off on the account page (is_public).
create table public.setups (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  -- {"loadouts": [Loadout, ...], "active": "<loadout id>"} exactly as the frontend stores it
  loadouts jsonb not null check (jsonb_typeof(loadouts) = 'object' and (loadouts ? 'loadouts')),
  enemy jsonb check (enemy is null or jsonb_typeof(enemy) = 'object'),
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create index setups_public_updated on public.setups (updated_at desc) where is_public;

alter table public.setups enable row level security;

create policy "users read their own setup" on public.setups
  for select using (auth.uid() = user_id or public.is_admin());
create policy "users write their own setup" on public.setups
  for insert with check (auth.uid() = user_id and not public.is_blocked());
create policy "users update their own setup" on public.setups
  for update using ((auth.uid() = user_id and not public.is_blocked()) or public.is_admin())
  with check ((auth.uid() = user_id and not public.is_blocked()) or public.is_admin());
create policy "users delete their own setup" on public.setups
  for delete using ((auth.uid() = user_id and not public.is_blocked()) or public.is_admin());

-- updated_at is always server time
create or replace function public.touch_setups()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger setups_touch
  before insert or update on public.setups
  for each row execute function public.touch_setups();

-- ---------------------------------------------------------------- public overview (anon may call both)
-- The keybinds and action_bars tables stay owner-only; these two functions are the only public read path
-- and only expose users whose setup is shared and who are not blocked.
create or replace function public.list_public_setups()
returns table (
  user_id uuid, display_name text, updated_at timestamptz, settings jsonb,
  loadout_names text[], keybinds bigint, has_action_bars boolean
)
language sql
stable
security definer set search_path = public
as $$
  select s.user_id, p.display_name::text, s.updated_at, s.settings,
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

create or replace function public.get_public_setup(target uuid)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'user_id', s.user_id,
    'display_name', p.display_name,
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
