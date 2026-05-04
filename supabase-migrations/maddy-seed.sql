-- ============================================================
-- Maddy Markham — comprehensive 2026 season seed
-- Source: maddy_markham_2026_csvs (10 files)
-- Run AFTER: coach-athlete-schema, provisional-athletes,
--            athlete-id-nullable, seasons
-- Self-contained: applies all required column additions below.
-- Safe to re-run (deletes and re-inserts all sections)
-- ============================================================


-- ─── PREREQUISITE COLUMN ADDITIONS (idempotent) ──────────────────────────────

-- micro-periodisation columns
alter table season_phases
  add column if not exists intensity_days text[];

alter table training_sessions
  add column if not exists season_id uuid references seasons(id) on delete set null;

alter table competitions
  add column if not exists result_time     text,
  add column if not exists result_position integer;

alter table personal_bests
  add column if not exists season_id uuid references seasons(id) on delete set null,
  add column if not exists notes     text;

alter table results
  add column if not exists season_id uuid references seasons(id) on delete set null;

-- provisional psych/vis/cue columns
alter table psych_sessions
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table psych_sessions alter column athlete_id drop not null;

alter table psych_sessions drop constraint if exists psych_sessions_athlete_check;
alter table psych_sessions add constraint psych_sessions_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);

alter table visualisation_scripts
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

alter table visualisation_scripts alter column athlete_id drop not null;

alter table visualisation_scripts drop constraint if exists visualisation_scripts_athlete_check;
alter table visualisation_scripts add constraint visualisation_scripts_athlete_check
  check (athlete_id is not null or provisional_athlete_id is not null);

alter table cue_library
  add column if not exists provisional_athlete_id
    uuid references provisional_athletes(id) on delete cascade;

-- RLS: extend training_sessions so coach can access provisional athlete sessions
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
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id())
  );
create policy "training_sessions: insert"
  on training_sessions for insert
  with check (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id())
  );
create policy "training_sessions: update"
  on training_sessions for update
  using (
    athlete_id = get_my_profile_id()
    or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id())
  );
create policy "training_sessions: delete"
  on training_sessions for delete
  using (
    is_coach_of(athlete_id)
    or athlete_id = get_my_profile_id()
    or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id())
  );

-- RLS: extend personal_bests and results for provisional athlete access
drop policy if exists "personal_bests: read"   on personal_bests;
drop policy if exists "personal_bests: insert" on personal_bests;
drop policy if exists "personal_bests: update" on personal_bests;
drop policy if exists "personal_bests: delete" on personal_bests;

create policy "personal_bests: read"
  on personal_bests for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "personal_bests: insert"
  on personal_bests for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "personal_bests: update"
  on personal_bests for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "personal_bests: delete"
  on personal_bests for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));

drop policy if exists "results: read"   on results;
drop policy if exists "results: insert" on results;
drop policy if exists "results: update" on results;
drop policy if exists "results: delete" on results;

create policy "results: read"
  on results for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "results: insert"
  on results for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "results: update"
  on results for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "results: delete"
  on results for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));

-- RLS: psych_sessions and visualisation_scripts for provisional athlete access
drop policy if exists "psych_sessions: read"   on psych_sessions;
drop policy if exists "psych_sessions: insert" on psych_sessions;
drop policy if exists "psych_sessions: update" on psych_sessions;
drop policy if exists "psych_sessions: delete" on psych_sessions;

create policy "psych_sessions: read"
  on psych_sessions for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "psych_sessions: insert"
  on psych_sessions for insert
  with check (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "psych_sessions: update"
  on psych_sessions for update
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id)
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "psych_sessions: delete"
  on psych_sessions for delete
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));

drop policy if exists "visualisation_scripts: read"   on visualisation_scripts;
drop policy if exists "visualisation_scripts: insert" on visualisation_scripts;
drop policy if exists "visualisation_scripts: update" on visualisation_scripts;
drop policy if exists "visualisation_scripts: delete" on visualisation_scripts;

create policy "visualisation_scripts: read"
  on visualisation_scripts for select
  using (athlete_id = get_my_profile_id() or is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "visualisation_scripts: insert"
  on visualisation_scripts for insert
  with check (is_coach_of(athlete_id) or athlete_id = get_my_profile_id()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "visualisation_scripts: update"
  on visualisation_scripts for update
  using (is_coach_of(athlete_id) or athlete_id = get_my_profile_id()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));
create policy "visualisation_scripts: delete"
  on visualisation_scripts for delete
  using (is_coach_of(athlete_id) or is_admin()
    or exists (select 1 from provisional_athletes pa
               where pa.id = provisional_athlete_id and pa.coach_id = get_my_profile_id()));


-- ─── SEED DATA ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_id     uuid;
  v_coach  uuid;
  v_season uuid;
BEGIN
  SELECT id, coach_id INTO v_id, v_coach
  FROM provisional_athletes WHERE name = 'Maddy Markham' LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Maddy Markham not found in provisional_athletes';
  END IF;


  -- ── 1. ATHLETE PROFILE ────────────────────────────────────────────────────

  UPDATE provisional_athletes SET
    classification       = 'T38',
    club                 = 'Leeds City AC / Leeds University AC',
    county               = 'Yorkshire',
    nation               = 'England',
    event_group          = 'sprints',
    date_of_birth        = '2003-01-01',
    season_goal          = 'Win England Senior Para Championships 400m. Run sub-65 seconds. Achieve UK T38 number 1 ranked 400m athlete.',
    target_event         = '400m',
    target_performance   = 'Sub-65s',
    target_date          = '2026-08-22',
    athlete_type         = 'Rhythm runner. Cannot perform at a high-level meet without lower-key race exposures as competitive priming beforehand. Responds strongly to coach-paced sessions where following removes self-regulation cognitive load.',
    training_model       = 'Endurance-led. Get fit before get fast. Tempo and threshold work is the primary vehicle for both fitness and cadence development. Does not respond well to pure sprint methodology with long rest intervals and CNS-maximal efforts.',
    competition_strategy = 'All pre-championship races are low-key rhythm exposures with no performance target. No Grangemouth - prior negative experience and substandard facilities. Diamond League London is the exception if invitation received - evaluate on timing and race format only.',
    technical_priority   = 'Cadence deficit and heavy footfall. Long stride becomes energy-costly in the 400m second half as ground contact time accumulates. Primary technical development goal for the 2026 season.',
    pacing_model         = 'Responds strongly to coach-paced sessions. Following removes self-regulation cognitive load and allows full attention on technical execution. Coach leads from front; Maddy''s only task is to stay with the coach.',
    session_structure    = 'Intensity days: Tuesday, Thursday, Saturday only. Thursday is the designated key session and is protected throughout all phases - not moved or shortened regardless of other session adjustments.',
    talent_hub           = true,
    talent_hub_notes     = 'Leeds Beckett - performance category evidence required by August 2026. Turning 23 this year, no longer eligible for development category. Communication protocol with sprint group essential - training must not be added without notifying coach.',
    coach_notes          = 'T38. Born with stroke - significantly reduced motor control and sensation throughout the entire right side. Epilepsy with major seizure history. One seizure required a full year out of university for comprehensive rehabilitation. Classification formalised May/June 2025. MEDICAL FLAG 1: HYDROTHERAPY CONTRAINDICATED - near-drowning incident during a previous exercise session. Do not use any water-based exercise environment under any circumstances. AlterG is the designated safe alternative for all low-impact sprint work. MEDICAL FLAG 2: Epilepsy - monitor for signs of neuro episode during and after all sessions. One episode on track recorded February 2026 (Scottish National Indoors 400m). Background: elite junior 5K runner, among fastest U15 in country for Lytham St Annes. Stride profile: long stride, heavy footfall, lower cadence - good opening 200m but insufficient neuromuscular reserve in closing phase, compounded by right-side neurological asymmetry under fatigue.'
  WHERE id = v_id;


  -- ── 2. SEASON ─────────────────────────────────────────────────────────────

  SELECT id INTO v_season FROM seasons WHERE provisional_athlete_id = v_id LIMIT 1;
  IF v_season IS NULL THEN
    INSERT INTO seasons (provisional_athlete_id, coach_id, name, season_type, start_date, end_date, goal, target_event, target_performance, target_date, status)
    VALUES (v_id, v_coach, 'Outdoor Track 2026', 'outdoor_track', '2026-05-12', '2026-08-23',
            'Win England Senior Para Championships 400m. Sub-65s. UK T38 number 1.',
            '400m', 'Sub-65s', '2026-08-22', 'active')
    RETURNING id INTO v_season;
  END IF;


  -- ── 3. SEASON PHASES ──────────────────────────────────────────────────────

  DELETE FROM season_phases WHERE provisional_athlete_id = v_id;

  INSERT INTO season_phases
    (provisional_athlete_id, season_id, name, start_date, end_date, "order", color,
     focus, training_focus, competition_notes, key_cue, coach_notes, intensity_days)
  VALUES
    (v_id, v_season, 'Reconditioning', '2026-05-12', '2026-06-13', 1, '#4a9eff',
     'Return',
     'Aerobic base via easy running and time-on/off tempo. Metatarsal load confirmation. Cadence and ground contact work embedded in all sessions. Gym: strength and stability. AlterG: neural maintenance where available (60-85% bodyweight progressing weekly, 10-20 sec maximal efforts with full standing recovery). Maximum session duration 20 min (25 min long run Saturday only).',
     'None.',
     '"Same pace, quieter feet."',
     'Decision gate end of Week 1. AlterG is Phase 1 only and conditional on confirmed facility access each week - not a mandatory session. Grass and trainers used where impact reduction is appropriate. Visualisation introduced Week 3. Communication protocol with Talent Hub sprint group must be established at the outset. Thursday key session protected throughout.',
     ARRAY['Tuesday','Thursday','Saturday']),

    (v_id, v_season, 'Sharpening', '2026-06-14', '2026-07-05', 2, '#f0a500',
     'Activate',
     'Tempo efforts extended beyond Phase 1 ceiling (reps to 5 min at RPE 6.5-7). Controlled track accelerations introduced (80-85% effort, 20-25m). First competitive exposures at low-key regional level. AlterG no longer used from this phase.',
     'Approximately 20 June: low-key regional fixture. Bedford 3-5 July: decision gate - enter only if Phase 1 complete and metatarsal fully cleared for track acceleration work.',
     '"Chase me. Your only job is to stay with me."',
     'Confirm no Maddie Down or Rosie Porter on any start list before entering. Bedford entry decision made in mid-June based on preparation status. Quality of 2 July Thursday session is the final gate criterion.',
     ARRAY['Tuesday','Thursday','Saturday']),

    (v_id, v_season, 'Championship build', '2026-07-06', '2026-08-09', 3, '#a855f7',
     'Develop',
     '400m-specific speed endurance. Race sharpness built through progressive competitive and training exposures. Race-shape efforts: 150m, 200m, 250m, 300m, 350m at 85-95%. Walk or standing recovery. Volume ceiling maintained. Cadence consolidation under race-pace conditions.',
     'Approximately 18 July: regional or open-graded. Diamond League London if invitation received - evaluate on timing and race format. Final tune-up race 5-9 August at familiar North West or Yorkshire venue.',
     '"The second half is where it is built."',
     'No direct rivals in any pre-championship competition. Grangemouth explicitly excluded. Final tune-up no later than 9 August to allow adequate taper. Diamond League is categorically different from avoiding rivals and should be evaluated on merit.',
     ARRAY['Tuesday','Thursday','Saturday']),

    (v_id, v_season, 'Taper and peak', '2026-08-10', '2026-08-21', 4, '#06b6d4',
     'Confirm',
     'Volume reduces 30-40% while intensity is maintained. Race plan rehearsed and documented at the Week 14 Thursday session - not altered before the championship. No new technical cues introduced. Psychological environment calm and deliberately positive.',
     'No competition after tune-up race.',
     '"You have done the work."',
     'Race plan agreed at Week 14 Thursday session and not changed before the championship. Championship day visualisation script used daily from 16 August. Logistics confirmed: travel, accommodation, warm-up facility, call room timing.',
     ARRAY['Tuesday','Thursday','Saturday']),

    (v_id, v_season, 'Target', '2026-08-22', '2026-08-23', 5, '#ef4444',
     'Execute',
     'England Senior Para Championships - 400m.',
     'England Senior Para Championships (A priority). The only result that matters this season.',
     '"Trust what you have trained."',
     'Win. Sub-65 seconds. UK T38 number 1. Talent Hub performance category evidence required by August 2026.',
     NULL);


  -- ── 4. COMPETITIONS ───────────────────────────────────────────────────────

  DELETE FROM competitions WHERE provisional_athlete_id = v_id;

  INSERT INTO competitions
    (provisional_athlete_id, season_id, date, end_date, venue, meeting, priority, status, events, purpose)
  VALUES
    (v_id, v_season, '2026-06-20', '2026-06-20',
     'TBC - North West regional', 'Low-key regional fixture',
     'prep', 'upcoming', '["400m","200m"]'::jsonb,
     'First post-injury competitive outing. Rhythm and race feel only. No performance target. Data collection: what does competitive racing feel like after the injury period? 200m as fatigue endurance stimulus only if 400m is clean. Confirm no direct rivals on start list before entering. Mid Lancs or equivalent. Result is not the measure of success.'),

    (v_id, v_season, '2026-07-03', '2026-07-05',
     'Bedford', 'England U20 and Senior T&F Championships',
     'gate', 'upcoming', '["400m","200m"]'::jsonb,
     'Championship sharpener if decision gate is passed. Better field and atmosphere than a regional meet. No performance target - rhythm and competitive composure are the measures of success. If gate not passed, substitute a tempo session. DECISION GATE: entry confirmed mid-June only if Phase 1 complete, metatarsal fully cleared for track acceleration work, and quality of 2 July Thursday session is satisfactory. Confirm no direct rivals.'),

    (v_id, v_season, '2026-07-18', '2026-07-18',
     'TBC', 'Regional or open-graded fixture',
     'key', 'upcoming', '["400m"]'::jsonb,
     'Race 2 of Phase 3. Progressive competitive standard. Second 200m composure is the primary focus. No direct rivals. Confirm start list before entry.'),

    (v_id, v_season, '2026-07-25', '2026-07-25',
     'London', 'Diamond League (if invitation received)',
     'key', 'upcoming', '["200m","400m"]'::jsonb,
     'World-class environment that tends to elevate performance. Evaluate on timing relative to this plan, preparation quality, and whether race format is Para-specific or integrated. Diamond League is a categorically different proposition from avoiding direct rivals - do not decline without evaluating timing and format.'),

    (v_id, v_season, '2026-08-08', '2026-08-08',
     'TBC - North West or Yorkshire', 'Final tune-up race',
     'key', 'upcoming', '["400m"]'::jsonb,
     'Final competitive outing before the championships. Familiar venue, friendly environment, no direct rivals. Rhythm confirmation only - not a time trial. Familiar, comfortable venue. No Grangemouth. Confirm venue and start list at least 2 weeks in advance.'),

    (v_id, v_season, '2026-08-22', '2026-08-23',
     'TBC', 'England Senior Para Championships',
     'A', 'upcoming', '["400m"]'::jsonb,
     'THE TARGET RACE. Win. Sub-65 seconds. UK T38 number 1. Talent Hub performance category evidence. The only result that matters this season. Every decision made between now and this date is filtered through this race.');


  -- ── 5. PERSONAL BESTS ─────────────────────────────────────────────────────

  DELETE FROM personal_bests WHERE provisional_athlete_id = v_id;

  INSERT INTO personal_bests
    (provisional_athlete_id, event, performance, date, venue, meeting, notes)
  VALUES
    (v_id, '60m',    '9.00',    '2026-02-13', 'Sheffield',        'BUCS Indoor Athletics Championships', 'PB. Set in final after 9.14 in heat same day. T38 UK 5th.'),
    (v_id, '100m',   '15.3',    '2025-07-09', 'Carlisle',         'Border Harriers Evening Open Medal Meeting', 'T38 UK 10th.'),
    (v_id, '200m (indoor)',  '29.72', '2026-02-14', 'Sheffield',   'BUCS Indoor Athletics Championships', 'PB. Sub-30 barrier broken. Sub-29 projected as achievable before metatarsal injury. T38 UK 4th.'),
    (v_id, '200m (outdoor)', '30.32', '2025-09-14', 'Stratford',  'Stratford Speed', 'Outdoor season best 2025.'),
    (v_id, '400m (outdoor)', '69.26', '2025-09-06', 'Coventry',   'CP Sport National Athletics Championships', 'Season best 2025. Finished 2nd. T38 UK 2nd.'),
    (v_id, '400m (indoor)',  '69.90', '2026-01-24', 'Emirates Arena', 'Scottish National Indoors', 'Exposure day. Raced 200m same session as fatigue endurance stimulus. T38 UK 2nd.'),
    (v_id, '800m',   '2:40.8',  null,          null,               null, null),
    (v_id, '1500m',  '5:20.2',  null,          null,               null, 'T38 UK 1st (2025). Residual marker of endurance background. Not a current focus event.'),
    (v_id, '1500m (Swansea)', '6:07.44', '2025-06-15', 'Swansea', 'Welsh U20 Track and Field Championships', 'T38 UK 1st 2025.'),
    (v_id, '3000m',  '11:11.3', null,          null,               null, null);


  -- ── 6. RESULTS HISTORY ────────────────────────────────────────────────────

  DELETE FROM results WHERE provisional_athlete_id = v_id;

  INSERT INTO results
    (provisional_athlete_id, season_id, date, event, performance, position, venue, meeting, round, notes)
  VALUES
    (v_id, v_season, '2026-02-14', '200m',  '29.72',   5, 'Sheffield',        'BUCS Indoor Athletics Championships',       'final', 'PB'),
    (v_id, v_season, '2026-02-13', '60m',   '9.00',    3, 'Sheffield',        'BUCS Indoor Athletics Championships',       'final', 'PB'),
    (v_id, v_season, '2026-02-13', '60m',   '9.14',    5, 'Sheffield',        'BUCS Indoor Athletics Championships',       'heat',  null),
    (v_id, v_season, '2026-02-08', '200m',  '30.12',   3, 'Emirates Arena',   'Scottish National Indoors',                 'final', null),
    (v_id, v_season, '2026-02-08', '400m',  'DNF',  null, 'Emirates Arena',   'Scottish National Indoors',                 'final', 'Neuro episode during race. Ended on track.'),
    (v_id, v_season, '2026-02-04', '200m',  '29.86',   3, 'Sheffield',        'Sheffield Steel Cup',                       null,    null),
    (v_id, v_season, '2026-01-31', '60m',   '14.10',   7, 'Emirates Arena',   'International - televised',                 null,    'First ever 60m competition. Insufficient max velocity exposure. Fall with significant head contact. Finished race.'),
    (v_id, v_season, '2026-01-24', '200m',  '31.08',   6, 'Emirates Arena',   'Scottish National Indoors',                 null,    null),
    (v_id, v_season, '2026-01-24', '400m',  '69.90',   6, 'Emirates Arena',   'Scottish National Indoors',                 null,    'Exposure day.'),
    (v_id, v_season, '2026-01-01', '200m',  '30.46',   3, 'Lee Valley',       'Lee Valley New Year Open',                  null,    null),
    (v_id, null,     '2025-12-13', '200m',  '32.16',   5, 'Emirates Arena',   'GAA Yuletide Open Graded 2025',             null,    null),
    (v_id, null,     '2025-09-14', '200m',  '30.32',   2, 'Stratford',        'Stratford Speed',                           null,    'Season best 2025.'),
    (v_id, null,     '2025-09-06', '400m',  '69.26',   2, 'Coventry',         'CP Sport National Athletics Championships', null,    'Season best. T38 UK 2nd.'),
    (v_id, null,     '2025-09-02', '400m',  '1:09.34', 6, 'Crownpoint',       'Shettleston Harriers Open Graded Meeting',  null,    null),
    (v_id, null,     '2025-08-30', '200m',  '31.6',    5, 'Blackpool',        'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-08-30', '400m',  '69.7',    5, 'Blackpool',        'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-08-23', '400m',  '71.10',   7, 'Grangemouth',      'Scottish National Senior and U17 Championships', null, null),
    (v_id, null,     '2025-08-16', '200m',  '31.2',    5, 'Blackburn',        'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-08-16', '400m',  '70.2',    2, 'Blackburn',        'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-07-26', '400m',  '71.11',   3, 'Birmingham',       'England Athletics Senior and U20 Championships', null, null),
    (v_id, null,     '2025-07-09', '100m',  '15.3',    6, 'Carlisle',         'Border Harriers Evening Open Medal Meeting', null,   null),
    (v_id, null,     '2025-07-09', '400m',  '71.8',    4, 'Carlisle',         'Border Harriers Evening Open Medal Meeting', null,   null),
    (v_id, null,     '2025-07-05', '100m',  '15.4',    5, 'Bury',             'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-07-05', '400m',  '72.1',    3, 'Bury',             'Mid Lancs Track and Field League',          null,    null),
    (v_id, null,     '2025-06-22', '100m',  '15.5',    3, 'Crownpoint',       'Red Star Games',                            null,    null),
    (v_id, null,     '2025-06-22', '400m',  '77.8',    6, 'Crownpoint',       'Red Star Games',                            null,    null),
    (v_id, null,     '2025-06-15', '1500m', '6:07.44', 6, 'Swansea',          'Welsh U20 Track and Field Championships',   null,    null),
    (v_id, null,     '2025-03-08', 'XC',    '20:29',  13, 'Wollaton Park',    'CAU Inter County Championships',            null,    'Strong cross-country result.'),
    (v_id, null,     '2025-04-13', '10K',   '48:15',  35, 'Lancaster',        'Lancaster Three Bridges 10K',               null,    null),
    (v_id, null,     '2025-01-26', '10M',   '89:57', 137, 'Lytham St Annes',  'St Annes 10',                               null,    null),
    (v_id, null,     '2024-02-28', '5K',    '24:25',  99, 'Leeds',            'Even Splits Leeds 5K Series',               null,    null),
    (v_id, null,     '2024-02-04', '10K',   '50:34', 169, 'Blackburn',        'Winter Warmer 10K',                         null,    null);


  -- ── 7. TRAINING SESSIONS ──────────────────────────────────────────────────

  DELETE FROM training_sessions WHERE provisional_athlete_id = v_id;

  INSERT INTO training_sessions
    (provisional_athlete_id, season_id, date, session_type, title, description, planned, session_rpe)
  VALUES
    -- PHASE 1 WEEK 1
    (v_id, v_season, '2026-05-11', 'gym',
     'Talent Hub gym - lower body conservative',
     'Single-leg press. Hip stability: clamshells and banded walks. Hip-hinge patterns at light load. Core and upper body capacity. No plyometrics. No ballistic work.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false, "notes": "Talent Hub S&C to brief coach on session content and any foot loading concerns before Monday. Lower limb load to remain moderate."}'::jsonb,
     null),

    (v_id, v_season, '2026-05-12', 'track',
     'Easy run - first return, grass surface',
     '15-minute easy run on grass or soft surface. Conversational pace throughout. No drills, no surges, no pace target. Coach observes gait from behind. Foot feel logged at 5, 10, and 15 minutes.',
     '{"volume": "15 min continuous", "surface": "Grass or soft surface in trainers", "rpe": "4-5", "protected": false, "cues": ["Relax into it."], "notes": "Baseline gait observation. Note ground contact on right versus left side. This is the reference point for the entire phase."}'::jsonb,
     5),

    (v_id, v_season, '2026-05-13', 'gym',
     'Gym or AlterG if available - upper body and neural maintenance',
     'If Gym only: upper body strength and core stability. Hip flexor release. No additional lower limb loading. If AlterG available: 6 reps of 10-second maximal sprint efforts at 60-65% bodyweight. Full 60-second standing recovery between each rep. Focus on right-side neural recruitment and stride frequency.',
     '{"volume": "Upper body and core / AlterG 6x10s", "surface": "Gym or AlterG", "rpe_alterg": "9-10", "protected": false, "cues": ["Fast feet. Right side working.", "10 seconds. Full effort."], "notes": "AlterG is conditional on confirmed facility access. If unavailable this session is gym only."}'::jsonb,
     null),

    (v_id, v_season, '2026-05-14', 'track',
     'Easy run with cadence introduction - coach paced',
     '15-minute easy coach-paced run. Coach leads from the front throughout. Within the run: 4 periods of 10 seconds where Maddy consciously increases foot turnover - not pace, quicker ground contact only. 30 seconds of natural running between each cadence segment.',
     '{"volume": "15 min total. 4 x 10 sec cadence picks.", "surface": "Grass or track in trainers", "rpe": "4-5", "protected": true, "cues": ["\"Same pace, quieter feet - 10 seconds.\"", "\"Touch and go. As little time on the ground as possible.\""], "notes": "This session is protected. Baseline ground contact observation - note right versus left symmetry."}'::jsonb,
     5),

    (v_id, v_season, '2026-05-15', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-05-16', 'track',
     'Easy run - solo, grass surface',
     'Solo easy run on grass or soft surface. No pace target. Maddy logs foot feel immediately after. The 24-hour and 48-hour responses are as informative as the session itself.',
     '{"volume": "15 min continuous", "surface": "Grass or soft surface in trainers", "rpe": "4-5", "protected": false, "cues": ["Let the foot tell you."], "notes": "If any sharpness, swelling, or change in gait is reported: contact Talent Hub physio before the next session."}'::jsonb,
     5),

    (v_id, v_season, '2026-05-17', 'mobility',
     'Active mobility and Week 1 decision gate',
     'Ankle mobility - right side focus (5 min). Hip flexor release (5 min). Thoracic rotation (5 min). Single-leg balance holds - right side (5 min). Can be completed at home.',
     '{"volume": "20 min", "surface": "Home or gym", "protected": false, "notes": "DECISION GATE: if the metatarsal has responded well across all three run sessions this week with no sharpness, swelling, or change in gait pattern, proceed to Week 2 as planned."}'::jsonb,
     null),

    -- PHASE 1 WEEK 2
    (v_id, v_season, '2026-05-18', 'gym',
     'Talent Hub gym - single-leg RDL introduced',
     'Single-leg Romanian deadlift introduced as a right-side proprioception and control exercise. Hip stability continues. Core. Lower body load increases slightly from Week 1.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-05-19', 'track',
     'Easy run with cadence focus blocks',
     '20-minute easy run. Within the run: 2 periods of 2 minutes where Maddy consciously increases foot turnover using a metronome app at 178-182 steps per minute or coach-set rhythm. 2 minutes of natural running between each cadence block.',
     '{"volume": "20 min. 2 x 2 min cadence blocks.", "surface": "Grass or track in trainers", "rpe": "4-5", "protected": false, "cues": ["\"Find the beat and stay on it.\"", "\"Faster feet, same speed.\""]}'::jsonb,
     5),

    (v_id, v_season, '2026-05-20', 'gym',
     'Gym or AlterG if available',
     'If Gym only: continue Week 1 gym structure. If AlterG available: bodyweight increases to 65-70%. Effort duration extends to 15 seconds. 6 reps with 60-second standing recovery.',
     '{"volume": "Gym / AlterG 6x15s at 65-70% BW", "surface": "Gym or AlterG", "protected": false, "cues": ["Right side matching left - make it happen.", "Frequency first. Power follows."]}'::jsonb,
     null),

    (v_id, v_season, '2026-05-21', 'track',
     'First tempo session - 4 x 90 sec on / 90 sec off',
     '5-minute easy jog. Main set: 4 x 90 seconds at RPE 6 - controlled, not strained. 90-second walk recovery between each rep. Coach paces every rep. Maddy follows. Cadence awareness throughout all tempo reps.',
     '{"volume": "5 min easy + 4 x 90 sec / 90 sec walk. ~11 min total running.", "surface": "Grass or track in trainers", "rpe": "6", "protected": true, "cues": ["\"Chase me. Your only job is to stay with me.\"", "\"Light feet on every rep - not just the first.\""], "notes": "First genuine tempo stimulus. Quality over pace. The session should feel like something Maddy could sustain considerably longer than 90 seconds."}'::jsonb,
     6),

    (v_id, v_season, '2026-05-22', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-05-23', 'track',
     'Easy run - solo',
     'Solo easy run. Recovery-oriented. Confirms the 48-hour foot response to Thursday before the week closes.',
     '{"volume": "20 min continuous", "surface": "Grass or track in trainers", "rpe": "4-5", "protected": false, "cues": ["Easy means easy."]}'::jsonb,
     5),

    (v_id, v_season, '2026-05-24', 'mobility',
     'Active mobility',
     'Ankle mobility, hip flexor release, thoracic rotation, single-leg balance - same protocol as Week 1.',
     '{"volume": "20 min", "surface": "Home or gym", "protected": false}'::jsonb,
     null),

    -- PHASE 1 WEEK 3
    (v_id, v_season, '2026-05-25', 'gym',
     'Talent Hub gym - trap bar deadlift introduced',
     'Trap bar deadlift introduced as primary lower body strength pattern. Single-leg work continues. Banded hip abduction for right-side stability. Lower body load building progressively.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-05-26', 'track',
     'Cadence and drill session',
     'Drill block: high knees focusing on quick ground contact rather than height, A-skips emphasising the claw-back foot action, 4 x 20m short runs with explicit step frequency focus. Metronome or coach rhythm for the 20m runs. Then 10-minute easy run with cadence awareness throughout.',
     '{"volume": "~15 min total running. Drill block then easy run.", "surface": "Grass preferred", "rpe": "4-5", "protected": false, "cues": ["\"Tall posture carries the rhythm.\"", "\"Quick off the ground - the skip teaches it.\""], "notes": "Key question: does cadence feel more natural in the easy run after the drills?"}'::jsonb,
     5),

    (v_id, v_season, '2026-05-27', 'gym',
     'Gym or AlterG if available - effort duration extending',
     'If Gym only: continue progressive gym loading. If AlterG available: bodyweight at 70-75%. Volume increases to 8 reps of 15 seconds. Focus begins to shift toward acceleration mechanics alongside frequency. Encourage drive through the right leg specifically.',
     '{"volume": "Gym / AlterG 8x15s at 70-75% BW", "surface": "Gym or AlterG", "protected": false, "cues": ["Drive through it. Right leg earning its place."], "notes": "If quality drops in the final 2-3 reps, reduce to 6 reps and hold volume for another week."}'::jsonb,
     null),

    (v_id, v_season, '2026-05-28', 'track',
     'Tempo - 5 x 2 min on / 2 min off, coach paces first 3',
     '5-minute easy jog. Main set: 5 x 2 minutes at RPE 6-6.5. 2-minute walk recovery. Coach paces reps 1-3. Maddy self-regulates reps 4 and 5, holding the rhythm the coach has established. First test of internalising the external rhythm.',
     '{"volume": "5 min easy + 5 x 2 min / 2 min walk. ~15 min total.", "surface": "Track in trainers or grass", "rpe": "6-6.5", "protected": true, "cues": ["\"The effort goes up. The feet stay light. One does not follow the other.\"", "\"You have the rhythm - rep 4 is yours.\""], "notes": "Observe whether cadence is maintained when the external reference is removed. This is the central coaching observation of Phase 1."}'::jsonb,
     7),

    (v_id, v_season, '2026-05-29', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-05-30', 'track',
     'Long run - 25 min ceiling',
     'Easy 25-minute run. No intensity. First session at the maximum long run duration. Cadence awareness throughout but no specific cue - just notice.',
     '{"volume": "25 min continuous. This is the long run ceiling for the entire phase.", "surface": "Grass preferred", "rpe": "4-5", "protected": false, "cues": ["\"25 minutes. Not 26.\""]}'::jsonb,
     5),

    (v_id, v_season, '2026-05-31', 'psych',
     'First visualisation session - running rhythm script',
     'First formal visualisation session. Script content: the feeling of running with good rhythm and light feet. Not race imagery at this stage - just the sensation of good movement. Coach provides a written or audio script for Maddy to use independently.',
     '{"volume": "5-7 min guided script", "surface": "Home", "protected": false, "script_ref": "VIS-W3-RHYTHM", "notes": "Script focus: light ground contact, rhythm and cadence at easy pace, following the coach, breathing comfortably. This is a scheduled session, not optional supplemental work."}'::jsonb,
     null),

    -- PHASE 1 WEEK 4
    (v_id, v_season, '2026-06-01', 'gym',
     'Talent Hub gym - power block introduced',
     'Continue strength work. Introduce explosive single-leg step-up: 4-6 reps each side, aggressive drive through. Right side is the primary focus. Medicine ball upper body work. No plyometric landing patterns given metatarsal status.',
     '{"volume": "Talent Hub programme plus power block", "surface": "Gym", "protected": false, "notes": "Single-leg step-up drive maps directly to sprint acceleration mechanics. Discuss power block intent with Talent Hub S&C to ensure alignment."}'::jsonb,
     null),

    (v_id, v_season, '2026-06-02', 'track',
     'Cadence and drill session plus first strides',
     'Drill block as Week 3. 10-minute easy run. Then 6 x 60-metre strides focusing exclusively on step frequency - not pace, not power. These are rhythm strides. Walk-back recovery between each. Stride length and pace are irrelevant.',
     '{"volume": "~15 min total plus 6 x 60m strides", "surface": "Grass or track in trainers", "rpe": "4-5 base / stride focus", "protected": false, "cues": ["\"Faster without heavier. The ground gets quieter as the pace goes up.\"", "\"Frequency, not force.\""], "notes": "First above-easy-pace efforts on a standard surface. Monitor metatarsal response carefully in the 24 and 48 hours following."}'::jsonb,
     5),

    (v_id, v_season, '2026-06-03', 'gym',
     'Gym or AlterG if available - efforts extending to 20 sec',
     'If Gym only: continue progressive loading including power block. If AlterG available: effort duration extends to 20 seconds at 75-80% bodyweight. Recovery increases to 90 seconds to maintain quality. Focus on acceleration mechanics and right-side drive sustained across the longer effort.',
     '{"volume": "Gym / AlterG 6x20s at 75-80% BW / 90s rest", "surface": "Gym or AlterG", "protected": false, "cues": ["The last 10 seconds - stay tall and keep driving."], "notes": "Note whether quality holds across all 6 reps at 20 seconds."}'::jsonb,
     null),

    (v_id, v_season, '2026-06-04', 'track',
     'Tempo - 5 x 3 min on / 2 min off (most demanding session of Phase 1)',
     '5-minute easy jog. Main set: 5 x 3 minutes at RPE 6.5-7. 2-minute walk recovery. Coach paces throughout. Brief Maddy before the session: reps 4 and 5 will feel harder than 1-3 and this is planned. Maintaining rhythm in those final reps is the primary measure of success, not pace.',
     '{"volume": "5 min easy + 5 x 3 min / 2 min walk. ~20 min total (session cap).", "surface": "Track in trainers or grass", "rpe": "6.5-7", "protected": true, "cues": ["\"The second block is where it is built.\"", "\"Rhythm holds. Pace is a consequence.\""], "notes": "Readiness score below 6: shorten to 4 reps rather than cancel. 4 quality reps is preferable to 5 compromised ones. This session is at the 20-minute running cap."}'::jsonb,
     7),

    (v_id, v_season, '2026-06-05', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-06', 'track',
     'Long run - 25 min',
     'Easy long run. Cadence awareness but no specific cue. Comfortable at the ceiling.',
     '{"volume": "25 min continuous", "surface": "Grass preferred", "rpe": "4-5", "protected": false}'::jsonb,
     5),

    (v_id, v_season, '2026-06-07', 'psych',
     'Visualisation - approaching competition environment',
     'Week 4 script: begin to incorporate the competition environment. The warm-up routine before a race. Arriving at the track. The feel of the track surface. Not the race itself yet - just the approach and preparation.',
     '{"volume": "7 min guided script", "surface": "Home", "protected": false, "script_ref": "VIS-W4-ARRIVAL", "notes": "Script focus: arriving at the venue, the warm-up when preparation is right, standing on the track feeling ready. The rhythm is already present before the race begins."}'::jsonb,
     null),

    -- PHASE 1 WEEK 5
    (v_id, v_season, '2026-06-08', 'gym',
     'Talent Hub gym - consolidation week',
     'Maintain Week 4 loads. No significant increases. Focus on movement quality rather than load progression.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-09', 'track',
     'Easy run - cadence self-monitored consolidation check',
     '20-minute easy run with cadence awareness throughout but no specific drill focus. Maddy notices how long the rhythm feels natural before it requires conscious effort to re-engage. This is the consolidation check for the phase.',
     '{"volume": "20 min continuous", "surface": "Grass or track in trainers", "rpe": "4-5", "protected": false, "cues": ["You know this rhythm now."]}'::jsonb,
     5),

    (v_id, v_season, '2026-06-10', 'gym',
     'Gym or AlterG if available - quality benchmark',
     'If Gym only: maintain Week 4 gym loads. If AlterG available: bodyweight at 80-85% - highest of the phase. 6 reps at 20 seconds. This is a quality benchmark for Phase 1.',
     '{"volume": "Gym / AlterG 6x20s at 80-85% BW / 90s rest", "surface": "Gym or AlterG", "protected": false, "cues": ["Best effort of the phase. Show me what 5 weeks has built."], "notes": "Compare gait symmetry, drive quality, and right-side recruitment to Week 1 observations."}'::jsonb,
     null),

    (v_id, v_season, '2026-06-11', 'track',
     'Tempo - 5 x 3 min on / 2 min off, final 2 reps self-regulated',
     '5-minute easy jog. Same structure as Week 4. Coach paces reps 1-3 and drops back for reps 4 and 5. Maddy holds the rhythm independently for the final two reps. Primary test of the phase: has the rhythm been internalised?',
     '{"volume": "5 min easy + 5 x 3 min / 2 min walk. ~20 min total.", "surface": "Track in trainers or grass", "rpe": "6.5-7", "protected": true, "cues": ["\"The last two are yours.\"", "\"Trust what you have built.\""], "notes": "Phase review scheduled Friday 13 June. Output: go/no-go on first competition."}'::jsonb,
     7),

    (v_id, v_season, '2026-06-12', 'psych',
     'Phase 1 review - coach and athlete (15 min)',
     'Formal phase review. Agenda: (1) Metatarsal status confirmed with Talent Hub physio. (2) Cadence: is it more automatic? (3) AlterG progression summary. (4) Visualisation: engaging with scripts? (5) Confidence score trajectory. (6) Ready for competitive exposure? (7) Confirm first race approximately 20 June and Bedford decision gate.',
     '{"volume": "15 min structured conversation", "surface": "Talent Hub or track", "protected": false, "notes": "Output: go/no-go on first competition. Phase 2 session structure confirmed. Platform updated with Phase 1 completion data."}'::jsonb,
     null),

    -- PHASE 2 WEEK 6
    (v_id, v_season, '2026-06-15', 'gym',
     'Talent Hub gym - Phase 2 opening, plyometric clearance',
     'Continue Phase 1 gym structure. Introduce plyometric loading cautiously if metatarsal cleared by physio: box step-off landing, double-leg only. Single-leg explosive step-up continues.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false, "notes": "Confirm plyometric clearance with Talent Hub physio before this session."}'::jsonb,
     null),

    (v_id, v_season, '2026-06-16', 'track',
     'Easy run plus extended strides',
     '20-minute easy run. Then 6 x 80-metre strides. Step frequency remains the primary focus but pace is now a secondary attention alongside cadence. Walk-back recovery. Strides should feel controlled and rhythmic rather than maximal.',
     '{"volume": "20 min plus 6 x 80m strides", "surface": "Track in trainers or grass", "rpe": "4-5 / RPE 7 strides", "protected": false, "cues": ["Rhythm carries the speed."]}'::jsonb,
     7),

    (v_id, v_season, '2026-06-17', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-18', 'track',
     'Tempo - 3 x 5 min on / 2 min off',
     '5-minute easy jog. Main set: 3 x 5 minutes at RPE 6.5-7. 2-minute walk recovery. Coach paces throughout. Effort duration is longer than the Phase 1 ceiling - deliberate progressive overload on the tempo system. Cadence cue active throughout.',
     '{"volume": "5 min easy + 3 x 5 min / 2 min walk. ~20 min total.", "surface": "Track in trainers", "rpe": "6.5-7", "protected": true, "cues": ["\"The effort goes up. The feet stay light.\"", "\"Longer rep, same feet.\""], "notes": "If quality drops significantly in rep 3, revert to 4 x 3 min the following week."}'::jsonb,
     7),

    (v_id, v_season, '2026-06-19', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-20', 'competition',
     'FIRST RACE - low-key regional fixture (TBC)',
     'First post-injury competitive outing. Purpose is rhythm and race feel only. No performance target. No time pressure. This is data collection: what does competitive racing feel like after the injury period? The 200m is included as a fatigue endurance stimulus only if the 400m is clean.',
     '{"volume": "400m primary. 200m as secondary if 400m clean.", "surface": "Track", "protected": false, "cues": ["\"Run your race. No one else''s.\"", "\"Rhythm first. Everything else follows.\""], "notes": "Venue: Mid Lancs or equivalent. Confirm no direct rivals on start list before entering. Result is not the measure of success."}'::jsonb,
     null),

    -- PHASE 2 WEEK 7
    (v_id, v_season, '2026-06-22', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-23', 'track',
     'Easy run with controlled accelerations',
     '20-minute easy run. Then 4 x 20-metre controlled accelerations at 80-85% effort. Focus entirely on drive phase and step frequency. Not max velocity. Full walk-back recovery. First controlled acceleration efforts on a standard track surface.',
     '{"volume": "20 min plus 4 x 20m controlled accelerations", "surface": "Track in trainers", "rpe": "4-5 / 80-85% accels", "protected": false, "cues": ["\"Smooth into fast. Don''t force it.\"", "\"Drive phase first. Speed is a consequence.\""], "notes": "Monitor metatarsal response. 24 and 48-hour response data informs the Bedford go/no-go decision."}'::jsonb,
     7),

    (v_id, v_season, '2026-06-24', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-25', 'track',
     'Tempo - 3 x 5 min on / 2 min off, quality progression',
     'Same structure as Week 6 Thursday. Quality expectation is higher - Maddy should feel more comfortable at this effort level having had race exposure. Coach paces reps 1 and 2. Maddy holds rep 3 independently.',
     '{"volume": "5 min easy + 3 x 5 min / 2 min walk.", "surface": "Track in trainers", "rpe": "7", "protected": true, "cues": ["\"Rep 3 is yours. Keep what I built.\"", "\"The rhythm is internalised now - show it.\""]}'::jsonb,
     7),

    (v_id, v_season, '2026-06-26', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-27', 'track',
     'Long run 25 min',
     'Easy long run. Maddy logs general fatigue and metatarsal response across the first full week of Phase 2.',
     '{"volume": "25 min continuous", "surface": "Grass or track in trainers", "rpe": "4-5", "protected": false}'::jsonb,
     5),

    -- PHASE 2 WEEK 8
    (v_id, v_season, '2026-06-29', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-06-30', 'track',
     'Cadence and drill session plus controlled accelerations',
     'Drill block. Easy run. Then 4 x 20-metre controlled accelerations on track. 80-85% effort. Drive phase and step frequency are the only focus. Not max velocity. Full walk-back recovery.',
     '{"volume": "~15 min plus 4 x 20m controlled accelerations", "surface": "Track in trainers", "rpe": "4-5 / 80-85% accels", "protected": false, "cues": ["\"80 percent. Not 100. The 80 teaches the 100.\"", "\"Drive. Don''t push.\""], "notes": "Note metatarsal response carefully. 24 and 48-hour response data informs the Bedford go/no-go decision."}'::jsonb,
     7),

    (v_id, v_season, '2026-07-01', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-02', 'track',
     'Tempo plus accelerations - final sharpener before Bedford decision',
     '5-minute easy jog. 3 x 5 min tempo at RPE 7, coach paced. Then 3 x 20m controlled accelerations. This is the final session before the Bedford decision gate. The quality of tempo rhythm and how the accelerations feel informs the go/no-go.',
     '{"volume": "5 min easy + 3 x 5 min / 2 min off + 3 x 20m accels", "surface": "Track in trainers", "rpe": "7 tempo / 85% accels", "protected": true, "cues": ["\"This is what ready feels like.\"", "\"If it feels right, it is right.\""], "notes": "BEDFORD DECISION GATE: based on Phase 1 completion, metatarsal response to track acceleration work, quality of this session, and confidence score. Confirm no direct rivals."}'::jsonb,
     7),

    (v_id, v_season, '2026-07-03', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-04', 'competition',
     'BEDFORD - England U20 and Senior T&F Championships (if decision gate passed)',
     'Championship sharpener if the decision gate is passed. Better field and atmosphere than a regional meet. No performance target - rhythm and competitive composure are the measures of success. If NOT entering Bedford: substitute a tempo session.',
     '{"volume": "400m primary. 200m optional secondary.", "surface": "Track", "protected": false, "cues": ["\"Compete your race. The result is information.\"", "\"Championship atmosphere is a tool. Use it.\""], "notes": "Confirm no direct rivals before entry."}'::jsonb,
     null),

    -- PHASE 3 WEEK 9
    (v_id, v_season, '2026-07-06', 'gym',
     'Talent Hub gym - strength maintenance and power',
     'Maintain Phase 2 gym loads. Power work continues. Introduce plyometric landing mechanics (double-leg) if cleared. Strength is now maintenance rather than development.',
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false, "notes": "Strength is now maintenance phase. Maintain explosive work at current load."}'::jsonb,
     null),

    (v_id, v_season, '2026-07-07', 'track',
     'Speed endurance - 150m specific work',
     'Warm-up including drills. Main set: 3 x 150 metres at 400m race effort - not a sprint, but the effort Maddy would sustain through the back straight of a race. Full walk-back recovery. Cadence focus is explicit: maintaining step frequency as the effort extends.',
     '{"volume": "Warm-up + 3 x 150m at 400m race effort / walk-back", "surface": "Track", "rpe": "8-8.5", "protected": false, "cues": ["\"400m effort, not 200m effort. Patience.\"", "\"The rhythm is the pace. Don''t search for more.\""], "notes": "Observe where cadence begins to break down within each rep."}'::jsonb,
     8),

    (v_id, v_season, '2026-07-08', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-09', 'track',
     'Speed endurance - race shape session',
     'Option A (preferred): 250m at 95% effort, 8-minute rest, 200m at 95%. Option B (if fatigued): 2 x 300m at 85%, 10-minute rest. Both options are within the 3K effort ceiling. Coach paces the opening 100m of each rep to establish rhythm.',
     '{"volume": "Option A: 1x250m / 8 min / 1x200m. Option B: 2x300m / 10 min.", "surface": "Track", "rpe": "8.5-9", "protected": true, "cues": ["\"Open rhythm. Don''t grab it - let it come.\"", "\"The second rep is the race. The first rep is the prep.\""], "notes": "Readiness below 6: Option B only. Below 5: substitute a tempo session. Highest intensity running session to date."}'::jsonb,
     9),

    (v_id, v_season, '2026-07-10', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-11', 'track',
     'Easy run plus strides',
     'Recovery-oriented easy run. Strides at the end - rhythm focus, not pace. Allow the body to process the quality work of the week.',
     '{"volume": "20 min plus 4 x 80m strides", "surface": "Track or grass", "rpe": "4-5 / 80%", "protected": false}'::jsonb,
     5),

    -- PHASE 3 WEEK 10
    (v_id, v_season, '2026-07-13', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-14', 'track',
     'Speed endurance - extended efforts',
     'Structure chosen based on week fatigue. Option A: 2 x 200m at 400m race effort / 6 min rest. Option B: 3 x 150m / 4 min rest. Coach paces the opening 80m of each rep. Cadence and rhythm across the full effort are the primary technical focus.',
     '{"volume": "2x200m / 6 min or 3x150m / 4 min", "surface": "Track", "rpe": "85-90%", "protected": false, "cues": ["\"Hold the rhythm in the back straight.\"", "\"When it gets hard - lighter feet, not more force.\""]}'::jsonb,
     8),

    (v_id, v_season, '2026-07-15', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-16', 'track',
     'Race shape - 2 x 300m or equivalent',
     'Option A: 2 x 300m / 10 min rest. Option B: 3 x 200m / 6 min rest. Structure determined by readiness. Coach paces the opening 80m of each rep.',
     '{"volume": "Option A: 2x300m / 10 min. Option B: 3x200m / 6 min.", "surface": "Track", "rpe": "85-90%", "protected": true, "cues": ["\"Hold the rhythm in the back straight.\"", "\"When it gets hard - lighter feet, not more force.\""]}'::jsonb,
     9),

    (v_id, v_season, '2026-07-17', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-18', 'competition',
     'Regional or open graded - Race 2',
     'Second competitive outing of Phase 3. Low-key regional or open graded. Maddy is now carrying meaningful speed endurance work - the race should feel more purposeful than the Phase 2 exposures. No performance target. Rhythm and second 200m composure are the focus.',
     '{"volume": "400m primary", "surface": "Track", "protected": false, "cues": ["\"Run the second 200 as well as the first.\"", "\"Rhythm from the gun. No panic.\""], "notes": "No direct rivals. Confirm start list before entry."}'::jsonb,
     null),

    -- PHASE 3 WEEK 11
    (v_id, v_season, '2026-07-20', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-21', 'track',
     'Speed endurance build',
     'Warm-up. 2 x 250m at 90% effort with full 8-minute recovery. Coach paces the opening 100m of each rep. Focus on maintaining rhythm through the point at which Maddy would normally begin to lose cadence.',
     '{"volume": "2 x 250m at 90% / 8 min rest", "surface": "Track", "rpe": "90%", "protected": false, "cues": ["\"200m mark - you''re ahead of the race. Stay there.\""]}'::jsonb,
     9),

    (v_id, v_season, '2026-07-22', 'gym',
     'Talent Hub gym', null,
     '{"volume": "Talent Hub programme", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-23', 'track',
     'Peak speed endurance - 1 x 350m or race simulation',
     'Highest intensity session of the season. 350m at 90% gives Maddy the experience of holding rhythm through the most demanding section of the 400m. The 150m finish piece is at near-race pace. Coach paces the opening 100m only.',
     '{"volume": "1x350m at 90% / 8 min / 1x150m at 95%. Or race simulation format.", "surface": "Track", "rpe": "90-95%", "protected": true, "cues": ["\"200m mark - you''re ahead of the race. Stay there.\"", "\"The last 100 is where championships are decided.\""], "notes": "If any concern: substitute 3 x 200m at 85%. Note where cadence breaks down within each rep."}'::jsonb,
     9),

    (v_id, v_season, '2026-07-24', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-07-25', 'competition',
     'Diamond League London - if invitation received',
     'If a Diamond League invitation is received, evaluate on timing relative to this plan, preparation quality at this point, and whether the race format is Para-specific or integrated. London is a world-class environment that tends to elevate performance.',
     '{"volume": "200m or 400m per invitation", "surface": "Track", "protected": false, "cues": ["\"World stage. Same rhythm.\"", "\"The environment is bigger. You are not smaller.\""], "notes": "Diamond League is a categorically different proposition from avoiding direct rivals. Evaluate on timing and race format, not on the same basis as regional competition."}'::jsonb,
     null),

    -- PHASE 3 WEEK 13 (W12 not specified - Diamond League/recovery)
    (v_id, v_season, '2026-08-04', 'track',
     'Final speed endurance sharpener',
     'Short and sharp. Race-pace 200m efforts with full recovery. These should feel fast and clean. The training is done - this session is a quality confirmation, not a load session.',
     '{"volume": "2 x 200m at race pace / 6 min rest", "surface": "Track", "rpe": "90-95%", "protected": false, "cues": ["Race pace. This is what 65 seconds feels like in a 200."]}'::jsonb,
     9),

    (v_id, v_season, '2026-08-05', 'gym',
     'Talent Hub gym - reduced load',
     'Maintenance only. No new stimulus. Reduce sets across all exercises.',
     '{"volume": "Reduced volume", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-08-06', 'track',
     'Light run plus strides',
     'Easy run to keep legs alive ahead of the tune-up race. 3 short strides at controlled pace. Nothing more.',
     '{"volume": "15 min easy plus 3 x 60m strides", "surface": "Track", "rpe": "4-5 / 85% strides", "protected": false, "cues": ["\"In and out. Sharp and gone.\""]}'::jsonb,
     5),

    (v_id, v_season, '2026-08-08', 'competition',
     'FINAL TUNE-UP RACE - North West or Yorkshire venue',
     'Final competitive outing before the championships. Familiar venue, friendly environment, no direct rivals. Purpose: arrive at the Para Championships with rhythm in the legs and competition confidence intact. This is a rhythm confirmation, not a time trial.',
     '{"volume": "400m", "surface": "Track", "protected": false, "cues": ["\"Competition sharp. Championship ready.\"", "\"Same race. Same rhythm. See you in 2 weeks.\""], "notes": "Familiar, comfortable venue only. No Grangemouth. No direct rivals. Confirm venue and start list at least 2 weeks in advance."}'::jsonb,
     null),

    -- PHASE 4 WEEK 14
    (v_id, v_season, '2026-08-10', 'gym',
     'Gym - taper load (60-70% of Phase 3 volume)',
     'Maintain movement patterns. Reduce sets and total volume to 60-70% of Phase 3. No new exercises. Keep explosive single-leg work at reduced volume. Purpose is neuromuscular freshness.',
     '{"volume": "Reduced: 60-70% of Phase 3 load", "surface": "Gym", "protected": false, "notes": "The gym is maintenance only. No chasing numbers."}'::jsonb,
     null),

    (v_id, v_season, '2026-08-11', 'track',
     'Short sharpener plus strides',
     '15-minute easy run. Then 4 x 60-metre strides at race pace feel. Walk recovery. Sharp and purposeful.',
     '{"volume": "15 min easy plus 4 x 60m at race pace", "surface": "Track", "rpe": "4-5 / 90% strides", "protected": false, "cues": ["Sharp and ready."], "notes": "If strides feel easy and fast, the taper is working."}'::jsonb,
     5),

    (v_id, v_season, '2026-08-12', 'gym',
     'Gym - maintenance',
     'Light session. Maintain movement patterns only.',
     '{"volume": "Reduced load", "surface": "Gym", "protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-08-13', 'track',
     'Race plan rehearsal - 3 x 150m at championship race pace',
     '3 x 150-metre runs at championship race pace. Full 6-minute recovery. These are race plan rehearsals, not fitness sessions. The exact pace, rhythm, and feel of the championship 400m opening 150m. Race plan is discussed and confirmed during the debrief.',
     '{"volume": "3 x 150m at championship race pace / 6 min recovery", "surface": "Track", "rpe": "90-95%", "protected": true, "cues": ["\"This is what 65 seconds feels like.\"", "\"Open rhythm. Controlled. Yours.\""], "notes": "Race plan agreed at this session and not changed before the championship. Full pre-session routine identical to the championship warm-up. Confidence score target 8 or above."}'::jsonb,
     9),

    (v_id, v_season, '2026-08-14', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-08-15', 'track',
     'Easy run plus 2 race-pace strides',
     'Short easy run. 2 x 60-metre strides at race pace feel - just enough to keep the neural system sharp. Walk recovery.',
     '{"volume": "15 min easy plus 2 x 60m at race pace", "surface": "Track", "rpe": "4-5 / 90% strides", "protected": false, "cues": ["\"In and out. Sharp and gone.\""]}'::jsonb,
     5),

    (v_id, v_season, '2026-08-16', 'psych',
     'Championship day visualisation - full script. Begin daily use from today.',
     'Full championship day script: waking up, travel, arrival at venue, warm-up, call room, race start, race, crossing the line. The complete narrative in sensory detail. Maddy reads this script every day from today until 22 August.',
     '{"volume": "10 min guided script", "surface": "Home", "protected": false, "script_ref": "VIS-CHAMP-DAY", "notes": "Coach provides final championship day visualisation script by 16 August. Shared digitally for mobile access. The race unfolds at 65 seconds. She crosses the line first."}'::jsonb,
     null),

    -- PHASE 4 WEEK 15
    (v_id, v_season, '2026-08-17', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-08-18', 'track',
     'Final sharpener - 2 x 100m at race pace',
     'Short warm-up. 2 x 100-metre runs at race pace feel. Walk-back recovery. These feel easy and fast - that is the signal the body is ready.',
     '{"volume": "15 min total including warm-up. 2 x 100m at race pace.", "surface": "Track", "rpe": "90%", "protected": false, "cues": ["\"Easy fast. That''s how you know.\""], "notes": "Last quality session before the championship. If it does not feel sharp, do not add more."}'::jsonb,
     9),

    (v_id, v_season, '2026-08-19', 'mobility',
     'Extended mobility plus visualisation',
     'Full-body extended mobility session: hip, thoracic, ankle. Then 10-minute championship day visualisation script.',
     '{"volume": "30 min mobility plus 10 min visualisation", "surface": "Home or gym", "protected": false, "notes": "The championship is 3 days away. The preparation is complete."}'::jsonb,
     null),

    (v_id, v_season, '2026-08-20', 'recovery',
     'Full rest', null,
     '{"protected": false}'::jsonb,
     null),

    (v_id, v_season, '2026-08-21', 'track',
     'Pre-championship activation',
     'Light activation only. Easy jog and 3 short strides to keep the legs feeling alive. Walk the track if venue access is available.',
     '{"volume": "10-15 min easy jog plus 3 x 40m strides", "surface": "Track (venue if accessible)", "rpe": "4-5 / easy", "protected": false, "cues": ["\"Arrive ready. Leave nothing to find out on the day.\"", "\"The work is done. This is just a reminder.\""], "notes": "Walk the track if access permits. Championship day visualisation script in the evening. Sleep is the priority tonight. Logistics confirmed: travel, accommodation, warm-up facility, call room timing."}'::jsonb,
     5),

    -- PHASE 5 - CHAMPIONSHIP
    (v_id, v_season, '2026-08-22', 'competition',
     'England Senior Para Championships - 400m',
     'England Senior Para Championships. 400m. The target race for the entire 2026 season.',
     '{"volume": "Championship programme", "surface": "Track", "protected": false, "cues": ["\"Trust what you have trained.\"", "\"Open rhythm. Controlled. Yours.\"", "\"The last 100 is where championships are decided.\""], "notes": "WIN. 65 seconds. UK T38 number 1. Talent Hub performance category evidence."}'::jsonb,
     null);


  -- ── 8. CUE LIBRARY ────────────────────────────────────────────────────────

  DELETE FROM cue_library WHERE coach_id = v_coach AND provisional_athlete_id = v_id;

  INSERT INTO cue_library
    (coach_id, provisional_athlete_id, body, category, event_group, tags)
  VALUES
    -- Phase 1 - Technical
    (v_coach, v_id, '"Same pace, quieter feet - 10 seconds."',        'technical',     'sprints', ARRAY['phase-1','highlighted','cadence']),
    (v_coach, v_id, '"Touch and go. As little time on the ground as possible."', 'technical', 'sprints', ARRAY['phase-1','highlighted','ground-contact']),
    (v_coach, v_id, '"Find the beat and stay on it."',                'technical',     'sprints', ARRAY['phase-1','highlighted','cadence','metronome']),
    (v_coach, v_id, '"Faster feet, same speed."',                     'technical',     'sprints', ARRAY['phase-1','highlighted','cadence']),
    (v_coach, v_id, '"Tall posture carries the rhythm."',             'technical',     'sprints', ARRAY['phase-1','highlighted','posture']),
    (v_coach, v_id, '"Quick off the ground - the skip teaches it."',  'technical',     'sprints', ARRAY['phase-1','highlighted','drills']),
    -- Phase 1 - AlterG
    (v_coach, v_id, '"Fast feet. Right side working."',               'physical',      'sprints', ARRAY['phase-1','highlighted','alterg','right-side']),
    (v_coach, v_id, '"Frequency first. Power follows."',              'physical',      'sprints', ARRAY['phase-1','highlighted','alterg']),
    (v_coach, v_id, '"Drive through it. Right leg earning its place."','physical',     'sprints', ARRAY['phase-1','highlighted','alterg','right-side']),
    -- Phase 1 - Pacing
    (v_coach, v_id, '"Chase me. Your only job is to stay with me."',  'tactical',      'sprints', ARRAY['phase-1','highlighted','pacing','coach-led']),
    (v_coach, v_id, '"The effort goes up. The feet stay light. One does not follow the other."', 'tactical', 'sprints', ARRAY['phase-1','highlighted','tempo']),
    -- Phase 1 - Psychological
    (v_coach, v_id, '"The second block is where it is built."',       'psychological', 'sprints', ARRAY['phase-1','highlighted','tempo']),
    (v_coach, v_id, '"25 minutes. Not 26."',                          'psychological', 'sprints', ARRAY['phase-1','long-run']),
    -- Phase 2 - Technical
    (v_coach, v_id, '"Faster without heavier. The ground gets quieter as the pace goes up."', 'technical', 'sprints', ARRAY['phase-2','highlighted','strides']),
    (v_coach, v_id, '"Smooth into fast. Don''t force it."',           'technical',     'sprints', ARRAY['phase-2','highlighted','acceleration']),
    (v_coach, v_id, '"Drive phase first. Speed is a consequence."',   'technical',     'sprints', ARRAY['phase-2','highlighted','acceleration']),
    (v_coach, v_id, '"80 percent. Not 100. The 80 teaches the 100."', 'technical',     'sprints', ARRAY['phase-2','highlighted','acceleration']),
    -- Phase 2 - Pacing
    (v_coach, v_id, '"Rep X is yours. Keep what I built."',           'tactical',      'sprints', ARRAY['phase-2','highlighted','self-regulation']),
    -- Phase 2 - Tactical
    (v_coach, v_id, '"Run your race. No one else''s."',               'tactical',      'sprints', ARRAY['phase-2','highlighted','pre-race']),
    (v_coach, v_id, '"Rhythm first. Everything else follows."',       'tactical',      'sprints', ARRAY['phase-2','highlighted','pre-race']),
    -- Phase 2 - Psychological
    (v_coach, v_id, '"Compete your race. The result is information."', 'psychological', 'sprints', ARRAY['phase-2','prep-race']),
    -- Phase 3 - Technical
    (v_coach, v_id, '"Hold the rhythm in the back straight."',        'technical',     'sprints', ARRAY['phase-3','highlighted','race-shape']),
    (v_coach, v_id, '"When it gets hard - lighter feet, not more force."', 'technical', 'sprints', ARRAY['phase-3','highlighted','speed-endurance']),
    (v_coach, v_id, '"400m effort, not 200m effort. Patience."',      'technical',     'sprints', ARRAY['phase-3','highlighted','race-pace']),
    -- Phase 3 - Tactical
    (v_coach, v_id, '"Open rhythm. Controlled. Yours."',              'tactical',      'sprints', ARRAY['phase-3','highlighted','race-start']),
    (v_coach, v_id, '"200m mark - you''re ahead of the race. Stay there."', 'tactical', 'sprints', ARRAY['phase-3','highlighted','race-shape']),
    (v_coach, v_id, '"The last 100 is where championships are decided."', 'tactical',  'sprints', ARRAY['phase-3','highlighted','race-finish']),
    -- Phase 3 - Psychological
    (v_coach, v_id, '"This is what ready feels like."',               'psychological', 'sprints', ARRAY['phase-3','highlighted','confidence']),
    (v_coach, v_id, '"World stage. Same rhythm."',                    'psychological', 'sprints', ARRAY['phase-3','highlighted','diamond-league']),
    -- Phase 4 - Psychological
    (v_coach, v_id, '"You have done the work."',                      'psychological', 'sprints', ARRAY['phase-4','highlighted','taper']),
    (v_coach, v_id, '"Easy fast. That''s how you know."',             'psychological', 'sprints', ARRAY['phase-4','highlighted','taper']),
    (v_coach, v_id, '"Arrive ready. Leave nothing to find out on the day."', 'psychological', 'sprints', ARRAY['phase-4','highlighted','pre-championship']),
    (v_coach, v_id, '"This is what 65 seconds feels like."',          'psychological', 'sprints', ARRAY['phase-4','highlighted','race-plan']),
    (v_coach, v_id, '"In and out. Sharp and gone."',                  'psychological', 'sprints', ARRAY['phase-4','highlighted','strides']),
    -- Phase 4 - Championship
    (v_coach, v_id, '"Trust what you have trained."',                 'psychological', 'sprints', ARRAY['phase-4','highlighted','championship-day']),
    (v_coach, v_id, '"Same race. Same rhythm. See you in 2 weeks."',  'psychological', 'sprints', ARRAY['phase-4','highlighted','post-tune-up']);


  -- ── 9. PSYCH SESSIONS ─────────────────────────────────────────────────────

  DELETE FROM psych_sessions WHERE provisional_athlete_id = v_id;

  INSERT INTO psych_sessions
    (provisional_athlete_id, coach_id, date, type, duration_minutes, description, coach_notes)
  VALUES
    (v_id, v_coach, '2026-05-31', 'visualisation', 7,
     'First formal visualisation session. Content: the feeling of running with good rhythm and light feet. Not race imagery - the sensation of good movement. Coach provides written or audio script.',
     'Script focus: light ground contact, rhythm and cadence at easy pace, following the coach, breathing comfortably. Not a race - just movement that feels right. Scheduled session, not optional supplemental work. Ref: VIS-W3-RHYTHM.'),

    (v_id, v_coach, '2026-06-07', 'visualisation', 7,
     'Week 4 script: begin to incorporate the competition environment. The warm-up routine before a race. Arriving at the track. The feel of the track surface. Not the race itself yet - just the approach.',
     'Script focus: arriving at the venue, the warm-up when preparation is right, standing on the track feeling ready. The rhythm is already present before the race begins. Coach check-in conversation this week. Ref: VIS-W4-ARRIVAL.'),

    (v_id, v_coach, '2026-07-09', 'visualisation', 8,
     'Race start and the first 100m of the 400m. Sensory detail of the start sequence and opening rhythm.',
     'Introduced alongside the first race-shape key session. The script should mirror the opening rhythm cue agreed in session. Ref: VIS-W9-RACESTART.'),

    (v_id, v_coach, '2026-07-23', 'visualisation', 8,
     'Full 400m race with emphasis on the final 100m. The complete race narrative for the first time.',
     'Introduced alongside the peak speed endurance key session. The final 100m framing in the script should match the championship race plan being developed. Ref: VIS-W11-FULL400.'),

    (v_id, v_coach, '2026-08-16', 'visualisation', 10,
     'Full championship day script. Begin daily use from this date. Complete narrative: waking, travel, arrival, warm-up, call room, race start, race, finish.',
     'Coach provides final championship day script by 16 August. Shared digitally so Maddy can access on her phone. Maddy uses this script every day from 16 to 22 August. The race unfolds at 65 seconds. She crosses the line first. Ref: VIS-CHAMP-DAY.');


  -- ── 10. VISUALISATION SCRIPTS ─────────────────────────────────────────────

  DELETE FROM visualisation_scripts WHERE provisional_athlete_id = v_id;

  INSERT INTO visualisation_scripts
    (provisional_athlete_id, coach_id, title, body, script_type, event, published)
  VALUES
    (v_id, v_coach,
     'Running rhythm - light feet and good movement',
     'The feeling of running with good rhythm and light feet. Easy pace. Following the coach from behind. Breathing is comfortable. Ground contact is light and quick. Nothing is forced. Quiet footfall. The sound of even, rhythmic breathing. Light ground contact on both feet. The feeling of the coach''s pace pulling you forward without effort.',
     'general', null, true),

    (v_id, v_coach,
     'Arriving at the track - the approach to competition',
     'Arriving at the venue. The warm-up routine when preparation is right. Standing on the track feeling ready. Not the race yet - just the approach. The rhythm is already present before the race begins. The feeling of the track surface underfoot. The sound of a stadium warming up. The sensation of a warm-up that is going well. A sense of calm readiness rather than anxiety.',
     'general', '400m', true),

    (v_id, v_coach,
     'Race start - the first 100m of the 400m',
     'The call room. The walk to the track. The set position. The gun. The opening 100m - rhythm establishes immediately, the pace feels controlled, the right side is working. The stillness of the set position. The explosion of the start. The feeling of rhythm establishing within the first 20 metres. The opening straight feels controlled and purposeful.',
     'race', '400m', true),

    (v_id, v_coach,
     'Full 400m race - complete narrative including the final 100m',
     'The complete 400m from start to finish. Opening rhythm. The back straight - cadence holds. The bend - the race is being run well. The final 100m - this is where championships are decided. The finish line. Opening rhythm feels right. Back straight: lighter feet, not more force. The 200m mark: ahead of the race. The final straight: the legs have something left because the rhythm was maintained.',
     'race', '400m', true),

    (v_id, v_coach,
     'Championship day - complete day narrative',
     'Waking up on the day. Travel to the venue. Arrival. The warm-up - it goes exactly as rehearsed. The call room - calm and focused. The race start. The race itself: rhythm from the gun, the back straight holds, the final 100m is taken. Crossing the line. The quality of the morning. The familiar feeling of the pre-competition routine. The track surface at the venue. The sound of the stadium. The feeling of the race unfolding at 65 seconds. The finish line. The result.',
     'race', '400m', true);


  RAISE NOTICE 'Done. Season: %, Phases: 5, Comps: 6, PBs: 10, Results: 33, Sessions: 86, Cues: 36, Psych: 5, VIS scripts: 5', v_season;
END $$;
