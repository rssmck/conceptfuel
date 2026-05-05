-- ============================================================
-- day_notes: per-day coach/athlete notes thread
-- Supports back-and-forth between coach and athlete per calendar day.
-- Run AFTER: provisional-athletes.sql, athlete-id-nullable.sql
-- Safe to re-run (IF NOT EXISTS / OR REPLACE throughout)
-- ============================================================

create table if not exists day_notes (
  id                     uuid primary key default gen_random_uuid(),
  provisional_athlete_id uuid references provisional_athletes(id) on delete cascade,
  athlete_id             uuid references profiles(id) on delete cascade,
  date                   date not null,
  author_id              uuid not null references profiles(id) on delete cascade,
  content                text not null,
  created_at             timestamptz not null default now(),
  check (provisional_athlete_id is not null or athlete_id is not null)
);

alter table day_notes enable row level security;

drop policy if exists "day_notes: read"   on day_notes;
drop policy if exists "day_notes: insert" on day_notes;
drop policy if exists "day_notes: delete" on day_notes;

create policy "day_notes: read"
  on day_notes for select
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or is_admin()
    or author_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "day_notes: insert"
  on day_notes for insert
  with check (
    author_id = get_my_profile_id()
    and (
      athlete_id = get_my_profile_id()
      or is_coach_of(athlete_id)
      or exists (
        select 1 from provisional_athletes pa
        where pa.id = provisional_athlete_id
          and pa.coach_id = get_my_profile_id()
      )
    )
  );

create policy "day_notes: delete"
  on day_notes for delete
  using (author_id = get_my_profile_id() or is_admin());


-- ─── Update merge_provisional_athlete to migrate day_notes ────────────────────

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

  update day_notes
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
