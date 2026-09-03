-- User feedback ("report a bug / suggest something"). Anyone may insert, nobody may read through the API;
-- the owner reads the table in the Supabase dashboard. user_id is set only for logged-in senders and must be
-- their own id; anonymous senders may leave an optional contact address.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text,
  kind text not null check (kind in ('bug', 'suggestion')),
  message text not null check (length(message) between 5 and 4000),
  contact text check (contact is null or length(contact) <= 200),
  page text check (page is null or length(page) <= 200),
  user_agent text check (user_agent is null or length(user_agent) <= 500)
);

alter table public.feedback enable row level security;

create policy "anyone may send feedback" on public.feedback
  for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());

-- no select / update / delete policies: the API cannot read feedback back
