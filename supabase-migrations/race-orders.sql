-- concept//race orders
-- Stores the wizard input and payment status for each purchased plan.
-- Plans are generated deterministically from `input` at view time, so the
-- plan itself is never stored, only the answers that produce it.

create table if not exists public.race_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  input jsonb not null,
  paid boolean not null default false,
  paid_at timestamptz,
  stripe_session_id text
);

create index if not exists race_orders_session_idx
  on public.race_orders (stripe_session_id);

-- RLS on. All reads and writes go through the service-role key in server
-- routes (checkout, webhook) and the server-rendered plan page. No anon or
-- authenticated client touches this table directly, so no permissive policies
-- are created. Service role bypasses RLS by design.
alter table public.race_orders enable row level security;
