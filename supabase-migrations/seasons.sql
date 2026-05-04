-- ============================================================
-- Seasons: macro periodisation container
-- Run after provisional-athletes.sql and athlete-id-nullable.sql
-- ============================================================

create table if not exists seasons (
  id                     uuid primary key default gen_random_uuid(),
  provisional_athlete_id uuid references provisional_athletes(id) on delete cascade,
  athlete_id             uuid references profiles(id) on delete cascade,
  coach_id               uuid not null references profiles(id) on delete cascade,
  name                   text not null,
  season_type            text not null default 'outdoor_track',
  -- outdoor_track | indoor_track | cross_country | road | marathon | trail | other
  start_date             date,
  end_date               date,
  goal                   text,
  target_event           text,
  target_performance     text,
  target_date            date,
  status                 text not null default 'planning',
  -- planning | active | complete | archived
  notes                  text,
  created_at             timestamptz not null default now(),
  constraint seasons_athlete_check
    check (athlete_id is not null or provisional_athlete_id is not null)
);

alter table seasons enable row level security;

create policy "Coach manages seasons"
  on seasons for all
  using  (coach_id = (select id from profiles where id = auth.uid() limit 1))
  with check (coach_id = (select id from profiles where id = auth.uid() limit 1));

-- Link planning tables to seasons
alter table season_phases add column if not exists season_id uuid references seasons(id) on delete set null;
alter table competitions  add column if not exists season_id uuid references seasons(id) on delete set null;
