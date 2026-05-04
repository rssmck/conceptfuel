-- ============================================================
-- Extend psych_sessions, visualisation_scripts, and cue_library
-- with provisional_athlete_id for provisional athlete access.
-- Run AFTER: provisional-athletes.sql, athlete-id-nullable.sql
-- Safe to re-run (IF NOT EXISTS / OR REPLACE throughout)
-- ============================================================


-- ─── personal_bests — add notes column ───────────────────────────────────────

alter table personal_bests
  add column if not exists notes text;


-- ─── psych_sessions ──────────────────────────────────────────────────────────

alter table psych_sessions
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table psych_sessions alter column athlete_id drop not null;

alter table psych_sessions drop constraint if exists psych_sessions_athlete_check;
alter table psych_sessions add constraint psych_sessions_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);


-- ─── visualisation_scripts ───────────────────────────────────────────────────

alter table visualisation_scripts
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table visualisation_scripts alter column athlete_id drop not null;

alter table visualisation_scripts drop constraint if exists visualisation_scripts_athlete_check;
alter table visualisation_scripts add constraint visualisation_scripts_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);


-- ─── cue_library ─────────────────────────────────────────────────────────────
-- Optional link to a specific provisional athlete (coach-curated, athlete-specific)

alter table cue_library
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;


-- ─── RLS: psych_sessions ─────────────────────────────────────────────────────

drop policy if exists "psych_sessions: read"   on psych_sessions;
drop policy if exists "psych_sessions: insert" on psych_sessions;
drop policy if exists "psych_sessions: update" on psych_sessions;
drop policy if exists "psych_sessions: delete" on psych_sessions;

create policy "psych_sessions: read"
  on psych_sessions for select
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

create policy "psych_sessions: insert"
  on psych_sessions for insert
  with check (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "psych_sessions: update"
  on psych_sessions for update
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "psych_sessions: delete"
  on psych_sessions for delete
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


-- ─── RLS: visualisation_scripts ──────────────────────────────────────────────

drop policy if exists "visualisation_scripts: read"   on visualisation_scripts;
drop policy if exists "visualisation_scripts: insert" on visualisation_scripts;
drop policy if exists "visualisation_scripts: update" on visualisation_scripts;
drop policy if exists "visualisation_scripts: delete" on visualisation_scripts;

create policy "visualisation_scripts: read"
  on visualisation_scripts for select
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

create policy "visualisation_scripts: insert"
  on visualisation_scripts for insert
  with check (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "visualisation_scripts: update"
  on visualisation_scripts for update
  using (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "visualisation_scripts: delete"
  on visualisation_scripts for delete
  using (
    is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );


-- ─── Update merge_provisional_athlete to include psych + vis ─────────────────
-- Adds psych_sessions and visualisation_scripts to the merge path so that
-- when a provisional athlete claims their invite, all planning data transfers.

create or replace function merge_provisional_athlete(
  p_provisional_id  uuid,
  p_real_profile_id uuid
)
returns void
language plpgsql security definer
as $$
declare
  v_pa provisional_athletes%rowtype;
begin
  select * into v_pa from provisional_athletes where id = p_provisional_id;
  if not found then return; end if;
  if v_pa.merged_into is not null then return; end if;

  update season_phases
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update competitions
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update training_sessions
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update personal_bests
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update results
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update psych_sessions
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update visualisation_scripts
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update cue_library
    set athlete_id = p_real_profile_id, provisional_athlete_id = null
    where provisional_athlete_id = p_provisional_id;

  update profiles
  set
    classification   = coalesce(classification,   v_pa.classification),
    club             = coalesce(club,             v_pa.club),
    county           = coalesce(county,           v_pa.county),
    nation           = coalesce(nation,           v_pa.nation),
    event_group      = coalesce(event_group,      v_pa.event_group),
    preferred_events = coalesce(preferred_events, v_pa.preferred_events),
    coach_notes      = coalesce(coach_notes,      v_pa.coach_notes)
  where id = p_real_profile_id;

  insert into coach_athlete (coach_id, athlete_id, status)
  values (v_pa.coach_id, p_real_profile_id, 'active')
  on conflict (coach_id, athlete_id) do update set status = 'active';

  update provisional_athletes
    set merged_into = p_real_profile_id
    where id = p_provisional_id;
end;
$$;
