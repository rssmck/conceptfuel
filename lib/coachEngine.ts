// ─── TYPES ────────────────────────────────────────────────────────────────────

export type Discipline = 'sprints' | 'hurdles' | 'middle_distance' | 'endurance'

export type SprintEvent    = '60m' | '100m' | '200m' | '400m'
export type HurdleEvent    = '80mH' | '100mH' | '110mH' | '300mH' | '400mH'
export type MiddleEvent    = '800m' | '1500m' | '3000m' | 'steeplechase'
export type EnduranceEvent = '5000m' | '10000m' | 'cross_country' | 'road'
export type AthleticsEvent = SprintEvent | HurdleEvent | MiddleEvent | EnduranceEvent

export type AgeGroup  = 'u11' | 'u13' | 'u15' | 'u17' | 'u20' | 'senior' | 'masters'
export type Ability   = 'development' | 'club' | 'performance'
export type Venue     = 'outdoor_track' | 'indoor_track' | 'road' | 'grass'
export type GroupSize = 'individual' | 'small' | 'squad'

export type SprintSessionType    = 'acceleration' | 'max_velocity' | 'speed_endurance_short' | 'speed_endurance_long' | 'race_practice'
export type HurdleSessionType    = 'rhythm_spacing' | 'lead_leg' | 'trail_leg' | 'full_runs'
export type MiddleSessionType    = 'speed_endurance' | 'threshold' | 'vo2max' | 'race_pace' | 'kick'
export type EnduranceSessionType = 'easy' | 'tempo' | 'intervals' | 'long_run'
export type SessionType          = SprintSessionType | HurdleSessionType | MiddleSessionType | EnduranceSessionType

export interface CoachInput {
  discipline:   Discipline
  event:        AthleticsEvent
  age_group:    AgeGroup
  ability:      Ability
  venue:        Venue
  session_type: SessionType
  group_size:   GroupSize
}

export interface WarmupPhase {
  name:       string
  duration:   string
  activities: string[]
  note?:      string
}

export interface Drill {
  name:        string
  volume:      string
  cue:         string
  error?:      string
}

export interface MainSetRep {
  label:    string
  volume:   string
  target?:  string
}

export interface CoachSessionPlan {
  overview: {
    title:          string
    age_group:      string
    venue:          string
    duration_min:   number
    intensity:      string
    ea_note?:       string
  }
  footwear: {
    recommendation: string
    warning?:       string
    rationale:      string
  }
  warmup:   WarmupPhase[]
  drills:   Drill[]
  main_set: {
    overview:       string
    reps:           MainSetRep[]
    recovery:       string
    cues:           string[]
    errors:         string[]
    modifications?: string
  }
  cooldown: {
    activities:         string[]
    duration_min:       number
    reflection_prompt?: string
  }
  coaching_notes: string[]
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const AGE_LABELS: Record<AgeGroup, string> = {
  u11: 'Under 11', u13: 'Under 13', u15: 'Under 15', u17: 'Under 17',
  u20: 'Under 20', senior: 'Senior', masters: 'Masters',
}

const VENUE_LABELS: Record<Venue, string> = {
  outdoor_track: 'Outdoor track', indoor_track: 'Indoor track',
  road: 'Road', grass: 'Grass',
}

const EVENT_LABELS: Record<AthleticsEvent, string> = {
  '60m': '60m', '100m': '100m', '200m': '200m', '400m': '400m',
  '80mH': '80m hurdles', '100mH': '100m hurdles', '110mH': '110m hurdles',
  '300mH': '300m hurdles', '400mH': '400m hurdles',
  '800m': '800m', '1500m': '1500m', '3000m': '3000m', 'steeplechase': 'Steeplechase',
  '5000m': '5000m', '10000m': '10000m', 'cross_country': 'Cross country', 'road': 'Road',
}

const SESSION_LABELS: Record<SessionType, string> = {
  acceleration: 'Acceleration', max_velocity: 'Maximum velocity',
  speed_endurance_short: 'Speed endurance — short', speed_endurance_long: 'Speed endurance — long',
  race_practice: 'Race practice',
  rhythm_spacing: 'Rhythm and spacing', lead_leg: 'Lead leg mechanics',
  trail_leg: 'Trail leg mechanics', full_runs: 'Full hurdle runs',
  speed_endurance: 'Speed endurance', threshold: 'Threshold / tempo',
  vo2max: 'VO\u2082max intervals', race_pace: 'Race pace work', kick: 'Kick development',
  easy: 'Easy run', tempo: 'Tempo', intervals: 'Track intervals', long_run: 'Long run',
}

function isJunior(ag: AgeGroup): boolean {
  return ['u11', 'u13', 'u15', 'u17'].includes(ag)
}

function isTrack(venue: Venue): boolean {
  return venue === 'outdoor_track' || venue === 'indoor_track'
}

// ─── FOOTWEAR ─────────────────────────────────────────────────────────────────

function getFootwear(discipline: Discipline, venue: Venue, age_group: AgeGroup): CoachSessionPlan['footwear'] {
  if (age_group === 'u11' || age_group === 'u13') {
    return {
      recommendation: 'Regular trainers only',
      warning: 'NO SPIKES — U11 and U13 athletes must not use spikes in training or competition. Developing bones and growth plates are at significant risk of stress injury. Regular trainers throughout, no exceptions.',
      rationale: 'At U11/U13 the skeleton is still developing and growth plates are vulnerable. Spikes alter forefoot loading mechanics and create stress fracture risk with no performance justification at this stage.',
    }
  }
  if (age_group === 'u15') {
    return {
      recommendation: 'Training flats or road shoes',
      warning: 'Spikes: competition only. Not in training. If athletes bring spikes, ask them to leave them in their bag for today.',
      rationale: 'U15 athletes should wear spikes only on race day. One supervised familiarisation session (short reps, drills only) is acceptable in the season before first track competition. All other training in flats.',
    }
  }
  if (age_group === 'u17') {
    return {
      recommendation: 'Training flats or tempo shoes',
      warning: 'Spikes: competition only, or one familiarisation session per season (drills + short reps under supervision). Not for regular training.',
      rationale: 'U17 athletes can introduce spikes for competition with a single familiarisation session. This session does not require spikes — flats develop the same qualities without the loading risk.',
    }
  }
  // Senior / U20 / Masters
  if (isTrack(venue) && (discipline === 'sprints' || discipline === 'hurdles')) {
    return {
      recommendation: 'Training flats or tempo shoes. Spikes acceptable for experienced athletes only.',
      rationale: 'This session does not require spikes. Athletes experienced with spikes may wear them. Road runners or athletes new to track should remain in flats — the biomechanical shift alone is sufficient adaptation load for today.',
    }
  }
  return {
    recommendation: 'Training flats appropriate to surface',
    rationale: 'Regular trainers. Carbon racers are fine if athletes are accustomed to them for quality sessions. No spikes needed.',
  }
}

// ─── WARM-UP ──────────────────────────────────────────────────────────────────

function getWarmup(discipline: Discipline, age_group: AgeGroup, venue: Venue): WarmupPhase[] {
  const jogKm = age_group === 'u11' ? '600m' : age_group === 'u13' ? '800m' : discipline === 'endurance' ? '1500m' : '1200m'

  const dynamicMobility: WarmupPhase = {
    name: 'Dynamic mobility',
    duration: '4 min',
    activities: [
      'Leg swings — forward and lateral, 10 each leg',
      'Hip circles — 8 each direction',
      'Ankle rotations — 10 each foot',
      'Knee hugs walking — 10m',
      'Lunge with rotation — 10m',
      'Inchworms — 10m',
    ],
    note: 'No static stretching in the warm-up. Keep everything moving and progressive.',
  }

  const sprintDrills: WarmupPhase = {
    name: 'Running drills',
    duration: '6 min',
    activities: [
      'A-march × 2 (20m each)',
      'A-skip × 2 (20m each)',
      'B-skip × 2 (20m each)',
      'High knees — 20m',
      'Butt kicks — 20m',
      'Lateral shuffle — 20m each direction',
    ],
    note: 'Focus on tall posture and ground contact under hips. Correct sloppy A-skip mechanics early — the drill is the session.',
  }

  const progressiveRuns: WarmupPhase = {
    name: 'Progressive runs',
    duration: '4 min',
    activities: [
      '3 × 60m building from 60% to 80% effort',
      'Full walk recovery between each',
      'Final run should feel controlled but quick',
    ],
    note: 'Not sprinting yet — building to sprint. The last 60m should feel like the bottom of a gear, not the top.',
  }

  const strides: WarmupPhase = {
    name: 'Strides',
    duration: '4 min',
    activities: [
      '4 × 80m building to 85% effort',
      'Full walk recovery',
      'Focus on relaxed mechanics and rhythm',
    ],
  }

  if (discipline === 'sprints' || discipline === 'hurdles') {
    return [
      { name: 'Easy jog', duration: '5 min', activities: [`${jogKm} easy jog — conversational pace`] },
      dynamicMobility,
      sprintDrills,
      progressiveRuns,
    ]
  }

  if (discipline === 'middle_distance') {
    return [
      { name: 'Easy jog', duration: '8 min', activities: [`${jogKm} easy jog`] },
      { ...dynamicMobility, activities: dynamicMobility.activities.slice(0, 4) },
      { name: 'Running drills', duration: '4 min', activities: ['A-march × 2 (20m)', 'A-skip × 2 (20m)', 'High knees — 20m', 'Butt kicks — 20m'] },
      strides,
    ]
  }

  // Endurance
  return [
    { name: 'Easy jog', duration: '10 min', activities: [`${jogKm} easy jog — truly easy, building gradually`] },
    { ...dynamicMobility, activities: dynamicMobility.activities.slice(0, 4) },
    strides,
  ]
}

// ─── DRILLS ───────────────────────────────────────────────────────────────────

function getDrills(discipline: Discipline, session_type: SessionType, age_group: AgeGroup): Drill[] {
  if (discipline === 'sprints') {
    const base: Drill[] = [
      {
        name: 'Wall drive',
        volume: '3 × 10 contacts each leg',
        cue: 'Hands on wall, body at 45°. Drive one knee up powerfully, foot dorsiflexed. Other leg drives into the ground. Hips stay square.',
        error: 'Hips sinking or rotating — indicates weak glute drive. Reset posture.',
      },
      {
        name: 'Falling start',
        volume: '4 × 20m',
        cue: 'Stand tall, lean forward from the ankles until balance is lost, then drive. First ground contact under hips, not in front.',
        error: 'Jumping forward rather than falling. Lean should feel uncomfortable — that\'s correct.',
      },
    ]
    if (session_type === 'max_velocity') {
      base.push({
        name: 'Ankling',
        volume: '3 × 20m',
        cue: 'Small, rapid ground contacts directly under hips. Foot dorsiflexed on contact. Minimal knee lift — this is about stiffness and contact time, not drive.',
        error: 'Heel striking or slow contact. Should sound like a light, rapid drum.',
      })
    }
    return base
  }

  if (discipline === 'hurdles') {
    return [
      {
        name: 'Lead leg over low hurdle (walked)',
        volume: '3 × 5 hurdles',
        cue: 'Snap the lead leg up and through — knee first, then foot. Do not reach for the hurdle. Bring the leg down actively.',
        error: 'Reaching the leg out rather than snapping up. Results in landing too far from the hurdle.',
      },
      {
        name: 'Trail leg over low hurdle (static)',
        volume: '3 × 5 each side',
        cue: 'Hip comes through first. Knee at hip height as it clears. Foot dorsiflexed throughout. Think "hip through, knee through, foot through" — in that order.',
        error: 'Trail leg trailing behind with foot catching the hurdle. Usually means hip rotation is too late.',
      },
      {
        name: '3-stride rhythm between hurdles',
        volume: '3 runs — low hurdles set close',
        cue: 'Land, one, two, three, attack. Rhythm should be even. If the third stride feels cramped, adjust your first landing point further from the hurdle.',
        error: 'Inconsistent stride pattern. Count out loud if needed — rhythm first, speed second.',
      },
    ]
  }

  if (discipline === 'middle_distance') {
    return [
      {
        name: 'A-skip with arm emphasis',
        volume: '3 × 30m',
        cue: 'Drive elbows back — not forward. Hands relaxed, not clenched. Arm cycle drives the leg cycle. Tall hips throughout.',
        error: 'Arms crossing the body midline. Creates rotation, kills efficiency.',
      },
      {
        name: 'Bounding strides',
        volume: '3 × 40m',
        cue: 'Exaggerate the flight phase between each step. Push through the toe, drive the knee. Land softly on midfoot. Think "hang time".',
        error: 'Flat-footed landing or short ground contact. Should feel springy.',
      },
    ]
  }

  // Endurance
  return [
    {
      name: 'Running tall — posture cue',
      volume: '2 × 60m',
      cue: 'Imagine a string pulling the crown of your head upward. Slight forward lean from the ankles, not the waist. Shoulders relaxed and low.',
      error: 'Chin poking forward or shoulders raised. Both signal tension — cue "head back, shoulders down".',
    },
    {
      name: 'Cadence drill — short quick steps',
      volume: '2 × 30m',
      cue: 'Take the shortest steps you can while still moving forward. Focus on contact time, not stride length. Count steps — aim for 25-28 per 10 seconds.',
      error: 'Overstriding in reaction to "run faster". Shorter contact = faster running.',
    },
  ]
}

// ─── MAIN SET ─────────────────────────────────────────────────────────────────

function getMainSet(input: CoachInput): CoachSessionPlan['main_set'] {
  const { discipline, event, session_type, age_group, ability } = input
  const isU = isJunior(age_group)
  const volMod = ability === 'development' ? 0.75 : ability === 'performance' ? 1.2 : 1.0

  // ── SPRINTS ──────────────────────────────────────────────────────────────────

  if (discipline === 'sprints') {
    if (session_type === 'acceleration') {
      const reps = Math.round(6 * volMod)
      return {
        overview: `Drive phase development. Short, maximal efforts with full recovery. Quality over quantity — stop the session if mechanics deteriorate.`,
        reps: [
          { label: 'Falling starts', volume: `${reps} × 30m`, target: 'Drive phase through 25-30m. Hips rising gradually.' },
          { label: 'Block or standing start 40m', volume: `${Math.round(4 * volMod)} × 40m`, target: 'Full drive phase into upright mechanics.' },
        ],
        recovery: 'Full walk back recovery — minimum 3 min between reps. Speed work requires it. Do not cut recovery.',
        cues: [
          '"Push the ground away" — not push yourself forward',
          '"Stay low through the first 20m" — hips rise, don\'t jump upright',
          '"Drive the arms — elbows back, not forward"',
          '"Head down — eyes on the track 5m ahead"',
          'Smooth, not tense — a clenched jaw kills a sprint',
        ],
        errors: [
          'Standing upright too early (first 15m) — most common error. Wastes the drive phase entirely.',
          'Arms crossing the body — causes rotation, kills forward force',
          'Heel striking on first ground contact — cue "attack the track with the forefoot"',
        ],
        modifications: isU
          ? 'Reduce to 4-5 reps. If this is a first structured acceleration session, use falling starts only. U11/U13: use "chase" games or reaction starts to develop drive phase without technical overload.'
          : undefined,
      }
    }

    if (session_type === 'max_velocity') {
      return {
        overview: `Maximum velocity work. Short distance, absolute effort in the fly zone. Athletes need full acceleration before the timed/effort section. Not for beginners or first track sessions.`,
        reps: [
          { label: 'Flying 20m', volume: `${Math.round(5 * volMod)} × (30m build + 20m fly)`, target: 'Absolute relaxed maximum. Timed if possible.' },
          { label: 'Flying 30m', volume: `${Math.round(3 * volMod)} × (40m build + 30m fly)`, target: 'Maintain mechanics through the fly zone.' },
        ],
        recovery: '5-6 min full recovery between reps. Max velocity is neurologically demanding — inadequate recovery produces slower reps and teaches the wrong mechanics.',
        cues: [
          '"Relax the face, relax the hands" — tension at max velocity costs metres',
          '"Paw back at the ground" — foot should be moving backward before contact',
          '"Tall hips, tall hips" — dropping the hips at max velocity is the most common power leak',
          '"Quick off the ground — not powerful, quick"',
        ],
        errors: [
          'Trying to push harder rather than move faster — max velocity is about frequency, not force',
          'Overstriding — foot landing ahead of hips bleeds speed',
          'Head bobbing — indicates tension. Cue a long neck.',
        ],
        modifications: isU
          ? 'U15 and below: max velocity work should be supervised closely. Reduce fly zone to 15m. U11/U13: not appropriate as a structured session — use fun sprint games instead.'
          : undefined,
      }
    }

    if (session_type === 'speed_endurance_short') {
      const reps = Math.round(5 * volMod)
      return {
        overview: `Short speed endurance. 150-200m efforts at controlled race pace. Develops the ability to hold mechanics and speed through the second half of a 100m or 200m.`,
        reps: [
          { label: '150m efforts', volume: `${reps} × 150m`, target: '200m race pace. Not all-out — sustainable through the rep.' },
        ],
        recovery: '8-10 min full recovery. Incomplete recovery produces lactic work, not speed endurance.',
        cues: [
          '"Run tall from the start — this isn\'t a sprint, it\'s a controlled effort"',
          '"Maintain arm mechanics when it hurts — arms drive legs"',
          '"Don\'t tighten up in the last 30m" — the most common collapse point',
        ],
        errors: [
          'Going too fast early and dying — should be even pace, not fast-slow',
          'Arms shortening under fatigue — drill arm carry separately if needed',
        ],
        modifications: ability === 'development' ? 'Use 100m efforts. Build to 150m over the block.' : undefined,
      }
    }

    if (session_type === 'speed_endurance_long') {
      return {
        overview: `Long speed endurance. 300-400m efforts. Core session for 400m athletes — develops race-specific lactate tolerance and the ability to finish.`,
        reps: [
          { label: '300m efforts', volume: `${Math.round(3 * volMod)} × 300m`, target: '400m race pace or slightly faster.' },
        ],
        recovery: '10-12 min full recovery between reps. This is not circuit training — full recovery is the session design.',
        cues: [
          '"Even pace through 200m — the last 100m will hurt regardless"',
          '"Keep the hips up in the back straight" — where 400m races are lost',
          '"Count your strides if you need to — gives your brain something to hold onto"',
        ],
        errors: [
          'Racing the first 100m — results in a 50m death march at the end. Controlled start is the key discipline.',
          'Dropping the arms at 250m — cue arms first, legs will follow',
        ],
      }
    }

    // race_practice
    return {
      overview: `Race simulation. Full distance at race pace in a competitive environment. Useful late in a training block or before a key competition.`,
      reps: [
        { label: 'Time trial', volume: `1-2 × ${event}`, target: 'Race pace or time trial effort.' },
      ],
      recovery: 'Full 15-20 min recovery if doing two reps.',
      cues: [
        'Treat this exactly as race day — full warm-up, race mindset, race mechanics',
        'Brief debrief after each run: what felt good, what do we fix',
      ],
      errors: ['Holding back on a time trial — defeats the purpose. Commit to the effort.'],
    }
  }

  // ── HURDLES ──────────────────────────────────────────────────────────────────

  if (discipline === 'hurdles') {
    if (session_type === 'rhythm_spacing') {
      return {
        overview: 'Hurdle rhythm — 3 strides between, consistent spacing, approach confidence. Hurdles set low or at competition height depending on experience.',
        reps: [
          { label: 'Walk through', volume: '2 × full flight (low hurdles)', target: 'Feel the spacing, no pressure.' },
          { label: 'Jog through', volume: '3 × full flight (low hurdles)', target: 'Maintain rhythm at reduced pace.' },
          { label: 'Race pace runs', volume: `${Math.round(4 * volMod)} × full flight`, target: 'Competition height if confident.' },
        ],
        recovery: '3-4 min walk between race-pace runs.',
        cues: [
          '"Attack the hurdle — don\'t reach for it"',
          '"Land close to the hurdle, not far from it" — long landing = lost stride',
          '"Three strides — same every time. If it feels rushed, fix the landing, not the stride."',
          '"Eyes up — look at hurdle 2 while clearing hurdle 1"',
        ],
        errors: [
          'Breaking to 4 strides — cue "count out loud" and shorten early strides if needed',
          'Landing too far from the hurdle — jump is too high. Cue "low and flat over, not high and curved"',
          'Inconsistent lead leg — use chalk marks to identify landing positions',
        ],
      }
    }

    if (session_type === 'lead_leg') {
      return {
        overview: 'Lead leg technique — isolated drill work and partial hurdle runs. Patient, repetitive, deliberate.',
        reps: [
          { label: 'Lead leg drill — walking', volume: '3 × 5 hurdles (low)', target: 'Perfect mechanics, slow speed.' },
          { label: 'Lead leg drill — jogging', volume: '3 × 5 hurdles', target: 'Maintain mechanics at jog pace.' },
          { label: 'One-hurdle runs from 3 strides out', volume: `${Math.round(6 * volMod)} runs`, target: 'Controlled approach, perfect lead leg.' },
        ],
        recovery: 'Walk back.',
        cues: [
          '"Knee up first — the foot follows the knee"',
          '"Snap down — the lead leg should hit the ground, not float down"',
          '"Tall posture over the hurdle — don\'t collapse the torso"',
          'Demonstrate slowly, then at pace. Most athletes understand in their body what they can\'t process verbally.',
        ],
        errors: [
          'Reaching the leg out straight — cue "fold the knee, not kick the foot"',
          'Leaning back over the hurdle — causes landing to be behind the centre of mass',
        ],
      }
    }

    if (session_type === 'trail_leg') {
      return {
        overview: 'Trail leg mechanics. Often the weaker side for most athletes. Hip rotation is the key, not the leg.',
        reps: [
          { label: 'Static trail leg — one side of hurdle', volume: '3 × 10 each side (low hurdles)', target: 'Hip through, knee through, foot through — in order.' },
          { label: 'Walking lead + trail combined', volume: '3 × 5 hurdles', target: 'Full flight, slow.' },
          { label: 'Full runs — trail leg focus', volume: `${Math.round(4 * volMod)} × full flight`, target: 'Conscious trail leg mechanics at speed.' },
        ],
        recovery: 'Walk back.',
        cues: [
          '"Hip comes through first — everything else follows"',
          '"Knee at hip height as it clears — not dragging low"',
          '"Foot dorsiflexed — if the foot is floppy, it catches the hurdle"',
          'Use video on a phone if possible — trail leg errors are hard to feel and easy to see',
        ],
        errors: [
          'Trail leg foot catching the hurdle — almost always because the hip isn\'t coming through first',
          'Trail leg going wide around the hurdle — hip rotation insufficient',
        ],
      }
    }

    // full_runs
    return {
      overview: 'Full hurdle runs at competition height and spacing. Technical consolidation at pace.',
      reps: [
        { label: 'Full flight runs', volume: `${Math.round(5 * volMod)} × full flight`, target: 'Competition height, race pace.' },
      ],
      recovery: '4-5 min between runs.',
      cues: [
        'Pick one technical focus point per run — not everything at once',
        '"What were you thinking about in that run?" — debrief each rep with the athlete',
        'If rhythm breaks down, go back to drills. Don\'t let athletes rehearse bad mechanics.',
      ],
      errors: [
        'Fading in the last 2-3 hurdles — fitness issue, not technical. Note and address in conditioning.',
        'Lead leg varying between sides — standardise the preferred lead leg before worrying about the other.',
      ],
    }
  }

  // ── MIDDLE DISTANCE ──────────────────────────────────────────────────────────

  if (discipline === 'middle_distance') {
    if (session_type === 'speed_endurance') {
      const reps = Math.round(5 * volMod)
      const dist = event === '800m' ? '300m' : event === '1500m' ? '400m' : '600m'
      return {
        overview: `Speed endurance — repeated ${dist} efforts at controlled race pace. Develops the lactate tolerance and mechanical resilience needed to finish races strongly.`,
        reps: [
          { label: `${dist} reps`, volume: `${reps} × ${dist}`, target: 'Controlled race pace. Even splits across all reps.' },
        ],
        recovery: `${event === '800m' ? '4-5' : '5-6'} min jog recovery between reps. Keep moving — standing recovery kills the lactate response.`,
        cues: [
          '"First rep is a promise — run what you can repeat"',
          '"Tall and relaxed through the middle of each rep" — the collapse point is usually 60-70% through',
          '"Drive the arms at 80% effort onwards — arms drive legs"',
          `"${event === '800m' ? 'Kick through the line, not to it' : 'Last 200m — empty the tank'}"`,
        ],
        errors: [
          'Going out too fast on rep 1 — splits each rep after. Establish a target time and hold to it.',
          'Recovery standing still — athletes should jog the recovery even if it feels slower',
          'Mechanics falling apart from rep 3 onwards — reduce volume, not pace',
        ],
        modifications: isU ? `${age_group.toUpperCase()} athletes: reduce to ${Math.round(reps * 0.75)} reps. Monitor recovery between reps closely.` : undefined,
      }
    }

    if (session_type === 'threshold') {
      return {
        overview: 'Threshold / tempo work. Sustained effort at the top of the aerobic zone. The session that builds the engine.',
        reps: [
          { label: 'Threshold reps', volume: `${Math.round(3 * volMod)} × 6 min`, target: 'Comfortably hard — 7/10 effort. Sustainable but requiring concentration.' },
        ],
        recovery: '90s jog between reps. Short by design — this is threshold, not intervals.',
        cues: [
          '"You should be able to answer a question but not want to say much more" — the threshold check',
          '"Even pace — don\'t go out hard and hang on"',
          '"Tall posture, relaxed shoulders, quick feet"',
        ],
        errors: [
          'Going anaerobic — if the athlete is blowing hard after 2 minutes, they are too fast',
          'Recovery walking — jog the recovery, always',
        ],
      }
    }

    if (session_type === 'vo2max') {
      const reps = Math.round(5 * volMod)
      return {
        overview: `VO\u2082max intervals. Short, hard efforts with full recovery. Develops maximal aerobic power — the ceiling you race beneath.`,
        reps: [
          { label: 'VO\u2082max reps', volume: `${reps} × 3 min`, target: 'Hard — 8.5/10. Should be difficult to hold conversation.' },
        ],
        recovery: '3 min jog recovery — equal work to rest. Full recovery is essential for true VO\u2082max stimulus.',
        cues: [
          '"Hard from the start, not heroic at the end" — even effort throughout',
          '"Don\'t let the pace drift in the last minute — hold it"',
          '"Controlled aggression — not panicked, not comfortable"',
        ],
        errors: [
          'Too easy on early reps, blowout on later reps — establish target pace before the session',
          'Recovery too short — VO\u2082max work needs full recovery to produce the adaptation',
        ],
        modifications: isU ? 'Reduce to 2 min reps for U15 and below. Monitor closely — VO\u2082max intensity is high for developing athletes.' : undefined,
      }
    }

    if (session_type === 'race_pace') {
      const dist = event === '800m' ? '200m' : event === '1500m' ? '400m' : '600m'
      const reps = Math.round(6 * volMod)
      return {
        overview: `Race pace work. Specific conditioning at exact goal race pace. Teaches the body to recognise and reproduce race effort.`,
        reps: [
          { label: `Race pace ${dist}`, volume: `${reps} × ${dist}`, target: `Exact goal race pace — not faster, not slower.` },
        ],
        recovery: '3 min jog.',
        cues: [
          '"This is what race pace feels like — memorise it"',
          '"Relaxed at race pace — if it feels tense, you\'re fighting it not running it"',
          '"No surging — smooth, even, consistent"',
        ],
        errors: [
          'Running faster than race pace — defeats the specificity purpose. Slow down.',
          'Inconsistent splits — time every rep and call the splits out loud',
        ],
      }
    }

    // kick
    return {
      overview: 'Kick development. Short, fast efforts after a threshold or race-pace base — training the gear change.',
      reps: [
        { label: 'Threshold 4 min + kick 200m', volume: `${Math.round(4 * volMod)} sets`, target: 'Hold threshold, then accelerate into the 200m — do not slow on transition.' },
      ],
      recovery: '4 min jog.',
      cues: [
        '"The kick is an acceleration, not a sprint — controlled gear change"',
        '"Increase cadence first, then open the stride"',
        '"Hips tall when you kick — don\'t hunch"',
      ],
      errors: ['Slowing before kicking — the gear change should be seamless, not a stop-start'],
    }
  }

  // ── ENDURANCE ────────────────────────────────────────────────────────────────

  if (session_type === 'tempo') {
    return {
      overview: 'Tempo run. Sustained effort at the comfortably hard zone — the most important session for endurance athletes. Not easy, not racing.',
      reps: [
        { label: 'Continuous tempo', volume: `${ability === 'development' ? '15' : ability === 'performance' ? '30' : '20'} min continuous`, target: 'Comfortably hard. Could answer a question, wouldn\'t want to.' },
      ],
      recovery: 'No recovery — continuous effort.',
      cues: [
        '"Controlled aggression — working, not surviving"',
        '"Don\'t look at the watch every 30 seconds — settle in and run"',
        '"Tall, relaxed, forward — that\'s all you need to think about"',
      ],
      errors: [
        'Too fast early — tempo is not a time trial. Establish pace in the first 3 minutes.',
        'Drifting pace — either too comfortable or starting to race. Both wrong.',
      ],
    }
  }

  if (session_type === 'intervals') {
    const dist = event === '5000m' ? '1km' : event === '10000m' ? '1km' : '800m'
    const reps = Math.round((event === '5000m' ? 5 : 6) * volMod)
    return {
      overview: `Track intervals. Repeated ${dist} reps with jog recovery. Classic endurance quality work.`,
      reps: [
        { label: `${dist} reps`, volume: `${reps} × ${dist}`, target: '5k-10k effort. Hard but not all-out.' },
      ],
      recovery: '90s-2 min jog between reps. Keep moving.',
      cues: [
        '"Consistent pace — last rep same as first rep"',
        '"Relaxed but working — this should feel controlled"',
        '"Don\'t stand still on recovery — jog it"',
      ],
      errors: ['Positive splitting (going faster then slower) — the classic beginner error. Establish target pace.'],
    }
  }

  if (session_type === 'long_run') {
    return {
      overview: 'Long easy run. Aerobic base building. The most important session in the endurance athlete\'s week — and the most abused.',
      reps: [{ label: 'Continuous easy run', volume: `${ability === 'development' ? '40' : ability === 'performance' ? '90' : '60'} min`, target: 'Truly easy. Should be able to hold a full conversation throughout.' }],
      recovery: 'No recovery needed — continuous.',
      cues: [
        '"If you can\'t say a full sentence, you\'re too fast" — the easy run check',
        '"Easy means easy — it\'s not about covering distance, it\'s about time on feet"',
        'Do not let athletes race the easy run. It is one of the most common causes of overtraining.',
      ],
      errors: [
        'Too fast — 90% of athletes run their easy runs too fast. This accumulates fatigue without aerobic benefit.',
        'Shortened by athletes who find it boring — explain the adaptation: capillary development, mitochondrial density, fat oxidation.',
      ],
    }
  }

  // easy
  return {
    overview: 'Easy aerobic run. Recovery session or base building. Controlled, relaxed, truly easy.',
    reps: [{ label: 'Easy run', volume: '20-40 min', target: 'Conversational pace. Below 70% max HR.' }],
    recovery: 'No recovery — continuous.',
    cues: ['"Easy means easy" — no ego today', '"Relax into it — this is recovery"'],
    errors: ['Going too fast. The easy run is not a test.'],
  }
}

// ─── COOLDOWN ─────────────────────────────────────────────────────────────────

function getCooldown(discipline: Discipline, age_group: AgeGroup): CoachSessionPlan['cooldown'] {
  const base = {
    activities: [
      'Easy jog 800m-1000m — bring the HR down gradually',
      'Static hip flexor stretch — 30s each side',
      'Standing quad stretch — 30s each side',
      'Hamstring stretch — seated or standing, 30s each side',
      'Calf stretch — straight leg and bent knee, 30s each',
      'Glute stretch (figure-four or pigeon) — 30s each side',
    ],
    duration_min: 12,
    reflection_prompt: 'Ask each athlete: one thing that felt good and one thing to work on next session.',
  }

  if (age_group === 'u11' || age_group === 'u13') {
    return {
      ...base,
      activities: [
        'Easy walk or jog 5 min',
        'Group stretching — make it interactive, not clinical',
        'Hip flexors, quads, hamstrings — 20s each, guided',
      ],
      duration_min: 8,
      reflection_prompt: 'Ask them: what was the hardest bit? What would they do differently?',
    }
  }

  if (discipline === 'sprints' || discipline === 'hurdles') {
    return {
      ...base,
      activities: [
        ...base.activities,
        'Hip flexor mobilisation — 10 slow lunges each side',
        'Ankle circles — 10 each direction',
      ],
    }
  }

  return base
}

// ─── COACHING NOTES ───────────────────────────────────────────────────────────

function getCoachingNotes(input: CoachInput): string[] {
  const { discipline, session_type, age_group, ability, group_size, venue } = input
  const notes: string[] = []

  // EA welfare notes for juniors
  if (age_group === 'u11' || age_group === 'u13') {
    notes.push('EA safeguarding: ensure a minimum of two adults present. Never be alone with an individual athlete. Maintain a register.')
    notes.push('U11/U13: session should feel fun-first. If athletes are disengaged or struggling, adapt — development at this stage is about enjoyment and habit formation, not performance.')
    notes.push('Monitor for signs of fatigue closely — young athletes are less able to self-regulate effort.')
  }

  if (age_group === 'u15' || age_group === 'u17') {
    notes.push('EA welfare: maintain athlete register. Two adults present where possible.')
    notes.push('U15/U17: growth plate awareness — if an athlete reports persistent knee, hip or heel pain, do not push through. Sever\'s disease (heel) and Osgood-Schlatter (knee) are common at this age group.')
  }

  // Session-specific notes
  if (session_type === 'max_velocity' || session_type === 'acceleration') {
    notes.push('Speed sessions carry injury risk if athletes are not fully warmed up. Do not skip or rush the warm-up regardless of time pressure.')
    notes.push('Stop any athlete who reports hamstring tightness or pain. Do not encourage them to "run it off".')
  }

  if (discipline === 'hurdles') {
    notes.push('Lower the hurdle height before you lower the expectation. A technical failure over a lower hurdle teaches more than a physical clearance over full height.')
    notes.push('Hurdle fear is real. Never embarrass an athlete who pulls up. Build confidence deliberately.')
  }

  if (session_type === 'long_run' || session_type === 'easy') {
    notes.push('Police the pace. Easy runs done too fast are one of the most common causes of cumulative overload. Use a heart rate or pace guide and enforce it.')
  }

  if (group_size === 'squad') {
    notes.push('Squad management: brief the group on session structure before starting. Athletes who understand the why execute better.')
    notes.push('Pair development athletes with club athletes for sessions where this is safe — peer modelling works.')
  }

  if (venue === 'outdoor_track') {
    notes.push('Track etiquette: brief athletes on lane discipline before the session, especially for groups. Inner lanes for quality work, outer lanes for warm-up.')
  }

  if (!notes.length) {
    notes.push('Ensure all athletes sign in before starting. Debrief at the end — 2 min to capture what worked and what to address next session.')
  }

  return notes
}

// ─── GENERATE ─────────────────────────────────────────────────────────────────

export function generateCoachSession(input: CoachInput): CoachSessionPlan {
  const warmupMin = input.discipline === 'endurance' ? 15 : input.discipline === 'sprints' ? 20 : 18
  const mainSetMin = input.session_type === 'long_run' ? (input.ability === 'performance' ? 90 : 60) : 30
  const cooldownMin = isJunior(input.age_group) ? 8 : 12

  const intensityMap: Partial<Record<SessionType, string>> = {
    acceleration: 'High — maximal efforts, full recovery',
    max_velocity: 'High — absolute maximum, neurologically demanding',
    speed_endurance_short: 'High — race pace efforts',
    speed_endurance_long: 'Very high — lactate tolerance',
    threshold: 'Moderate-high — comfortably hard, sustained',
    vo2max: 'High — near-maximal aerobic effort',
    race_pace: 'Moderate-high — precise race pace',
    kick: 'Moderate-high — threshold into fast finish',
    speed_endurance: 'High — race pace plus',
    tempo: 'Moderate-high — sustained effort',
    intervals: 'High — hard aerobic intervals',
    long_run: 'Low — truly easy',
    easy: 'Low — recovery or base',
    rhythm_spacing: 'Moderate — technical focus',
    lead_leg: 'Moderate — technical focus',
    trail_leg: 'Moderate — technical focus',
    full_runs: 'Moderate-high — full effort hurdles',
    race_practice: 'Very high — race simulation',
  }

  return {
    overview: {
      title: `${SESSION_LABELS[input.session_type]} — ${EVENT_LABELS[input.event]}`,
      age_group: AGE_LABELS[input.age_group],
      venue: VENUE_LABELS[input.venue],
      duration_min: warmupMin + mainSetMin + cooldownMin,
      intensity: intensityMap[input.session_type] ?? 'Moderate',
      ea_note: isJunior(input.age_group) ? `England Athletics ${AGE_LABELS[input.age_group]} guidelines apply. See coaching notes.` : undefined,
    },
    footwear: getFootwear(input.discipline, input.venue, input.age_group),
    warmup: getWarmup(input.discipline, input.age_group, input.venue),
    drills: getDrills(input.discipline, input.session_type, input.age_group),
    main_set: getMainSet(input),
    cooldown: getCooldown(input.discipline, input.age_group),
    coaching_notes: getCoachingNotes(input),
  }
}
