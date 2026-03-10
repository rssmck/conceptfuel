create table if not exists training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  goal text not null,
  training_style text not null,
  days_per_week int not null check (days_per_week between 2 and 5),
  block_weeks int not null check (block_weeks in (4, 6, 8)),
  starts_on date not null default current_date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  sessions jsonb not null default '[]'::jsonb
);

create table if not exists plan_completions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references training_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_number int not null,
  session_index int not null,
  completed_at timestamptz not null default now(),
  unique(plan_id, week_number, session_index)
);

alter table training_plans enable row level security;
alter table plan_completions enable row level security;

drop policy if exists "Users manage own plans" on training_plans;
create policy "Users manage own plans"
  on training_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own completions" on plan_completions;
create policy "Users manage own completions"
  on plan_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
