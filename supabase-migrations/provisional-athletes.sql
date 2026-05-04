-- ============================================================
-- Provisional athletes — run AFTER coach-athlete-schema.sql
-- ============================================================
-- Allows coaches to create full athlete records and season plans
-- before the athlete has signed up. When they accept an invite,
-- merge_provisional_athlete() migrates all data to their real
-- profile automatically.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout.
-- ============================================================


-- ─── PROVISIONAL ATHLETES ────────────────────────────────────────────────────

create table if not exists provisional_athletes (
  id                    uuid primary key default gen_random_uuid(),
  coach_id              uuid references profiles(id) on delete cascade not null,
  merged_into           uuid references profiles(id) on delete set null,

  -- Basic info
  name                  text not null,
  classification        text,
  club                  text,
  county                text,
  nation                text,
  event_group           text,
  preferred_events      text[],
  date_of_birth         date,

  -- Season target
  season_goal           text,
  target_event          text,
  target_performance    text,
  target_date           date,

  -- Coaching principles
  athlete_type          text,
  training_model        text,
  competition_strategy  text,
  technical_priority    text,
  pacing_model          text,
  session_structure     text,
  talent_hub            boolean not null default false,
  talent_hub_notes      text,
  coach_notes           text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists provisional_athletes_coach_idx
  on provisional_athletes(coach_id);
create index if not exists provisional_athletes_merged_idx
  on provisional_athletes(merged_into);

drop trigger if exists provisional_athletes_updated_at on provisional_athletes;
create trigger provisional_athletes_updated_at
  before update on provisional_athletes
  for each row execute function handle_updated_at();


-- ─── LINK INVITES TO PROVISIONAL RECORDS ─────────────────────────────────────

alter table athlete_invites
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete set null;


-- ─── EXTEND SEASON PHASES ─────────────────────────────────────────────────────
-- Add provisional FK + the fields Maddy's plan uses that weren't in v1.

alter table season_phases
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade,
  add column if not exists training_focus     text,
  add column if not exists competition_notes  text,
  add column if not exists key_cue            text;


-- ─── EXTEND COMPETITIONS ─────────────────────────────────────────────────────

alter table competitions
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;


-- ─── EXTEND OTHER PLANNING TABLES ─────────────────────────────────────────────

alter table training_sessions
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table personal_bests
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table results
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;


-- ─── MERGE FUNCTION ──────────────────────────────────────────────────────────
-- Called by claim_invite when a provisional athlete is linked to the invite.
-- Migrates all planning data from provisional_athlete_id to the real profile,
-- creates the coach_athlete link, and copies coaching principles to the profile.

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

  -- Migrate planning data
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

  -- Copy coaching principles into the real profile (only fill blanks)
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

  -- Create the active coach_athlete link
  insert into coach_athlete (coach_id, athlete_id, status)
  values (v_pa.coach_id, p_real_profile_id, 'active')
  on conflict (coach_id, athlete_id) do update set status = 'active';

  -- Mark provisional record as merged
  update provisional_athletes
    set merged_into = p_real_profile_id
    where id = p_provisional_id;
end;
$$;


-- ─── UPDATED CLAIM_INVITE ────────────────────────────────────────────────────
-- Replaces the original claim_invite. Now triggers merge if the invite
-- was linked to a provisional athlete record.

create or replace function claim_invite(p_token text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_invite     athlete_invites%rowtype;
  v_my_id      uuid;
  v_coach_name text;
begin
  v_my_id := get_my_profile_id();

  if v_my_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select * into v_invite
  from athlete_invites
  where token = p_token;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_invite.expires_at < now() then
    return jsonb_build_object('error', 'expired');
  end if;

  if v_invite.claimed_by = v_my_id then
    select name into v_coach_name from profiles where id = v_invite.coach_id;
    return jsonb_build_object('success', true, 'coach_name', v_coach_name, 'already_linked', true);
  end if;

  if v_invite.claimed_by is not null then
    return jsonb_build_object('error', 'already_claimed');
  end if;

  if v_invite.coach_id = v_my_id then
    return jsonb_build_object('error', 'self_invite');
  end if;

  -- Merge provisional athlete data if the invite had one
  if v_invite.provisional_athlete_id is not null then
    perform merge_provisional_athlete(v_invite.provisional_athlete_id, v_my_id);
  else
    -- No provisional record: just create the coach_athlete link
    insert into coach_athlete (coach_id, athlete_id, status)
    values (v_invite.coach_id, v_my_id, 'active')
    on conflict (coach_id, athlete_id) do update set status = 'active';
  end if;

  update athlete_invites
    set claimed_by = v_my_id, claimed_at = now()
    where id = v_invite.id;

  select name into v_coach_name from profiles where id = v_invite.coach_id;

  return jsonb_build_object('success', true, 'coach_name', v_coach_name);
end;
$$;


-- ============================================================
-- ROW LEVEL SECURITY — provisional_athletes
-- ============================================================

alter table provisional_athletes enable row level security;

drop policy if exists "provisional_athletes: coach manages" on provisional_athletes;

create policy "provisional_athletes: coach manages"
  on provisional_athletes for all
  using  (coach_id = get_my_profile_id() or is_admin())
  with check (coach_id = get_my_profile_id());


-- ─── EXTEND EXISTING RLS TO COVER PROVISIONAL ACCESS ─────────────────────────
-- Re-create the season_phases and competitions read policies so coaches can
-- also read/write rows that belong to their provisional athletes.

drop policy if exists "season_phases: read"   on season_phases;
drop policy if exists "season_phases: write"  on season_phases;
drop policy if exists "season_phases: update" on season_phases;
drop policy if exists "season_phases: delete" on season_phases;

create policy "season_phases: read"
  on season_phases for select
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

create policy "season_phases: write"
  on season_phases for insert
  with check (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "season_phases: update"
  on season_phases for update
  using (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "season_phases: delete"
  on season_phases for delete
  using (
    is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );


drop policy if exists "competitions: read"   on competitions;
drop policy if exists "competitions: insert" on competitions;
drop policy if exists "competitions: update" on competitions;
drop policy if exists "competitions: delete" on competitions;

create policy "competitions: read"
  on competitions for select
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

create policy "competitions: insert"
  on competitions for insert
  with check (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "competitions: update"
  on competitions for update
  using (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );

create policy "competitions: delete"
  on competitions for delete
  using (
    is_coach_of(athlete_id)
    or is_admin()
    or exists (
      select 1 from provisional_athletes pa
      where pa.id = provisional_athlete_id
        and pa.coach_id = get_my_profile_id()
    )
  );
