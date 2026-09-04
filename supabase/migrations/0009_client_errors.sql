-- Front-end error reports: every uncaught error in the app is sent here (core/error-report.service.ts) and shown
-- to staff on the admin page. Anyone may insert (the app runs without an account), only staff may read, only
-- admins may delete. user_id is the sender's own id or null; fingerprint groups repeats of the same error.
create table public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text check (display_name is null or length(display_name) <= 40),
  source text not null check (source in ('angular', 'error', 'unhandledrejection', 'manual')),
  message text not null check (length(message) between 1 and 2000),
  stack text check (stack is null or length(stack) <= 8000),
  fingerprint text not null check (length(fingerprint) <= 64),
  page text check (page is null or length(page) <= 300),
  build text check (build is null or length(build) <= 60),
  user_agent text check (user_agent is null or length(user_agent) <= 500),
  extra jsonb
);

create index client_errors_created on public.client_errors (created_at desc);
create index client_errors_fingerprint on public.client_errors (fingerprint, created_at desc);

alter table public.client_errors enable row level security;

create policy "anyone may report an error" on public.client_errors
  for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());

create policy "staff read errors" on public.client_errors
  for select using (public.is_staff());

create policy "admins delete errors" on public.client_errors
  for delete using (public.is_admin());
