-- ============================================================
-- Micro-periodisation: weekly training log, intensity days,
-- competition results, provisional RLS extensions
-- Run AFTER: coach-athlete-schema, provisional-athletes,
--            athlete-id-nullable, seasons
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================


-- ─── INTENSITY DAYS ON PHASES ────────────────────────────────────────────────
-- Which days of the week are intensity sessions (e.g. ["Tuesday","Thursday","Saturday"])
alter table season_phases
  add column if not exists intensity_days text[];


-- ─── SEASON LINK ON TRAINING SESSIONS ────────────────────────────────────────
alter table training_sessions
  add column if not exists season_id uuid references seasons(id) on delete set null;

create index if not exists training_sessions_season_idx
  on training_sessions(season_id);
create index if not exists training_sessions_prov_date_idx
  on training_sessions(provisional_athlete_id, date);


-- ─── RESULT FIELDS ON COMPETITIONS ───────────────────────────────────────────
-- result_summary already exists; add structured time + position
alter table competitions
  add column if not exists result_time     text,
  add column if not exists result_position integer;


-- ─── SEASON LINK ON PERSONAL BESTS AND RESULTS ───────────────────────────────
alter table personal_bests
  add column if not exists season_id uuid references seasons(id) on delete set null;

alter table results
  add column if not exists season_id uuid references seasons(id) on delete set null;


-- ─── EXTEND RLS: training_sessions ───────────────────────────────────────────

drop policy if exists "training_sessions: read"   on training_sessions;
drop policy if exists "training_sessions: insert" on training_sessions;
drop policy if exists "training_sessions: update" on training_sessions;
drop policy if exists "training_sessions: delete" on training_sessions;

create policy "training_sessions: read"
  on training_sessions for select
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "training_sessions: insert"
  on training_sessions for insert
  with check (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "training_sessions: update"
  on training_sessions for update
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "training_sessions: delete"
  on training_sessions for delete
  using (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );


-- ─── EXTEND RLS: personal_bests ──────────────────────────────────────────────

drop policy if exists "personal_bests: read"   on personal_bests;
drop policy if exists "personal_bests: insert" on personal_bests;
drop policy if exists "personal_bests: update" on personal_bests;
drop policy if exists "personal_bests: delete" on personal_bests;

create policy "personal_bests: read"
  on personal_bests for select
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "personal_bests: insert"
  on personal_bests for insert
  with check (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "personal_bests: update"
  on personal_bests for update
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "personal_bests: delete"
  on personal_bests for delete
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );


-- ─── EXTEND RLS: results ─────────────────────────────────────────────────────

drop policy if exists "results: read"   on results;
drop policy if exists "results: insert" on results;
drop policy if exists "results: update" on results;
drop policy if exists "results: delete" on results;

create policy "results: read"
  on results for select
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "results: insert"
  on results for insert
  with check (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "results: update"
  on results for update
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "results: delete"
  on results for delete
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );
