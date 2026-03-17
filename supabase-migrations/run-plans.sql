-- concept//run — run plan tables

create table if not exists run_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  tier            int not null check (tier between 1 and 4),

  -- Goal
  goal_race       text not null, -- 'parkrun' | '5k' | '10k' | 'half' | 'marathon' | 'ultra' | 'hyrox' | 'fitness'
  race_date       date,
  target_time     text,              -- 'HH:MM:SS' optional
  elevation_profile text default 'flat', -- 'flat' | 'undulating' | 'hilly' | 'mountain'

  -- Current fitness
  weekly_km       decimal(6,2),
  longest_recent_km decimal(5,2),
  recent_race_distance text,         -- '5k' | '10k' | 'half' | 'marathon'
  recent_race_time    text,          -- 'HH:MM:SS' used for VDOT
  lt_pace         text,              -- 'MM:SS' per km — optional
  vo2max          decimal(5,2),      -- optional

  -- Prefs
  days_per_week       int,
  available_days      text[],
  club_night          text,          -- day name or null
  club_session_type   text,          -- 'track' | 'road' | 'unknown'
  gym_access          boolean default false,
  include_strength    boolean default false,
  include_mobility    boolean default false,
  training_approach   text default 'standard', -- 'standard' | 'norwegian'

  -- Derived
  training_zones  jsonb,             -- { easy, tempo, threshold, interval, rep } as MM:SS/km strings
  vdot            decimal(5,2),

  -- Plan
  weeks           jsonb not null default '[]'::jsonb,
  plan_weeks      int not null default 8,
  starts_on       date not null default current_date,

  -- State
  status          text default 'active', -- 'active' | 'paused' | 'complete'
  pause_reason    text,
  active          boolean default true,
  created_at      timestamptz not null default now()
);

create table if not exists run_completions (
  id              uuid primary key default gen_random_uuid(),
  plan_id         uuid references run_plans(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,
  week_number     int not null,
  session_index   int not null,
  completed_at    timestamptz not null default now(),
  actual_km       decimal(6,2),
  actual_duration_min int,
  effort          int check (effort between 1 and 10),
  strava_activity_id text,
  notes           text,
  unique(plan_id, week_number, session_index)
);

alter table run_plans enable row level security;
alter table run_completions enable row level security;

drop policy if exists "Users manage own run plans" on run_plans;
create policy "Users manage own run plans"
  on run_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own run completions" on run_completions;
create policy "Users manage own run completions"
  on run_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
