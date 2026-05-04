-- ============================================================
-- concept//coach + concept//athlete — schema migration
-- ============================================================
-- Run in the Supabase SQL editor (project dashboard > SQL editor).
-- Existing tables (training_plans, plan_completions) are untouched.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- ============================================================


-- ─── UPDATED_AT TRIGGER FUNCTION ─────────────────────────────────────────────

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends auth.users. One row per user.

create table if not exists profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null unique,
  role             text not null default 'athlete' check (role in ('athlete', 'coach', 'admin')),
  full_name        text,
  date_of_birth    date,
  club             text,
  county           text,
  nation           text,
  classification   text,       -- T38, T47, etc. Nullable for non-para athletes.
  event_group      text,       -- sprints / middle_distance / throws / jumps / combined
  preferred_events text[],     -- e.g. ARRAY['100m', '200m']
  coach_notes      text,
  athlete_notes    text,
  avatar_url       text,
  onboarded        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on profiles(user_id);

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function handle_updated_at();


-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────────────────────
-- Creates a minimal profile row (role=athlete) when a new auth user is created.
-- Role and details are completed during onboarding.

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (user_id, role, full_name)
  values (
    new.id,
    'athlete',
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ─── COACH_ATHLETE ────────────────────────────────────────────────────────────
-- Many-to-many: an athlete can have multiple coaches (head, S&C, physio, etc.).

create table if not exists coach_athlete (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid references profiles(id) on delete cascade not null,
  athlete_id  uuid references profiles(id) on delete cascade not null,
  role_label  text not null default 'Head coach',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(coach_id, athlete_id)
);

create index if not exists coach_athlete_coach_idx   on coach_athlete(coach_id);
create index if not exists coach_athlete_athlete_idx on coach_athlete(athlete_id);

drop trigger if exists coach_athlete_updated_at on coach_athlete;
create trigger coach_athlete_updated_at
  before update on coach_athlete
  for each row execute function handle_updated_at();


-- ─── SEASON PHASES ────────────────────────────────────────────────────────────

create table if not exists season_phases (
  id          uuid primary key default gen_random_uuid(),
  athlete_id  uuid references profiles(id) on delete cascade not null,
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  color       text not null default '#4a9eff',
  focus       text,
  coach_notes text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists season_phases_athlete_idx
  on season_phases(athlete_id, start_date, end_date);

drop trigger if exists season_phases_updated_at on season_phases;
create trigger season_phases_updated_at
  before update on season_phases
  for each row execute function handle_updated_at();


-- ─── COMPETITIONS ─────────────────────────────────────────────────────────────

create table if not exists competitions (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  date             date not null,
  end_date         date,
  venue            text,
  meeting          text,
  events           jsonb not null default '[]',
  priority         text not null default 'prep'
                     check (priority in ('prep', 'gate', 'key', 'A')),
  purpose          text,
  result_summary   text,
  status           text not null default 'upcoming'
                     check (status in ('upcoming', 'confirmed', 'completed', 'withdrawn')),
  withdrawn_reason text,
  travel_notes     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists competitions_athlete_date_idx
  on competitions(athlete_id, date);

drop trigger if exists competitions_updated_at on competitions;
create trigger competitions_updated_at
  before update on competitions
  for each row execute function handle_updated_at();


-- ─── TRAINING SESSIONS ────────────────────────────────────────────────────────

create table if not exists training_sessions (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  coach_id         uuid references profiles(id) on delete set null,
  phase_id         uuid references season_phases(id) on delete set null,
  date             date not null,
  session_type     text not null
                     check (session_type in (
                       'track', 'gym', 'mobility', 'cross_training',
                       'recovery', 'competition', 'psych'
                     )),
  title            text not null,
  description      text,
  planned          jsonb,
  actual           jsonb,
  session_rpe      integer check (session_rpe between 1 and 10),
  coach_rating     integer check (coach_rating between 1 and 5),
  duration_minutes integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists training_sessions_athlete_date_idx
  on training_sessions(athlete_id, date);

drop trigger if exists training_sessions_updated_at on training_sessions;
create trigger training_sessions_updated_at
  before update on training_sessions
  for each row execute function handle_updated_at();


-- ─── SESSION CUES ─────────────────────────────────────────────────────────────
-- Highlighted cues are the primary display element in the athlete session view.

create table if not exists session_cues (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid references training_sessions(id) on delete cascade not null,
  body              text not null,
  category          text not null default 'technical'
                      check (category in ('technical', 'tactical', 'psychological', 'physical')),
  "order"           integer not null default 0,
  highlighted       boolean not null default false,
  source            text not null default 'manual'
                      check (source in ('generated', 'manual')),
  athlete_response  text check (athlete_response in ('applied', 'partial', 'missed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists session_cues_session_idx on session_cues(session_id);

drop trigger if exists session_cues_updated_at on session_cues;
create trigger session_cues_updated_at
  before update on session_cues
  for each row execute function handle_updated_at();


-- ─── CUE LIBRARY ─────────────────────────────────────────────────────────────
-- Reusable cues per coach. athlete_id null = available to all of the coach's athletes.

create table if not exists cue_library (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid references profiles(id) on delete cascade not null,
  athlete_id  uuid references profiles(id) on delete set null,
  body        text not null,
  category    text not null default 'technical'
                check (category in ('technical', 'tactical', 'psychological', 'physical')),
  event_group text,
  tags        text[],
  use_count   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cue_library_coach_idx on cue_library(coach_id);

drop trigger if exists cue_library_updated_at on cue_library;
create trigger cue_library_updated_at
  before update on cue_library
  for each row execute function handle_updated_at();


-- ─── STRENGTH LOGS ────────────────────────────────────────────────────────────

create table if not exists strength_logs (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references training_sessions(id) on delete cascade not null,
  athlete_id  uuid references profiles(id) on delete cascade not null,
  exercise    text not null,
  sets        integer,
  reps        text,      -- text allows '8-10', 'AMRAP', etc.
  load_kg     numeric,
  notes       text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists strength_logs_session_idx on strength_logs(session_id);

drop trigger if exists strength_logs_updated_at on strength_logs;
create trigger strength_logs_updated_at
  before update on strength_logs
  for each row execute function handle_updated_at();


-- ─── MOBILITY ASSESSMENTS ─────────────────────────────────────────────────────

create table if not exists mobility_assessments (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid references profiles(id) on delete cascade not null,
  assessed_by  uuid references profiles(id) on delete set null,
  date         date not null,
  scores       jsonb not null default '{}',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists mobility_assessments_athlete_date_idx
  on mobility_assessments(athlete_id, date);

drop trigger if exists mobility_assessments_updated_at on mobility_assessments;
create trigger mobility_assessments_updated_at
  before update on mobility_assessments
  for each row execute function handle_updated_at();


-- ─── UPLOADS ──────────────────────────────────────────────────────────────────

create table if not exists uploads (
  id            uuid primary key default gen_random_uuid(),
  uploaded_by   uuid references profiles(id) on delete cascade not null,
  athlete_id    uuid references profiles(id) on delete cascade not null,
  filename      text not null,
  storage_path  text not null,
  file_type     text not null check (file_type in ('csv', 'pdf', 'image', 'other')),
  processed     boolean not null default false,
  parsed_data   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists uploads_athlete_idx on uploads(athlete_id);

drop trigger if exists uploads_updated_at on uploads;
create trigger uploads_updated_at
  before update on uploads
  for each row execute function handle_updated_at();


-- ─── RESULTS ──────────────────────────────────────────────────────────────────

create table if not exists results (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  date             date not null,
  event            text not null,
  performance      text not null,
  wind             text,
  position         integer,
  venue            text,
  meeting          text,
  round            text check (round in ('heat', 'semi', 'final', 'time_trial', 'other')),
  notes            text,
  manually_entered boolean not null default true,
  source_file_id   uuid references uploads(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists results_athlete_date_idx on results(athlete_id, date);

drop trigger if exists results_updated_at on results;
create trigger results_updated_at
  before update on results
  for each row execute function handle_updated_at();


-- ─── PERSONAL BESTS ───────────────────────────────────────────────────────────
-- One row per athlete per event. Upsert when a new PB is set.

create table if not exists personal_bests (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  event            text not null,
  performance      text not null,
  wind             text,
  date             date,
  venue            text,
  meeting          text,
  manually_entered boolean not null default true,
  source_file_id   uuid references uploads(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(athlete_id, event)
);

create index if not exists personal_bests_athlete_idx on personal_bests(athlete_id);

drop trigger if exists personal_bests_updated_at on personal_bests;
create trigger personal_bests_updated_at
  before update on personal_bests
  for each row execute function handle_updated_at();


-- ─── RANKINGS ─────────────────────────────────────────────────────────────────

create table if not exists rankings (
  id              uuid primary key default gen_random_uuid(),
  athlete_id      uuid references profiles(id) on delete cascade not null,
  event           text not null,
  classification  text,
  scope           text not null check (scope in ('national', 'regional', 'world')),
  rank            integer not null,
  season          integer not null,
  recorded_at     date not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists rankings_athlete_idx on rankings(athlete_id, season);

drop trigger if exists rankings_updated_at on rankings;
create trigger rankings_updated_at
  before update on rankings
  for each row execute function handle_updated_at();


-- ─── COMMENTS ─────────────────────────────────────────────────────────────────
-- Attached to any entity. Pinned comment surfaces as headline in calendar tiles.

create table if not exists comments (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid references profiles(id) on delete cascade not null,
  entity_type  text not null check (entity_type in (
    'result', 'competition', 'training_session', 'phase',
    'assessment', 'psych_session', 'mood_entry', 'visualisation_script'
  )),
  entity_id    uuid not null,
  body         text not null,
  rating       integer check (rating between 1 and 5),
  pinned       boolean not null default false,
  edited_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists comments_entity_idx on comments(entity_type, entity_id);
create index if not exists comments_author_idx  on comments(author_id);

drop trigger if exists comments_updated_at on comments;
create trigger comments_updated_at
  before update on comments
  for each row execute function handle_updated_at();


-- ─── PSYCH SESSIONS ───────────────────────────────────────────────────────────

create table if not exists psych_sessions (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  coach_id         uuid references profiles(id) on delete set null,
  date             date not null,
  type             text not null check (type in (
    'visualisation', 'self_talk', 'anxiety_regulation',
    'focus_training', 'confidence_building', 'pre_competition_routine'
  )),
  duration_minutes integer,
  description      text,
  notes            text,
  coach_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists psych_sessions_athlete_date_idx
  on psych_sessions(athlete_id, date);

drop trigger if exists psych_sessions_updated_at on psych_sessions;
create trigger psych_sessions_updated_at
  before update on psych_sessions
  for each row execute function handle_updated_at();


-- ─── VISUALISATION SCRIPTS ────────────────────────────────────────────────────

create table if not exists visualisation_scripts (
  id            uuid primary key default gen_random_uuid(),
  athlete_id    uuid references profiles(id) on delete cascade not null,
  coach_id      uuid references profiles(id) on delete set null,
  title         text not null,
  body          text not null,
  script_type   text not null default 'race'
                  check (script_type in ('race', 'session', 'general')),
  event         text,
  published     boolean not null default false,
  last_read_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists visualisation_scripts_athlete_idx
  on visualisation_scripts(athlete_id);

drop trigger if exists visualisation_scripts_updated_at on visualisation_scripts;
create trigger visualisation_scripts_updated_at
  before update on visualisation_scripts
  for each row execute function handle_updated_at();


-- ─── PRE-COMPETITION ROUTINES ─────────────────────────────────────────────────
-- steps jsonb: [{minutes_before_race, activity, cue, notes}]

create table if not exists competition_routines (
  id           uuid primary key default gen_random_uuid(),
  athlete_id   uuid references profiles(id) on delete cascade not null,
  coach_id     uuid references profiles(id) on delete set null,
  title        text not null,
  steps        jsonb not null default '[]',
  is_template  boolean not null default false,
  event        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists competition_routines_athlete_idx
  on competition_routines(athlete_id);

drop trigger if exists competition_routines_updated_at on competition_routines;
create trigger competition_routines_updated_at
  before update on competition_routines
  for each row execute function handle_updated_at();


-- ─── MOOD AND READINESS ───────────────────────────────────────────────────────
-- One entry per athlete per day. Completed by athlete at session/competition start.

create table if not exists mood_and_readiness (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid references profiles(id) on delete cascade not null,
  date             date not null,
  session_id       uuid references training_sessions(id) on delete set null,
  readiness_score  integer not null check (readiness_score between 1 and 10),
  mood             text not null check (mood in (
    'focused', 'anxious', 'flat', 'motivated', 'fatigued', 'confident'
  )),
  sleep_quality    integer check (sleep_quality between 1 and 5),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(athlete_id, date)
);

create index if not exists mood_and_readiness_athlete_date_idx
  on mood_and_readiness(athlete_id, date);

drop trigger if exists mood_and_readiness_updated_at on mood_and_readiness;
create trigger mood_and_readiness_updated_at
  before update on mood_and_readiness
  for each row execute function handle_updated_at();


-- ============================================================
-- HELPER FUNCTIONS  (used by RLS policies below)
-- ============================================================

create or replace function get_my_profile_id()
returns uuid
language sql security definer stable
as $$
  select id from profiles where user_id = auth.uid() limit 1;
$$;

create or replace function is_coach_of(athlete_profile_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from coach_athlete
    where coach_id    = get_my_profile_id()
      and athlete_id  = athlete_profile_id
      and active      = true
  );
$$;

create or replace function is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ─── profiles ─────────────────────────────────────────────────────────────────

alter table profiles enable row level security;

drop policy if exists "profiles: own read"            on profiles;
drop policy if exists "profiles: athlete read by coach" on profiles;
drop policy if exists "profiles: own insert"          on profiles;
drop policy if exists "profiles: own update"          on profiles;

create policy "profiles: own read"
  on profiles for select
  using (user_id = auth.uid() or is_admin());

create policy "profiles: athlete read by coach"
  on profiles for select
  using (is_coach_of(id));

create policy "profiles: own insert"
  on profiles for insert
  with check (user_id = auth.uid());

create policy "profiles: own update"
  on profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ─── coach_athlete ────────────────────────────────────────────────────────────

alter table coach_athlete enable row level security;

drop policy if exists "coach_athlete: coach manages"         on coach_athlete;
drop policy if exists "coach_athlete: athlete reads own"     on coach_athlete;

create policy "coach_athlete: coach manages"
  on coach_athlete for all
  using  (coach_id = get_my_profile_id() or is_admin())
  with check (coach_id = get_my_profile_id());

create policy "coach_athlete: athlete reads own"
  on coach_athlete for select
  using (athlete_id = get_my_profile_id());


-- ─── season_phases ────────────────────────────────────────────────────────────

alter table season_phases enable row level security;

drop policy if exists "season_phases: read"   on season_phases;
drop policy if exists "season_phases: write"  on season_phases;
drop policy if exists "season_phases: update" on season_phases;
drop policy if exists "season_phases: delete" on season_phases;

create policy "season_phases: read"
  on season_phases for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "season_phases: write"
  on season_phases for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "season_phases: update"
  on season_phases for update
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "season_phases: delete"
  on season_phases for delete
  using (is_coach_of(athlete_id) or is_admin());


-- ─── competitions ─────────────────────────────────────────────────────────────

alter table competitions enable row level security;

drop policy if exists "competitions: read"   on competitions;
drop policy if exists "competitions: insert" on competitions;
drop policy if exists "competitions: update" on competitions;
drop policy if exists "competitions: delete" on competitions;

create policy "competitions: read"
  on competitions for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "competitions: insert"
  on competitions for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "competitions: update"
  on competitions for update
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "competitions: delete"
  on competitions for delete
  using (is_coach_of(athlete_id) or is_admin());


-- ─── training_sessions ────────────────────────────────────────────────────────

alter table training_sessions enable row level security;

drop policy if exists "training_sessions: read"   on training_sessions;
drop policy if exists "training_sessions: insert" on training_sessions;
drop policy if exists "training_sessions: update" on training_sessions;
drop policy if exists "training_sessions: delete" on training_sessions;

create policy "training_sessions: read"
  on training_sessions for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "training_sessions: insert"
  on training_sessions for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "training_sessions: update"
  on training_sessions for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "training_sessions: delete"
  on training_sessions for delete
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id() or is_admin());


-- ─── session_cues ─────────────────────────────────────────────────────────────

alter table session_cues enable row level security;

drop policy if exists "session_cues: read"   on session_cues;
drop policy if exists "session_cues: insert" on session_cues;
drop policy if exists "session_cues: update" on session_cues;
drop policy if exists "session_cues: delete" on session_cues;

create policy "session_cues: read"
  on session_cues for select
  using (
    exists (
      select 1 from training_sessions ts
      where ts.id = session_id
        and (ts.athlete_id = get_my_profile_id() or is_coach_of(ts.athlete_id) or is_admin())
    )
  );

create policy "session_cues: insert"
  on session_cues for insert
  with check (
    exists (
      select 1 from training_sessions ts
      where ts.id = session_id
        and (is_coach_of(ts.athlete_id) or ts.athlete_id = get_my_profile_id())
    )
  );

create policy "session_cues: update"
  on session_cues for update
  using (
    exists (
      select 1 from training_sessions ts
      where ts.id = session_id
        and (ts.athlete_id = get_my_profile_id() or is_coach_of(ts.athlete_id))
    )
  );

create policy "session_cues: delete"
  on session_cues for delete
  using (
    exists (
      select 1 from training_sessions ts
      where ts.id = session_id
        and (is_coach_of(ts.athlete_id) or is_admin())
    )
  );


-- ─── cue_library ──────────────────────────────────────────────────────────────

alter table cue_library enable row level security;

drop policy if exists "cue_library: coach manages" on cue_library;

create policy "cue_library: coach manages"
  on cue_library for all
  using  (coach_id = get_my_profile_id() or is_admin())
  with check (coach_id = get_my_profile_id());


-- ─── strength_logs ────────────────────────────────────────────────────────────

alter table strength_logs enable row level security;

drop policy if exists "strength_logs: read"   on strength_logs;
drop policy if exists "strength_logs: insert" on strength_logs;
drop policy if exists "strength_logs: update" on strength_logs;
drop policy if exists "strength_logs: delete" on strength_logs;

create policy "strength_logs: read"
  on strength_logs for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "strength_logs: insert"
  on strength_logs for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "strength_logs: update"
  on strength_logs for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "strength_logs: delete"
  on strength_logs for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());


-- ─── mobility_assessments ─────────────────────────────────────────────────────

alter table mobility_assessments enable row level security;

drop policy if exists "mobility_assessments: read"   on mobility_assessments;
drop policy if exists "mobility_assessments: insert" on mobility_assessments;
drop policy if exists "mobility_assessments: update" on mobility_assessments;
drop policy if exists "mobility_assessments: delete" on mobility_assessments;

create policy "mobility_assessments: read"
  on mobility_assessments for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "mobility_assessments: insert"
  on mobility_assessments for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "mobility_assessments: update"
  on mobility_assessments for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "mobility_assessments: delete"
  on mobility_assessments for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());


-- ─── uploads ──────────────────────────────────────────────────────────────────

alter table uploads enable row level security;

drop policy if exists "uploads: read"   on uploads;
drop policy if exists "uploads: insert" on uploads;
drop policy if exists "uploads: delete" on uploads;

create policy "uploads: read"
  on uploads for select
  using (
    athlete_id = get_my_profile_id()
    or uploaded_by = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
  );

create policy "uploads: insert"
  on uploads for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "uploads: delete"
  on uploads for delete
  using (uploaded_by = get_my_profile_id() or is_admin());


-- ─── results ──────────────────────────────────────────────────────────────────

alter table results enable row level security;

drop policy if exists "results: read"   on results;
drop policy if exists "results: insert" on results;
drop policy if exists "results: update" on results;
drop policy if exists "results: delete" on results;

create policy "results: read"
  on results for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "results: insert"
  on results for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "results: update"
  on results for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "results: delete"
  on results for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());


-- ─── personal_bests ───────────────────────────────────────────────────────────

alter table personal_bests enable row level security;

drop policy if exists "personal_bests: read"   on personal_bests;
drop policy if exists "personal_bests: insert" on personal_bests;
drop policy if exists "personal_bests: update" on personal_bests;
drop policy if exists "personal_bests: delete" on personal_bests;

create policy "personal_bests: read"
  on personal_bests for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "personal_bests: insert"
  on personal_bests for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "personal_bests: update"
  on personal_bests for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "personal_bests: delete"
  on personal_bests for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());


-- ─── rankings ─────────────────────────────────────────────────────────────────

alter table rankings enable row level security;

drop policy if exists "rankings: read"   on rankings;
drop policy if exists "rankings: insert" on rankings;
drop policy if exists "rankings: update" on rankings;
drop policy if exists "rankings: delete" on rankings;

create policy "rankings: read"
  on rankings for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "rankings: insert"
  on rankings for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "rankings: update"
  on rankings for update
  using (is_coach_of(athlete_id) or is_admin());

create policy "rankings: delete"
  on rankings for delete
  using (is_coach_of(athlete_id) or is_admin());


-- ─── comments ─────────────────────────────────────────────────────────────────
-- Readable by both parties in any shared coach-athlete relationship with the author.

alter table comments enable row level security;

drop policy if exists "comments: read"   on comments;
drop policy if exists "comments: insert" on comments;
drop policy if exists "comments: update" on comments;
drop policy if exists "comments: delete" on comments;

create policy "comments: read"
  on comments for select
  using (
    author_id = get_my_profile_id()
    or is_admin()
    or exists (
      select 1 from coach_athlete ca
      where ca.active = true
        and (
          (ca.coach_id   = get_my_profile_id() and ca.athlete_id = author_id)
          or (ca.athlete_id = get_my_profile_id() and ca.coach_id   = author_id)
        )
    )
  );

create policy "comments: insert"
  on comments for insert
  with check (author_id = get_my_profile_id());

create policy "comments: update"
  on comments for update
  using (author_id = get_my_profile_id());

create policy "comments: delete"
  on comments for delete
  using (author_id = get_my_profile_id() or is_admin());


-- ─── psych_sessions ───────────────────────────────────────────────────────────

alter table psych_sessions enable row level security;

drop policy if exists "psych_sessions: read"   on psych_sessions;
drop policy if exists "psych_sessions: insert" on psych_sessions;
drop policy if exists "psych_sessions: update" on psych_sessions;
drop policy if exists "psych_sessions: delete" on psych_sessions;

create policy "psych_sessions: read"
  on psych_sessions for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "psych_sessions: insert"
  on psych_sessions for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "psych_sessions: update"
  on psych_sessions for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id));

create policy "psych_sessions: delete"
  on psych_sessions for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());


-- ─── visualisation_scripts ────────────────────────────────────────────────────

alter table visualisation_scripts enable row level security;

drop policy if exists "visualisation_scripts: read"   on visualisation_scripts;
drop policy if exists "visualisation_scripts: insert" on visualisation_scripts;
drop policy if exists "visualisation_scripts: update" on visualisation_scripts;
drop policy if exists "visualisation_scripts: delete" on visualisation_scripts;

create policy "visualisation_scripts: read"
  on visualisation_scripts for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "visualisation_scripts: insert"
  on visualisation_scripts for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "visualisation_scripts: update"
  on visualisation_scripts for update
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "visualisation_scripts: delete"
  on visualisation_scripts for delete
  using (is_coach_of(athlete_id) or is_admin());


-- ─── competition_routines ─────────────────────────────────────────────────────

alter table competition_routines enable row level security;

drop policy if exists "competition_routines: read"   on competition_routines;
drop policy if exists "competition_routines: insert" on competition_routines;
drop policy if exists "competition_routines: update" on competition_routines;
drop policy if exists "competition_routines: delete" on competition_routines;

create policy "competition_routines: read"
  on competition_routines for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "competition_routines: insert"
  on competition_routines for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "competition_routines: update"
  on competition_routines for update
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id());

create policy "competition_routines: delete"
  on competition_routines for delete
  using (is_coach_of(athlete_id) or is_admin());


-- ─── mood_and_readiness ───────────────────────────────────────────────────────
-- Athletes write their own entries. Coaches can read (not write) their athletes'.

alter table mood_and_readiness enable row level security;

drop policy if exists "mood_and_readiness: read"   on mood_and_readiness;
drop policy if exists "mood_and_readiness: insert" on mood_and_readiness;
drop policy if exists "mood_and_readiness: update" on mood_and_readiness;
drop policy if exists "mood_and_readiness: delete" on mood_and_readiness;

create policy "mood_and_readiness: read"
  on mood_and_readiness for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin());

create policy "mood_and_readiness: insert"
  on mood_and_readiness for insert
  with check (athlete_id = get_my_profile_id());

create policy "mood_and_readiness: update"
  on mood_and_readiness for update
  using (athlete_id = get_my_profile_id());

create policy "mood_and_readiness: delete"
  on mood_and_readiness for delete
  using (athlete_id = get_my_profile_id() or is_admin());


-- ============================================================
-- DONE
-- After running this migration:
-- 1. Go to Storage and create a bucket named "athlete-uploads"
--    with RLS enabled (private bucket).
-- 2. Set your own profile role to 'coach' or 'admin' via the
--    Supabase table editor (profiles table, find your row by user_id).
-- 3. The on_auth_user_created trigger will auto-create a profile
--    for any new signup from this point forward.
-- ============================================================
