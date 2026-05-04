-- ============================================================
-- Maddy Markham full season seed
-- Run AFTER: coach-athlete-schema, provisional-athletes,
--            athlete-id-nullable, seasons
-- Safe to re-run (deletes and re-inserts phases/comps)
-- ============================================================

DO $$
DECLARE
  v_id      uuid;
  v_coach   uuid;
  v_season  uuid;
BEGIN
  SELECT id, coach_id INTO v_id, v_coach
  FROM provisional_athletes WHERE name = 'Maddy Markham' LIMIT 1;

  IF v_id IS NULL THEN RAISE EXCEPTION 'Maddy Markham not found in provisional_athletes'; END IF;

  -- Profile and coaching principles
  UPDATE provisional_athletes SET
    classification       = 'T38',
    club                 = 'Leeds City AC',
    event_group          = 'sprints',
    season_goal          = 'Sub-65s, UK T38 #1',
    target_event         = '400m',
    target_performance   = 'Sub-65s',
    target_date          = '2026-08-22',
    athlete_type         = 'Rhythm runner. Cannot turn up at a high-level meet without lower-key race exposure first. Requires competitive priming before championship environments.',
    training_model       = 'Endurance-led. Get fit before get fast. Tempo and threshold work is the primary vehicle. Does not respond well to pure sprint methodology (long rest, CNS-maximal sessions).',
    competition_strategy = 'All pre-championship races are low-key rhythm exposures with no performance pressure.',
    technical_priority   = 'Cadence deficit and heavy footfall. Long stride becomes energy-costly in the 400m second half. Primary technical development goal for 2026.',
    pacing_model         = 'Responds strongly to following-the-coach model. External rhythm removes self-regulation burden and allows full attention on technical execution.',
    session_structure    = 'Intensity days: Tuesday, Thursday, Saturday only. Thursday key session is protected throughout and is not moved or shortened regardless of other session adjustments.',
    talent_hub           = true,
    talent_hub_notes     = 'Performance category evidence required by August. Communication protocol with sprint group essential — training must not be added without notifying coach.',
    coach_notes          = 'T38. Right-side motor control and sensation significantly reduced (birth stroke). Epilepsy with major seizure history. Classification formalised May/June 2025.'
  WHERE id = v_id;

  -- Get or create the Outdoor Track 2026 season
  SELECT id INTO v_season FROM seasons WHERE provisional_athlete_id = v_id LIMIT 1;
  IF v_season IS NULL THEN
    INSERT INTO seasons (provisional_athlete_id, coach_id, name, season_type, start_date, end_date, goal, target_event, target_performance, target_date, status)
    VALUES (v_id, v_coach, 'Outdoor Track 2026', 'outdoor_track', '2026-05-12', '2026-08-23', 'Sub-65s, UK T38 #1', '400m', 'Sub-65s', '2026-08-22', 'active')
    RETURNING id INTO v_season;
  END IF;

  -- Phases (delete and re-insert so this is safe to re-run)
  DELETE FROM season_phases WHERE provisional_athlete_id = v_id;
  INSERT INTO season_phases (provisional_athlete_id, season_id, name, start_date, end_date, "order", focus, training_focus, competition_notes, key_cue, coach_notes)
  VALUES
    (v_id, v_season, 'Reconditioning',    '2026-05-12', '2026-06-13', 1, 'Return',
     'Metatarsal load confirmation. Aerobic base rebuild. Cadence and ground contact embedded in tempo. Intensity days: Tue, Thu, Sat only. AlterG conditional on availability (Phase 1 only).',
     'None',
     'Same pace, quieter feet.',
     'Decision gate end of Week 1. Visualisation introduced Week 3. Thursday key session protected throughout. Grass and trainers used where impact reduction is needed.'),

    (v_id, v_season, 'Sharpening',        '2026-06-14', '2026-07-05', 2, 'Activate',
     'First competitive exposures. Tempo extended. Controlled track accelerations introduced. Intensity days: Tue, Thu, Sat.',
     '~20 Jun low-key regional (TBC). Bedford 3-5 Jul decision gate.',
     'Chase me. Your only job is to stay with me.',
     'Bedford entry confirmed mid-June only if Phase 1 complete.'),

    (v_id, v_season, 'Championship build', '2026-07-06', '2026-08-09', 3, 'Develop',
     'Speed endurance. Race sharpness. 2-3 competitive outings. Cadence consolidation under race conditions. 400m-specific session structure.',
     '~18 Jul regional. ~7 Aug tune-up (NW/Yorks). Diamond League London if invited.',
     'The second half is where it is built.',
     'No direct competition clashes. Final tune-up 5-9 Aug at familiar NW or Yorkshire venue.'),

    (v_id, v_season, 'Taper and peak',    '2026-08-10', '2026-08-21', 4, 'Confirm',
     'Volume reduces 30-40%. Intensity maintained. Race strategy rehearsed. No new technical cues. Psychological environment calm and positive.',
     'None after tune-up race.',
     'You have done the work.',
     'Race plan agreed and rehearsed in full before arriving at venue. Championship day visualisation used daily from 16 Aug.'),

    (v_id, v_season, 'Target',            '2026-08-22', '2026-08-23', 5, 'Execute',
     'England Senior Para Championships - 400m.',
     'England Senior Para Championships (A priority).',
     'Trust what you have trained.',
     'UK T38 #1. Talent Hub performance category evidence required by August.');

  -- Competitions (delete and re-insert so this is safe to re-run)
  DELETE FROM competitions WHERE provisional_athlete_id = v_id;
  INSERT INTO competitions (provisional_athlete_id, season_id, date, end_date, meeting, priority, status, events, purpose)
  VALUES
    (v_id, v_season, '2026-06-20', null,         'Low-key regional',                  'gate', 'upcoming', ARRAY['400m'], 'Race exposure and rhythm priming. No performance pressure. Date TBC.'),
    (v_id, v_season, '2026-07-03', '2026-07-05', 'Bedford',                           'gate', 'upcoming', ARRAY['400m'], 'Decision gate. Entry confirmed mid-June only if Phase 1 complete.'),
    (v_id, v_season, '2026-07-18', null,         'Regional',                          'gate', 'upcoming', ARRAY['400m'], 'Championship build outing.'),
    (v_id, v_season, '2026-08-07', null,         'Tune-up (NW/Yorks)',                'key',  'upcoming', ARRAY['400m'], 'Final tune-up at familiar NW or Yorkshire venue. Window: 5-9 Aug.'),
    (v_id, v_season, '2026-08-22', '2026-08-23', 'England Senior Para Championships', 'A',    'upcoming', ARRAY['400m'], 'A race. Sub-65s. UK T38 #1. Talent Hub performance evidence required.');

  RAISE NOTICE 'Done. Season: %, Phases: 5, Comps: 5', v_season;
END $$;
