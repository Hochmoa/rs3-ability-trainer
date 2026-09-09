-- Session traces (src/app/core/trace.ts): everything a training session did, uploaded with the account so a
-- report ("schau die letzte Interaction an") can be read off the server with tools/trace-report.py.
-- Users write and read their own; staff read all. Only the last 20 per user are kept.

create table public.session_traces (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  rotation_name text not null,
  build text,
  reason text,
  events integer not null default 0,
  trace jsonb not null,
  created_at timestamptz not null default now()
);

create index session_traces_user on public.session_traces (user_id, started_at desc);

alter table public.session_traces enable row level security;

create policy "users write their own traces" on public.session_traces
  for insert with check (auth.uid() = user_id);

create policy "users read their own traces, staff all" on public.session_traces
  for select using (auth.uid() = user_id or public.is_staff());

create policy "users delete their own traces" on public.session_traces
  for delete using (auth.uid() = user_id);

-- a trace is a few hundred KB; keep the last 20 per account
create or replace function public.session_traces_prune()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.session_traces
  where user_id = new.user_id
    and id not in (
      select id from public.session_traces where user_id = new.user_id order by started_at desc limit 20
    );
  return new;
end;
$$;

create trigger session_traces_prune
  after insert on public.session_traces
  for each row execute function public.session_traces_prune();

-- delete_my_account (0006) removes the profile; the cascade takes the traces with it
