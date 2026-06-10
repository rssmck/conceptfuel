-- ============================================================
-- Strava integration
-- Run AFTER: coach-athlete-schema.sql, athlete-id-nullable.sql
-- Safe to re-run (IF NOT EXISTS / OR REPLACE throughout)
-- ============================================================


-- ─── ADD 'note' TO training_sessions SESSION TYPE CHECK ──────────────────────
-- The season page supports 'note' sessions; update the check constraint.
alter table training_sessions
  drop constraint if exists training_sessions_session_type_check;
alter table training_sessions
  add constraint training_sessions_session_type_check
    check (session_type in (
      'track', 'gym', 'mobility', 'cross_training',
      'recovery', 'competition', 'psych', 'note'
    ));


-- ─── STRAVA CONNECTIONS ───────────────────────────────────────────────────────
-- One row per athlete. Stores OAuth tokens; refreshed automatically.

create table if not exists strava_connections (
  id                 uuid primary key default gen_random_uuid(),
  athlete_id         uuid not null references profiles(id) on delete cascade,
  strava_athlete_id  bigint not null,
  strava_username    text,
  access_token       text not null,
  refresh_token      text not null,
  token_expires_at   timestamptz not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (athlete_id),
  unique (strava_athlete_id)
);

alter table strava_connections enable row level security;

drop policy if exists "strava_connections: own" on strava_connections;
create policy "strava_connections: own"
  on strava_connections
  for all
  using  (athlete_id = get_my_profile_id())
  with check (athlete_id = get_my_profile_id());


-- ─── ADD STRAVA COLUMNS TO TRAINING SESSIONS ────────────────────────────────

alter table training_sessions
  add column if not exists strava_activity_id bigint,
  add column if not exists strava_data        jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'training_sessions_strava_activity_id_key'
  ) then
    alter table training_sessions
      add constraint training_sessions_strava_activity_id_key
        unique (strava_activity_id);
  end if;
end;
$$;

create index if not exists training_sessions_strava_idx
  on training_sessions(strava_activity_id)
  where strava_activity_id is not null;
