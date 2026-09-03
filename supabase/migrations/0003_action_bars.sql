-- Action bar setup (18 presets, positions, style bindings, slot + weapon keybinds) per account,
-- stored as one JSON document, synced across devices like keybinds.
create table public.action_bars (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  setup jsonb not null check (jsonb_typeof(setup) = 'object' and (setup ? 'presets')),
  updated_at timestamptz not null default now()
);

alter table public.action_bars enable row level security;

create policy "users manage their own action bars" on public.action_bars
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at is always server time
create or replace function public.touch_action_bars()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger action_bars_touch
  before insert or update on public.action_bars
  for each row execute function public.touch_action_bars();
