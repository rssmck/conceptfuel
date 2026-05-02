// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RunTier = 1 | 2 | 3 | 4
export type GoalRace = 'weekly5k' | '5k' | '10k' | 'half' | 'marathon' | 'ultra' | 'hyrox' | 'fitness'
export type ElevationProfile = 'flat' | 'undulating' | 'hilly' | 'mountain'
export type TrainingApproach = 'standard' | 'norwegian' | 'hybrid'
export type RunPhase = 'base' | 'build' | 'peak' | 'taper' | 'recovery'
export type SessionType = 'easy' | 'tempo' | 'threshold' | 'intervals' | 'long' | 'recovery' | 'strides' | 'hill_reps' | 'race_sim' | 'double_threshold' | 'vo2max' | 'neuromuscular' | 'walk_run' | 'rest' | 'strength' | 'mobility'

export interface TrainingZones {
  easy:      string  // MM:SS/km
  marathon:  string
  tempo:     string
  threshold: string
  interval:  string
  rep:       string
}

export interface RunSession {
  type:         SessionType
  label:        string
  description:  string
  target_km?:   number
  target_pace?: string  // MM:SS/km
  structure?:   string  // e.g. "16 × 400m @ 5k pace, 100m jog recovery"
  notes?:       string
  duration_min?: number
  is_club_session?: boolean
  club_alternative?: string  // full description of alt if they can't make club
}

export interface RunWeek {
  week_number: number
  phase:       RunPhase
  phase_note:  string
  total_km:    number
  sessions:    RunSession[]
}

export interface RunPlanTemplate {
  name:       string
  tier:       RunTier
  goal_race:  GoalRace
  vdot?:      number
  training_zones?: TrainingZones
  plan_weeks: number
  weeks:      RunWeek[]
}

export interface RunPlanInput {
  tier:                RunTier
  goal_race:           GoalRace
  race_date?:          string
  target_time?:        string
  elevation_profile:   ElevationProfile
  weekly_km?:          number
  longest_recent_km?:  number
  recent_race_distance?: string
  recent_race_time?:   string    // 'H:MM:SS' or 'MM:SS'
  lt_pace?:            string    // 'MM:SS' per km
  vo2max?:             number
  days_per_week:       number
  available_days?:     string[]
  club_night?:         string
  club_session_type?:  string
  gym_access?:         boolean
  include_strength?:   boolean
  include_mobility?:   boolean
  training_approach:   TrainingApproach
  starts_on:           string
  plan_weeks?:         number
  name?:               string
}

// ─── PACE UTILITIES ───────────────────────────────────────────────────────────

function paceToSecs(pace: string): number {
  if (!pace || typeof pace !== 'string') return 0
  const parts = pace.split(':').map(Number)
  if (parts.some(isNaN) || parts.length === 0) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + (parts[1] ?? 0)
}

function secsToMMSS(secs: number): string {
  if (!isFinite(secs) || secs <= 0) return '0:00'
  let m = Math.floor(secs / 60)
  let s = Math.round(secs % 60)
  if (s === 60) { m++; s = 0 }
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Parse race time string 'H:MM:SS' or 'MM:SS' or 'HH:MM:SS' to total minutes
function raceTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60
  return parts[0] + (parts[1] ?? 0) / 60
}

// Race distance to meters
function raceDistanceToMeters(dist: string): number {
  const map: Record<string, number> = {
    'weekly5k': 5000, '5k': 5000, '10k': 10000,
    'half': 21097, 'marathon': 42195, 'ultra': 50000, 'hyrox': 10000
  }
  return map[dist] ?? 5000
}

// Daniels VDOT calculation from race performance
export function calcVDOT(distanceKm: number, timeMinutes: number): number {
  const d = distanceKm * 1000  // meters
  const t = timeMinutes        // minutes
  const pctVO2 = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
  const vo2 = -4.60 + 0.182258 * (d / t) + 0.000104 * Math.pow(d / t, 2)
  return Math.round((vo2 / pctVO2) * 10) / 10
}

// Derive m/min from target VO2 using inverse Daniels formula
function vo2ToSpeedMperMin(targetVO2: number): number {
  const a = 0.000104
  const b = 0.182258
  const c = -(targetVO2 + 4.60)
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
}

// Derive training zones from VDOT. Returns MM:SS/km pace strings.
export function calcZonesFromVDOT(vdot: number): TrainingZones {
  const speedAt = (pct: number) => vo2ToSpeedMperMin(vdot * pct)
  // speed is m/min → secs/km = 60000/speed
  const toPace  = (speed: number) => secsToMMSS(60000 / speed)
  return {
    easy:      toPace(speedAt(0.65)),
    marathon:  toPace(speedAt(0.80)),
    tempo:     toPace(speedAt(0.86)),
    threshold: toPace(speedAt(0.88)),
    interval:  toPace(speedAt(0.98)),
    rep:       toPace(speedAt(1.07)),
  }
}

// If user provides LT pace directly, derive all zones from it
export function calcZonesFromLTPace(ltPace: string): TrainingZones {
  const ltSecs = paceToSecs(ltPace)
  return {
    easy:      secsToMMSS(ltSecs * 1.28),
    marathon:  secsToMMSS(ltSecs * 1.08),
    tempo:     secsToMMSS(ltSecs * 1.03),
    threshold: secsToMMSS(ltSecs),
    interval:  secsToMMSS(ltSecs * 0.92),
    rep:       secsToMMSS(ltSecs * 0.85),
  }
}

// Elevation adjustment: add seconds per km based on elevation profile
function elevationPaceAdjustment(profile: ElevationProfile): number {
  const adjust: Record<ElevationProfile, number> = {
    flat: 0, undulating: 8, hilly: 20, mountain: 40
  }
  return adjust[profile]
}

function adjustPaceForElevation(pace: string, profile: ElevationProfile): string {
  const adj = elevationPaceAdjustment(profile)
  if (adj === 0) return pace
  return secsToMMSS(paceToSecs(pace) + adj)
}

// ─── PHASE LOGIC ──────────────────────────────────────────────────────────────

const PHASE_NOTES: Record<RunPhase, string> = {
  base: 'Aerobic foundation. Keep effort genuinely easy — if you can\'t hold a conversation, you\'re going too hard. Consistency matters more than intensity at this stage.',
  build: 'Controlled quality work begins. One quality session per week. Easy days stay easy. The temptation to push too hard on easy days is where most training goes wrong.',
  peak: 'Highest training load. This is where the fitness is made. Recover properly between sessions — sleep, food and hydration are training too.',
  taper: 'Volume drops sharply, intensity stays. Trust the process. The fitness is already built — the taper is when it consolidates. Rest is the session.',
  recovery: 'Active recovery week. Low volume, no quality sessions. Keep moving, stay loose, let the adaptations from the previous block settle.',
}

function getPlanWeeks(goalRace: GoalRace, raceDateStr?: string, startsOn?: string, manualWeeks?: number): number {
  if (manualWeeks) return manualWeeks
  if (raceDateStr && startsOn) {
    const weeks = Math.floor((new Date(raceDateStr).getTime() - new Date(startsOn).getTime()) / (7 * 24 * 3600 * 1000))
    return Math.min(Math.max(weeks, 4), 20)
  }
  const defaults: Record<GoalRace, number> = {
    weekly5k: 6, '5k': 8, '10k': 10, half: 12, marathon: 16, ultra: 18, hyrox: 10, fitness: 8
  }
  return defaults[goalRace]
}

// How many taper weeks for each race type
function taperWeeks(goalRace: GoalRace): number {
  if (goalRace === 'marathon' || goalRace === 'ultra') return 3
  if (goalRace === 'half') return 2
  return 1
}

function getPhase(week: number, total: number, goalRace: GoalRace): RunPhase {
  const pct = week / total
  if (goalRace === 'fitness') return week <= total * 0.5 ? 'base' : 'build'
  const tw = taperWeeks(goalRace)
  if (total <= 6) {
    if (week === total) return 'taper'
    return pct <= 0.5 ? 'base' : 'build'
  }
  if (week > total - tw) return 'taper'
  if (pct <= 0.3) return 'base'
  if (pct <= 0.65) return 'build'
  return 'peak'
}

// ─── SESSION LIBRARY ──────────────────────────────────────────────────────────

// Returns paced session label suffix
function paceNote(pace: string): string {
  return pace ? ` @ ${pace}/km` : ''
}

// Returns how far into the current phase this week is (1-indexed)
function getPhaseWeek(week: number, totalWeeks: number, goalRace: GoalRace): number {
  const currentPhase = getPhase(week, totalWeeks, goalRace)
  let count = 0
  for (let w = 1; w <= week; w++) {
    if (getPhase(w, totalWeeks, goalRace) === currentPhase) count++
  }
  return count
}

// Build sessions for a week based on tier, phase, goal, and training preferences
function buildWeekSessions(
  input: RunPlanInput,
  week: number,
  phase: RunPhase,
  zones: TrainingZones | undefined,
  weeklyKm: number,
  totalWeeks: number,
  phaseWeek: number,
): RunSession[] {
  const { tier, goal_race, days_per_week, club_night, training_approach } = input
  const include_strength = input.include_strength ?? false
  const include_mobility = input.include_mobility ?? false
  const sessions: RunSession[] = []
  const isTaper = phase === 'taper'
  const isPeak  = phase === 'peak'
  const isBuild = phase === 'build'
  const isBase  = phase === 'base'
  // How deep into taper: 1 = first taper week (e.g. marathon week -2), taperWeeks = race week
  const tw = taperWeeks(goal_race)
  const taperDepth = isTaper ? Math.max(1, tw - (totalWeeks - week)) : 0  // 1 = early taper, tw = race week

  // ── Tier 1: walk/run intervals ──────────────────────────────────────────────
  if (tier === 1) {
    const progressPct = week / totalWeeks
    const runMin  = Math.round(5 + progressPct * 25)   // 5 → 30 min
    const walkMin = Math.max(0, Math.round(20 - progressPct * 20))

    const session1: RunSession = {
      type: 'walk_run',
      label: 'Run/walk A',
      description: progressPct < 0.5
        ? `${Math.round(runMin * 0.4)} min jog, ${walkMin} min walk — repeat × 2`
        : `${runMin} min continuous run — slow is fine, just keep moving`,
      duration_min: runMin + walkMin,
      notes: 'Keep effort very low. You should be able to speak in full sentences throughout. Walk whenever needed.',
    }

    sessions.push(session1)

    if (days_per_week >= 2) {
      sessions.push({
        type: 'walk_run',
        label: 'Run/walk B',
        description: progressPct < 0.6
          ? `Walk 5 min warm-up. ${Math.round(runMin * 0.6)} min jog, 2 min walk × 3.`
          : `${Math.round(runMin * 0.8)} min easy run — comfortable effort`,
        duration_min: Math.round(runMin * 0.8) + 5,
        notes: 'Effort 4/10. No rushing.',
      })
    }

    if (days_per_week >= 3) {
      sessions.push({
        type: 'easy',
        label: progressPct >= 0.8 ? 'Longest run' : 'Longer walk/run',
        description: progressPct >= 0.8
          ? `${Math.round(weeklyKm * 0.4)} km easy run — this is your long one. Slow down if needed.`
          : `${Math.round(weeklyKm * 0.35)} km walk with running stretches — keep it easy`,
        target_km: Math.round(weeklyKm * 0.38 * 10) / 10,
        notes: 'This should feel manageable. If it doesn\'t, slow down or add walk breaks.',
      })
    }

    return sessions
  }

  // ── Tiers 2–4 ──────────────────────────────────────────────────────────────

  // Long run (always included from tier 2+)
  const longKm = isTaper
    ? taperDepth === 1 && tw >= 3
      ? Math.round(weeklyKm * 0.35)   // first taper week — still a decent long run, just not maximal
      : taperDepth <= tw - 1
      ? Math.round(weeklyKm * 0.30)   // mid taper — moderate
      : Math.round(weeklyKm * 0.25)   // race week — short confidence run
    : isPeak
    ? Math.round(weeklyKm * 0.38)
    : Math.round(weeklyKm * 0.33)

  const longRunNote = isTaper
    ? taperDepth === 1
      ? 'First taper week. Still a real long run but volume down. Easy effort throughout — no heroics. The fitness is already there.'
      : taperDepth <= tw - 1
      ? 'Taper is working. This is a comfort run — keep it easy, enjoy it. No pressure on pace or distance.'
      : 'Race week. Short confidence run only. Easy pace, familiar route, just get the legs moving. Nothing more.'
    : 'Easy effort throughout. If running with others, you should be able to hold a conversation.'

  const longRun: RunSession = {
    type: 'long',
    label: isTaper && taperDepth === tw ? 'Race week easy run' : 'Long run',
    description: isTaper
      ? `${longKm} km easy${zones?.easy ? ` @ ${zones.easy}/km or slower` : ''} — relaxed, no effort.`
      : isPeak && (goal_race === 'marathon' || goal_race === 'half')
      ? `${longKm} km with final ${Math.round(longKm * 0.25)} km at ${zones?.marathon ?? 'goal race'}/km — progressive finish to practise running on tired legs`
      : `${longKm} km easy run${paceNote(zones?.easy ?? '')} — aerobic base building`,
    structure: isPeak && (goal_race === 'marathon' || goal_race === 'half')
      ? `${longKm} km progressive — final ${Math.round(longKm * 0.25)} km @ marathon pace`
      : `${longKm} km easy`,
    target_km: longKm,
    target_pace: zones?.easy,
    notes: longRunNote,
  }
  sessions.push(longRun)

  // Recovery / easy days
  const easyKm = Math.round(weeklyKm * 0.15)
  const easyRun: RunSession = {
    type: 'easy',
    label: 'Easy run',
    description: `${easyKm} km easy${zones?.easy ? ` @ ${zones.easy}/km or slower` : ''}. Fully aerobic, minimal effort.`,
    structure: `${easyKm} km easy`,
    target_km: easyKm,
    target_pace: zones?.easy,
    notes: 'If this feels hard, slow down. Easy means easy. No ego on these days.',
  }

  // Strides (tier 2+ on easy days)
  const stridesSession: RunSession = {
    type: 'strides',
    label: 'Easy + strides',
    description: `${easyKm} km easy${paceNote(zones?.easy ?? '')}, then 6–8 × 20s strides${zones?.rep ? ` @ ${zones.rep}/km` : ' at controlled sprint pace'} with 40s walk between. Total ~${easyKm + 1} km.`,
    structure: `${easyKm} km easy + 6–8 × 20s strides`,
    target_km: easyKm + 1,
    notes: 'Strides are short, sharp and smooth — not all-out sprints. Focus on quick turnover and relaxed form. Full walk recovery.',
  }

  // ── Quality sessions by tier ────────────────────────────────────────────────

  // Tier 2: one tempo per week from build phase
  if (tier === 2) {
    if (!isBase && !isTaper) {
      const tempoKm = isBuild ? Math.round(weeklyKm * 0.15) : Math.round(weeklyKm * 0.18)
      sessions.push({
        type: 'tempo',
        label: 'Tempo run',
        description: `${Math.round(tempoKm * 0.2)} km easy warm-up, then ${tempoKm} km at tempo effort${paceNote(zones?.tempo ?? '')} — comfortably hard, controlled breathing. ${Math.round(tempoKm * 0.15)} km easy cool-down.`,
        target_km: tempoKm + Math.round(tempoKm * 0.35),
        target_pace: zones?.tempo,
        notes: 'Tempo effort is about 7/10 — hard enough that you can only speak a few words, but sustainable for 20+ minutes.',
      })
    }
    sessions.push(days_per_week >= 3 ? stridesSession : easyRun)
    if (days_per_week >= 4) sessions.push(easyRun)
    if (days_per_week >= 5) sessions.push({ ...easyRun, label: 'Recovery run', description: `${Math.round(easyKm * 0.7)} km very easy — pure recovery, HR below 70% max.` })
    return sessions
  }

  // Tier 3 + 4: structured quality
  const isShortRace = goal_race === 'weekly5k' || goal_race === '5k' || goal_race === '10k'
  const isLongRace  = goal_race === 'marathon' || goal_race === 'ultra'
  const isHyrox     = goal_race === 'hyrox'

  // Quality session 1 — the main track/interval session
  let quality1: RunSession

  // Rotation slot and iteration — drives progression within a phase
  const ROTATION = 4
  const slot = (phaseWeek - 1) % ROTATION            // 0–3
  const iter = Math.floor((phaseWeek - 1) / ROTATION) // how many full rotations completed
  const isRecoverySlot = slot === 3 && !isPeak        // slot 3 in non-peak = active recovery

  if (isBase) {
    // Base: strides on slot 0-1, light fartlek on slot 2-3 for variety
    if (slot <= 1) {
      quality1 = stridesSession
    } else {
      quality1 = {
        type: 'easy',
        label: 'Fartlek run',
        description: zones?.easy
          ? `${easyKm + 1} km easy with 5 × 1 min surges @ ${zones.tempo ?? 'tempo'}/km effort, 2 min easy between. Unstructured — just feel it.`
          : `${easyKm + 1} km easy with 5 × 1 min pick-ups, 2 min easy between. Light effort, no pressure.`,
        structure: `${easyKm + 1} km easy + 5 × 1 min surges`,
        notes: 'Base phase — no hard quality work yet. Surges wake the legs up without accumulating fatigue.',
      }
    }
  } else if (isTaper) {
    if (taperDepth === 1 && tw >= 3) {
      // First week of a 3-week taper — still a light quality session, just reduced volume
      const earlyTaperReps = isShortRace ? '6 × 400m' : '3 × 1km'
      const earlyTaperPace = isShortRace ? zones?.interval : zones?.threshold
      quality1 = {
        type: isShortRace ? 'intervals' : 'threshold',
        label: 'Light quality — taper begins',
        description: earlyTaperPace
          ? `2 km easy warm-up. ${earlyTaperReps} @ ${earlyTaperPace}/km, full jog recovery. 1 km cool-down. Volume reduced — quality maintained.`
          : `2 km warm-up. ${earlyTaperReps} at race effort, full jog recovery. 1 km cool-down.`,
        structure: `${earlyTaperReps}, jog recovery`,
        target_pace: earlyTaperPace,
        notes: 'First taper week. Reduce volume, keep the stimulus. This is not the week to push — it\'s the week to let the training bed in.',
      }
    } else if (taperDepth <= tw - 1) {
      // Mid taper / pre-race sharpener — short reps to stay sharp
      const sharpReps = isShortRace || goal_race === 'half' ? '4 × 200m' : '4 × 100m'
      const sharpPace = isShortRace ? zones?.interval : zones?.rep
      quality1 = {
        type: 'strides',
        label: 'Pre-race sharpener',
        description: sharpPace
          ? `${Math.round(easyKm * 0.6)} km easy warm-up. ${sharpReps} @ ${sharpPace}/km, full walk recovery. 1 km easy cool-down. Stay sharp, stay fresh.`
          : `${Math.round(easyKm * 0.6)} km easy warm-up. ${sharpReps} at quick controlled effort, full walk recovery. 1 km easy cool-down.`,
        structure: `${sharpReps}, walk recovery`,
        target_pace: sharpPace,
        notes: 'Pre-race sharpener. The purpose is to wake the legs up and maintain neuromuscular readiness — not to train. Keep it short, keep it sharp, leave feeling good.',
      }
    } else {
      // Race week — minimal
      quality1 = {
        type: 'strides',
        label: 'Race week — 4 strides only',
        description: zones?.rep
          ? `${Math.round(easyKm * 0.5)} km easy jog, 4 × 20s strides @ ${zones.rep}/km with full walk recovery. Nothing more.`
          : `${Math.round(easyKm * 0.5)} km easy jog, 4 × 20s strides, full walk recovery. Done.`,
        structure: `4 × 20s strides`,
        notes: 'Race week. The work is done. These strides are to keep the legs awake, not to build fitness. Don\'t add to this session.',
      }
    }
  } else if (isShortRace) {
    // 4-slot rotation: neuromuscular → intervals → speed endurance → threshold/recovery
    if (isRecoverySlot) {
      // Active recovery slot — lighter quality week, not full rest
      quality1 = {
        type: 'strides',
        label: 'Easy + strides — recovery week',
        description: zones?.easy
          ? `${easyKm + 1} km easy @ ${zones.easy}/km with 6 × 20s strides. Nothing more.`
          : `${easyKm + 1} km easy with 6 × 20s strides. Recovery week.`,
        structure: `${easyKm + 1} km easy + 6 × 20s strides`,
        notes: 'Recovery week. The body adapts during rest, not during training. Protect this week.',
      }
    } else if (slot === 0) {
      // Neuromuscular — builds 10 → 12 → 14 reps across iterations
      const reps = 10 + iter * 2
      quality1 = {
        type: 'neuromuscular',
        label: 'Speed session — short reps',
        description: zones?.rep
          ? `3 km easy warm-up. ${reps} × 200m @ ${zones.rep}/km, 100m walk recovery — do not stand still. 1 km cool-down.`
          : `3 km easy warm-up. ${reps} × 200m at controlled sprint effort, 100m walk recovery. 1 km cool-down.`,
        structure: `${reps} × 200m, 100m walk recovery`,
        target_pace: zones?.rep,
        notes: 'These are NOT all-out sprints. Think 95% effort, smooth mechanics. Walk recovery is deliberate — develops lactate clearance. Short reps build the neuromuscular efficiency that makes race pace feel easier.',
      }
    } else if (slot === 1) {
      // 400m reps — builds 8 → 10 → 12 → 14 reps
      const reps400 = 8 + iter * 2
      const repStr = isPeak ? `${reps400 + 2}–${reps400 + 4}` : `${reps400}`
      quality1 = {
        type: 'intervals',
        label: '400m repetitions',
        description: zones?.interval
          ? `3 km easy warm-up. ${repStr} × 400m @ ${zones.interval}/km, 100m jog recovery — keep moving. 1 km cool-down.`
          : `3 km easy warm-up. ${repStr} × 400m at 5k race effort, 100m jog recovery. 1 km cool-down.`,
        structure: `${repStr} × 400m @ 5k pace, 100m jog`,
        target_pace: zones?.interval,
        notes: 'Recovery jog — not walk, not standstill. Keeping moving between reps develops lactate clearance. Hit each rep consistently, not faster early then dying late.',
      }
    } else {
      // Slot 2: speed endurance — 600-800m builds 5 → 6 → 8 reps
      const reps600 = 5 + iter
      const dist = goal_race === '10k' ? '800m' : '600m'
      const repPace = zones?.interval ? secsToMMSS(paceToSecs(zones.interval) + (dist === '800m' ? 8 : 5)) : null
      quality1 = {
        type: 'intervals',
        label: `Speed endurance — ${dist}s`,
        description: repPace
          ? `3 km easy warm-up. ${reps600} × ${dist} @ ${repPace}/km, 200m jog recovery. 1 km cool-down.`
          : `3 km warm-up. ${reps600} × ${dist} at slightly slower than 5k effort, 200m jog. 1 km cool-down.`,
        structure: `${reps600} × ${dist}, 200m jog`,
        notes: 'Speed endurance. Controlled through the first half, genuinely hard by the last two reps. Consistent pace is the goal — not fast early, dying late.',
      }
    }
  } else if (isHyrox) {
    // Hyrox: 8 × 1km runs + functional work — train the running component with functional intervals
    const weekMod = (week % 3)
    if (weekMod === 0) {
      quality1 = {
        type: 'intervals',
        label: 'Hyrox run intervals — 1km reps',
        description: zones?.interval
          ? `2 km easy warm-up. 6–8 × 1km @ ${zones.interval}/km, 90s jog recovery. 1 km cool-down. Simulate race effort on the run legs.`
          : `2 km warm-up. 6–8 × 1km at hard aerobic effort, 90s jog. 1 km cool-down.`,
        structure: `6–8 × 1km, 90s jog`,
        target_pace: zones?.interval,
        notes: 'Hyrox run legs are 1km each. These reps build the specific endurance to run hard immediately after functional work. Keep the jog recovery moving — Hyrox doesn\'t give you stand-still rest.',
      }
    } else if (weekMod === 1) {
      quality1 = {
        type: 'threshold',
        label: 'Hyrox threshold run',
        description: zones?.threshold
          ? `2 km warm-up. 3 × 8min @ ${zones.threshold}/km, 90s jog. 1 km cool-down. Race-effort sustained running.`
          : `2 km warm-up. 3 × 8min at threshold effort, 90s jog. 1 km cool-down.`,
        structure: `3 × 8min threshold, 90s jog`,
        target_pace: zones?.threshold,
        notes: 'Threshold pace for Hyrox is the pace you\'d sustain across all 8 run legs. Controlled, hard, repeatable.',
      }
    } else {
      quality1 = {
        type: 'intervals',
        label: 'Run-fatigue intervals',
        description: zones?.interval
          ? `2 km warm-up. 5 × [1km @ ${zones.interval}/km + 2min functional work (burpees / wall balls / sled push mimicry) + 90s jog]. 1 km cool-down.`
          : `2 km warm-up. 5 × [1km hard + 2min functional work + 90s jog]. 1 km cool-down.`,
        structure: `5 × (1km + 2min functional), 90s jog`,
        notes: 'Train running under fatigue. The functional block simulates the transition from a Hyrox station back into the run. The ability to clear lactate and find pace quickly is the key Hyrox skill.',
      }
    }
  } else {
    // Long race training (HM / marathon) — 3-slot rotation with progression
    const longSlot = (phaseWeek - 1) % 3
    const longIter = Math.floor((phaseWeek - 1) / 3)

    if (!isBuild && !isPeak) {
      // Base/recovery: simple strides session
      quality1 = stridesSession
    } else if (longSlot === 0) {
      // Continuous tempo — builds 4 → 5 → 6 → 7 km
      const tempoKm = Math.min(4 + longIter + (isPeak ? 1 : 0), 7)
      quality1 = {
        type: 'tempo',
        label: 'Continuous tempo',
        description: zones?.tempo
          ? `2 km easy warm-up. ${tempoKm} km continuous @ ${zones.tempo}/km — comfortably hard. 1 km easy cool-down.`
          : `2 km warm-up. ${tempoKm} km at comfortably hard effort — you could answer a question but wouldn't want to. 1 km cool-down.`,
        structure: `${tempoKm} km tempo`,
        target_pace: zones?.tempo,
        notes: 'Tempo pace is sustainable for 45–60 min but requires concentration. Don\'t drift faster — the purpose is time at threshold, not heroics.',
      }
    } else if (longSlot === 1) {
      // Broken tempo / threshold reps — builds from 3×8min to 3×12min
      const repMin = 8 + longIter * 2
      const repKm = goal_race === 'half' ? '1.5km' : '2km'
      const repCount = 3 + longIter
      quality1 = {
        type: 'threshold',
        label: 'Threshold reps',
        description: zones?.threshold
          ? `2 km easy warm-up. ${repCount} × ${repKm} @ ${zones.threshold}/km, 90s jog recovery. 1 km cool-down.`
          : `2 km warm-up. ${repCount} × ${repKm} at threshold effort, 90s jog. 1 km cool-down.`,
        structure: `${repCount} × ${repKm}, 90s jog`,
        target_pace: zones?.threshold,
        notes: `Broken tempo — easier to hold pace in rep form on a mid-week day. 90s jog recovery only, not standing rest. ${repMin} min total quality work.`,
      }
    } else {
      // Cruise intervals / marathon pace work
      const mpReps = 3 + longIter
      if (goal_race === 'marathon' || goal_race === 'ultra') {
        quality1 = {
          type: 'race_sim',
          label: 'Marathon pace reps',
          description: zones?.marathon
            ? `2 km easy warm-up. ${mpReps} × 2km @ ${zones.marathon}/km, 90s jog. 1 km cool-down. Race pace — own it.`
            : `2 km warm-up. ${mpReps} × 2km at goal marathon pace, 90s jog. 1 km cool-down.`,
          structure: `${mpReps} × 2km @ marathon pace, 90s jog`,
          target_pace: zones?.marathon,
          notes: 'Marathon pace work. This should feel controlled and purposeful — not easy, not hard. The goal is to internalise race pace so it feels natural on race day.',
        }
      } else {
        // Half marathon: faster pace reps
        quality1 = {
          type: 'intervals',
          label: 'Half marathon pace intervals',
          description: zones?.interval
            ? `2 km easy warm-up. ${mpReps} × 1km @ ${zones.interval}/km, 60s jog. 1 km cool-down.`
            : `2 km warm-up. ${mpReps} × 1km at half marathon pace, 60s jog. 1 km cool-down.`,
          structure: `${mpReps} × 1km @ HM pace, 60s jog`,
          target_pace: zones?.interval,
          notes: 'Race-specific pace. Should feel like a strong but controlled effort — not threshold, not all-out.',
        }
      }
    }
  }

  // Quality session 2 (tier 3+, build/peak, 4+ days/week) — rotates for stimulus variety
  let quality2: RunSession | null = null

  if (!isBase && !isTaper && days_per_week >= 4 && !isRecoverySlot) {
    if (training_approach === 'norwegian' && tier >= 3) {
      // Norwegian: double threshold — vary rep count across phaseWeek
      const dtReps = 5 + Math.min(iter, 2)
      quality2 = {
        type: 'double_threshold',
        label: 'Sub-threshold intervals',
        description: zones?.threshold
          ? `3 km easy warm-up. ${dtReps} × 5min @ ${secsToMMSS(paceToSecs(zones.threshold) + 12)}/km (10–15s/km SLOWER than threshold — stay aerobic), 90s jog between. This is LT1, not LT2. 2 km cool-down.`
          : `3 km warm-up. ${dtReps} × 5min at sub-threshold effort — aerobic but purposeful. 90s jog. 2 km cool-down.`,
        structure: `${dtReps} × 5min @ LT1 pace, 90s jog`,
        notes: 'Norwegian method: the key is staying below LT2. If your HR is spiking, you\'re going too hard. This should feel controlled throughout.',
      }
    } else if (training_approach === 'hybrid' && tier >= 3) {
      // Hybrid: alternate sub-threshold and strides sessions
      const hybridSlot = (phaseWeek - 1) % 2
      if (hybridSlot === 0) {
        quality2 = {
          type: 'double_threshold',
          label: 'Sub-threshold + strides',
          description: zones?.threshold
            ? `2 km easy warm-up. 4 × 6min @ ${secsToMMSS(paceToSecs(zones.threshold) + 10)}/km, 90s jog between. 6 × 20s strides${zones.rep ? ` @ ${zones.rep}/km` : ''} after. 1 km cool-down.`
            : `2 km warm-up. 4 × 6min at sub-threshold effort, 90s jog. 6 × 20s strides. 1 km cool-down.`,
          structure: `4 × 6min sub-threshold, 6 × strides`,
          notes: 'Aerobic volume at the top of zone 2 plus neuromuscular activation. The combination develops aerobic capacity and leg speed without the recovery cost of a full threshold session.',
        }
      } else {
        quality2 = {
          type: 'hill_reps',
          label: 'Hill reps',
          description: `2 km easy warm-up. 8–10 × 45s hard hill effort, walk back recovery. 1 km easy cool-down.`,
          structure: `8–10 × 45s hill, walk recovery`,
          notes: 'Hill reps build specific strength and power with lower injury risk than flat sprinting. Walk back — full recovery is the point.',
        }
      }
    } else {
      // Standard approach — 3-way rotation: VO2max / hill reps / broken tempo
      const q2Slot = (phaseWeek - 1) % 3
      if (q2Slot === 0) {
        // VO2max intervals — builds 4 → 5 → 6 reps
        const vo2Reps = 4 + Math.min(iter, 2)
        quality2 = {
          type: 'vo2max',
          label: 'VO\u2082max intervals',
          description: zones?.interval
            ? `3 km easy warm-up. ${vo2Reps} × 3min @ ${zones.interval}/km, 3min jog recovery. 2 km cool-down.`
            : `3 km warm-up. ${vo2Reps} × 3min at hard effort (8.5/10), 3min jog recovery. 2 km cool-down.`,
          structure: `${vo2Reps} × 3min, 3min jog`,
          target_pace: zones?.interval,
          notes: 'VO\u2082max work. You should feel close to maximal by the end of each rep. Full jog recovery — this is not lactate tolerance training, it\'s pure VO\u2082max stimulus.',
        }
      } else if (q2Slot === 1) {
        // Hill reps — specific strength, different stimulus from track work
        const hillReps = 6 + iter * 2
        quality2 = {
          type: 'hill_reps',
          label: 'Hill reps',
          description: `2 km easy warm-up. ${hillReps} × 45s hard hill effort, walk back recovery. 1 km cool-down.`,
          structure: `${hillReps} × 45s hill, walk recovery`,
          notes: 'Hill reps build specific strength and power with lower injury risk than flat sprinting. Walk back every time — full recovery is the point, not fitness.',
        }
      } else {
        // Broken tempo / mid-week threshold — third different stimulus
        const btReps = isShortRace ? 3 : 4
        const btDist = isShortRace ? '1km' : '1.5km'
        quality2 = {
          type: 'threshold',
          label: 'Mid-week threshold reps',
          description: zones?.threshold
            ? `2 km easy, ${btReps} × ${btDist} @ ${zones.threshold}/km, 90s jog between, 1 km cool-down.`
            : `2 km easy, ${btReps} × ${btDist} at threshold effort, 90s jog, 1 km cool-down.`,
          structure: `${btReps} × ${btDist} threshold, 90s jog`,
          target_pace: zones?.threshold,
          notes: 'Broken threshold — keeps the session manageable mid-week. Short recoveries by design.',
        }
      }
    }
  }

  // Club night integration — replace quality1 with a properly capped club session
  if (club_night && tier >= 3) {
    const clubSession: RunSession = isBase
      ? {
          type: 'easy',
          label: 'Club night — easy + strides',
          description: zones?.easy
            ? `2 km warm-up. 5 km easy @ ${zones.easy}/km with club. 4 × 20s strides at the end. 1 km cool-down.`
            : `2 km warm-up. 5 km easy with club. 4 × 20s strides at the end. 1 km cool-down.`,
          structure: `5 km easy + strides`,
          is_club_session: true,
          club_alternative: `Solo alternative: ${easyKm + 1} km easy with 6 × 20s strides.`,
          notes: 'Base phase — use club night for the easy run. Strides at the end activate the fast-twitch fibres.',
        }
      : isTaper
      ? {
          type: 'strides',
          label: 'Club night — sharpener only',
          description: zones?.rep
            ? `2 km easy warm-up. 4 × 100m @ ${zones.rep}/km with full walk recovery. 2 km easy. Race week — nothing taxing.`
            : `2 km warm-up. 4 × 100m at controlled fast effort, full walk recovery. 2 km easy.`,
          structure: `4 × 100m, walk recovery`,
          is_club_session: true,
          club_alternative: `Solo: 3 km easy jog + 4 × 20s strides. Do not race the club session this week.`,
          notes: 'Race week. Use the club environment for motivation, not exertion. If the club is doing a hard session, leave early or run easy alongside.',
        }
      : isShortRace
      ? {
          type: 'intervals',
          label: 'Club night — track session',
          description: zones?.interval
            ? `2 km warm-up. Club track session or: 8 × 400m @ ${zones.interval}/km, 100m jog recovery. 1 km cool-down. Total ~6–7 km.`
            : `2 km warm-up. Club track session or: 8 × 400m at 5k effort, 100m jog. 1 km cool-down.`,
          structure: `8 × 400m or club track session`,
          target_pace: zones?.interval,
          is_club_session: true,
          club_alternative: zones?.interval
            ? `Solo: 2 km warm-up, 8 × 400m @ ${zones.interval}/km, 100m jog, 1 km cool-down.`
            : `Solo: 2 km warm-up, 8 × 400m at 5k pace, 100m jog, 1 km cool-down.`,
          notes: 'Club track session. If the club session suits your phase (short reps, 5k–10k pace), do it. If it\'s a long tempo or road session that doesn\'t suit, use the alternative.',
        }
      : {
          type: 'threshold',
          label: 'Club night — threshold session',
          description: zones?.threshold
            ? `2 km warm-up. Club session or: 3 × 2km @ ${zones.threshold}/km, 2 min jog between. 1 km cool-down. Total ~9 km.`
            : `2 km warm-up. Club session or: 3 × 2km at threshold effort, 2 min jog. 1 km cool-down.`,
          structure: `3 × 2km threshold or club session`,
          target_pace: zones?.threshold,
          is_club_session: true,
          club_alternative: zones?.threshold
            ? `Solo: 2 km warm-up, 3 × 2km @ ${zones.threshold}/km, 2 min jog, 1 km cool-down.`
            : `Solo: 2 km warm-up, 3 × 2km at threshold, 2 min jog, 1 km cool-down.`,
          notes: 'Club night replaces the main quality session. Total volume capped at ~9 km. If the club is running longer, run your own session or leave at the cool-down.',
        }

    quality1 = clubSession
  }

  sessions.push(quality1)
  if (quality2) sessions.push(quality2)
  // Day 3: strides only in build/peak — base and taper get easy run to avoid duplicate strides
  if (days_per_week >= 3) sessions.push((!isBase && !isTaper) && days_per_week >= 4 ? stridesSession : easyRun)
  if (days_per_week >= 4) sessions.push(easyRun)
  if (days_per_week >= 5) sessions.push({ ...easyRun, label: 'Recovery run', description: `${Math.round(easyKm * 0.6)} km very easy recovery run. HR stays low.` })
  if (days_per_week >= 6) sessions.push({ ...easyRun, label: 'Easy run 2', description: `${Math.round(easyKm * 0.85)} km easy${zones?.easy ? ` @ ${zones.easy}/km` : ''}. Second easy day to add aerobic volume without stress.` })
  if (days_per_week >= 7) sessions.push({
    type: 'recovery' as const,
    label: 'Active recovery',
    description: `${Math.round(easyKm * 0.5)} km very easy jog or 30–40 min walk. Pure recovery — keep HR under 65% max throughout.`,
    target_km: Math.round(easyKm * 0.5),
    notes: 'The seventh day is recovery, not training. If legs feel heavy, walk instead.',
  })

  // ── Cross-training injections ──────────────────────────────────────────────
  if (include_strength) {
    const strengthNote = isTaper
      ? 'Taper week — keep it short, bodyweight only. No heavy loading.'
      : isBase
      ? 'Focus on movement quality. Hip hinge, single-leg stability, posterior chain. No grinding.'
      : 'Running-specific strength. Single-leg work, hip stability, glutes. Not a gym PR session.'
    sessions.push({
      type: 'strength',
      label: isTaper ? 'Bodyweight strength' : tier <= 2 ? 'Running strength' : 'Strength & conditioning',
      description: isTaper
        ? 'Bodyweight circuit: glute bridges × 20, single-leg deadlift × 12 each, calf raises × 30, banded clams × 20. 2 sets.'
        : tier <= 2
        ? 'Running strength circuit (30–40 min): glute bridges, split squats, hip hinge, lateral band work, single-leg calf raises. 3 × 12.'
        : 'S&C session (45 min): Romanian deadlift, Bulgarian split squat, hip thrust, lateral band walk, Nordic hamstring curl, plank progressions.',
      duration_min: isTaper ? 25 : tier <= 2 ? 35 : 45,
      notes: strengthNote,
    })
    if (tier >= 3 && !isTaper) {
      sessions.push({
        type: 'strength',
        label: 'Upper body & core',
        description: 'Upper body and core session (30 min): press, row, dead hang, pallof press, Copenhagen plank, anti-rotation holds.',
        duration_min: 30,
        notes: 'Upper body work supports posture in the late stages of long races. Keep it purposeful.',
      })
    }
  }

  if (include_mobility) {
    sessions.push({
      type: 'mobility',
      label: isTaper ? 'Pre-race mobility' : 'Mobility & recovery',
      description: isTaper
        ? 'Pre-race mobility (20 min): hip circles, dynamic lunge flow, leg swings, thoracic rotations, calf & achilles work. Keep it light and flowing.'
        : 'Mobility session (30–40 min): hip flexor release, pigeon pose, thoracic rotation, hamstring flow, ankle mobility, foam roll quads and ITB.',
      duration_min: isTaper ? 20 : 35,
      notes: 'Not a warm-up, not a workout. This is maintenance. Move slowly and breathe.',
    })
  }

  return sessions
}

// ─── KM PROGRESSION ───────────────────────────────────────────────────────────

function weeklyKmProgression(input: RunPlanInput, totalWeeks: number): number[] {
  const base = input.weekly_km ?? (input.tier === 1 ? 8 : input.tier === 2 ? 20 : input.tier === 3 ? 35 : 50)
  const peakMultiplier: Record<GoalRace, number> = {
    weekly5k: 1.3, '5k': 1.4, '10k': 1.5, half: 1.7, marathon: 2.0, ultra: 2.2, hyrox: 1.4, fitness: 1.3
  }
  const peak = Math.round(base * (peakMultiplier[input.goal_race] ?? 1.4))

  const tw = taperWeeks(input.goal_race)
  // Indexed by weeksFromEnd (0 = race week → lowest volume)
  // 3-week marathon: race wk=35%, mid=55%, first taper wk=75%
  const taperFractions: number[][] = [
    [0.35],              // 1-week taper: race wk
    [0.38, 0.60],        // 2-week taper: race wk, wk before
    [0.35, 0.55, 0.75],  // 3-week taper: race wk, mid, first taper wk
  ]
  const fractions = taperFractions[tw - 1]

  return Array.from({ length: totalWeeks }, (_, i) => {
    const w = i + 1
    const pct = w / totalWeeks
    // Taper weeks — stepped reduction
    const weeksFromEnd = totalWeeks - w  // 0 = race week, 1 = week before, etc.
    if (weeksFromEnd < tw) {
      return Math.round(peak * fractions[Math.min(weeksFromEnd, fractions.length - 1)])
    }
    // Recovery weeks every 4th week during build
    if (w % 4 === 0 && pct < 0.75) return Math.round(base + (peak - base) * (pct - 0.08))
    return Math.round(base + (peak - base) * Math.min(pct * 1.2, 0.95))
  })
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateRunPlan(input: RunPlanInput): RunPlanTemplate {
  // Derive zones
  let vdot: number | undefined
  let zones: TrainingZones | undefined

  if (input.lt_pace && paceToSecs(input.lt_pace) > 0) {
    zones = calcZonesFromLTPace(input.lt_pace)
  } else if (input.recent_race_time && input.recent_race_distance) {
    const km = raceDistanceToMeters(input.recent_race_distance) / 1000
    const mins = raceTimeToMinutes(input.recent_race_time)
    vdot = calcVDOT(km, mins)
    zones = calcZonesFromVDOT(vdot)
  }

  // Adjust for elevation
  if (zones && input.elevation_profile !== 'flat') {
    const adj = elevationPaceAdjustment(input.elevation_profile)
    zones = {
      easy:      secsToMMSS(paceToSecs(zones.easy) + adj),
      marathon:  secsToMMSS(paceToSecs(zones.marathon) + adj),
      tempo:     secsToMMSS(paceToSecs(zones.tempo) + adj),
      threshold: secsToMMSS(paceToSecs(zones.threshold) + adj),
      interval:  secsToMMSS(paceToSecs(zones.interval) + Math.round(adj * 0.5)),
      rep:       secsToMMSS(paceToSecs(zones.rep) + Math.round(adj * 0.3)),
    }
  }

  const totalWeeks = getPlanWeeks(input.goal_race, input.race_date, input.starts_on, input.plan_weeks)
  const kmByWeek   = weeklyKmProgression(input, totalWeeks)

  const RACE_LABELS: Record<GoalRace, string> = {
    weekly5k: 'weekly 5k', '5k': '5k', '10k': '10k', half: 'half marathon',
    marathon: 'marathon', ultra: 'ultra', hyrox: 'Hyrox', fitness: 'fitness'
  }

  const TIER_NAMES: Record<RunTier, string> = {
    1: 'start', 2: 'build', 3: 'club', 4: 'performance'
  }

  const name = input.name || `${RACE_LABELS[input.goal_race]} · ${TIER_NAMES[input.tier]}`

  const weeks: RunWeek[] = Array.from({ length: totalWeeks }, (_, i) => {
    const w = i + 1
    const phase = getPhase(w, totalWeeks, input.goal_race)
    const weekKm = kmByWeek[i]
    const phaseWeek = getPhaseWeek(w, totalWeeks, input.goal_race)
    const sessions = buildWeekSessions(input, w, phase, zones, weekKm, totalWeeks, phaseWeek)
    return {
      week_number: w,
      phase,
      phase_note: PHASE_NOTES[phase],
      total_km: weekKm,
      sessions,
    }
  })

  return {
    name,
    tier: input.tier,
    goal_race: input.goal_race,
    vdot,
    training_zones: zones,
    plan_weeks: totalWeeks,
    weeks,
  }
}
