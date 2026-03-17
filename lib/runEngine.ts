// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RunTier = 1 | 2 | 3 | 4
export type GoalRace = 'parkrun' | '5k' | '10k' | 'half' | 'marathon' | 'ultra' | 'fitness'
export type ElevationProfile = 'flat' | 'undulating' | 'hilly' | 'mountain'
export type TrainingApproach = 'standard' | 'norwegian'
export type RunPhase = 'base' | 'build' | 'peak' | 'taper' | 'recovery'
export type SessionType = 'easy' | 'tempo' | 'threshold' | 'intervals' | 'long' | 'recovery' | 'strides' | 'hill_reps' | 'race_sim' | 'double_threshold' | 'vo2max' | 'neuromuscular' | 'walk_run' | 'rest'

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
  available_days:      string[]
  club_night?:         string
  club_session_type?:  string
  gym_access:          boolean
  include_strength:    boolean
  include_mobility:    boolean
  training_approach:   TrainingApproach
  starts_on:           string
  name?:               string
}

// ─── PACE UTILITIES ───────────────────────────────────────────────────────────

function paceToSecs(pace: string): number {
  const parts = pace.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return parts[0] * 60 + (parts[1] ?? 0)
}

function secsToMMSS(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
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
    'parkrun': 5000, '5k': 5000, '10k': 10000,
    'half': 21097, 'marathon': 42195, 'ultra': 50000
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

function getPlanWeeks(goalRace: GoalRace, raceDateStr?: string, startsOn?: string): number {
  if (raceDateStr && startsOn) {
    const weeks = Math.floor((new Date(raceDateStr).getTime() - new Date(startsOn).getTime()) / (7 * 24 * 3600 * 1000))
    return Math.min(Math.max(weeks, 4), 20)
  }
  const defaults: Record<GoalRace, number> = {
    parkrun: 6, '5k': 8, '10k': 10, half: 12, marathon: 16, ultra: 18, fitness: 8
  }
  return defaults[goalRace]
}

function getPhase(week: number, total: number, goalRace: GoalRace): RunPhase {
  const pct = week / total
  if (goalRace === 'fitness') return week <= total * 0.5 ? 'base' : 'build'
  if (total <= 6) {
    if (week === total) return 'taper'
    return pct <= 0.5 ? 'base' : 'build'
  }
  if (week === total) return 'taper'
  if (week >= total - 1 && (goalRace === 'marathon' || goalRace === 'half' || goalRace === 'ultra')) return 'taper'
  if (pct <= 0.3) return 'base'
  if (pct <= 0.65) return 'build'
  return 'peak'
}

// ─── SESSION LIBRARY ──────────────────────────────────────────────────────────

// Returns paced session label suffix
function paceNote(pace: string): string {
  return pace ? ` @ ${pace}/km` : ''
}

// Build sessions for a week based on tier, phase, goal, and training preferences
function buildWeekSessions(
  input: RunPlanInput,
  week: number,
  phase: RunPhase,
  zones: TrainingZones | undefined,
  weeklyKm: number,
  totalWeeks: number,
): RunSession[] {
  const { tier, goal_race, days_per_week, club_night, training_approach } = input
  const sessions: RunSession[] = []
  const isTaper = phase === 'taper'
  const isPeak  = phase === 'peak'
  const isBuild = phase === 'build'
  const isBase  = phase === 'base'

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
    ? Math.round(weeklyKm * 0.28)
    : isPeak
    ? Math.round(weeklyKm * 0.38)
    : Math.round(weeklyKm * 0.33)

  const longRun: RunSession = {
    type: 'long',
    label: 'Long run',
    description: isTaper
      ? `${longKm} km easy — legs-only, relaxed, no effort. This is not the time to push.`
      : isPeak && (goal_race === 'marathon' || goal_race === 'half')
      ? `${longKm} km with final ${Math.round(longKm * 0.25)} km at ${zones?.marathon ?? 'goal race'}/km — progressive finish to practise running on tired legs`
      : `${longKm} km easy run${paceNote(zones?.easy ?? '')} — aerobic base building`,
    target_km: longKm,
    target_pace: zones?.easy,
    notes: isTaper ? 'Taper week — genuinely easy. Trust the fitness you\'ve built.' : 'Easy effort throughout. If running with others, you should be able to hold a conversation.',
  }
  sessions.push(longRun)

  // Recovery / easy days
  const easyKm = Math.round(weeklyKm * 0.15)
  const easyRun: RunSession = {
    type: 'easy',
    label: 'Easy run',
    description: `${easyKm} km easy${zones?.easy ? ` @ ${zones.easy}/km or slower` : ''}. Fully aerobic, minimal effort.`,
    target_km: easyKm,
    target_pace: zones?.easy,
    notes: 'If this feels hard, slow down. Easy means easy. No ego on these days.',
  }

  // Strides (tier 2+ on easy days)
  const stridesSession: RunSession = {
    type: 'strides',
    label: 'Easy + strides',
    description: `${easyKm} km easy${paceNote(zones?.easy ?? '')}, then 6–8 × 20s strides${zones?.rep ? ` @ ${zones.rep}/km` : ' at controlled sprint pace'} with 40s walk between. Total ~${easyKm + 1} km.`,
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
  const isShortRace = goal_race === 'parkrun' || goal_race === '5k' || goal_race === '10k'
  const isLongRace  = goal_race === 'marathon' || goal_race === 'ultra'

  // Quality session 1 — the main track/interval session
  let quality1: RunSession

  if (isBase) {
    // Strides and easy during base
    quality1 = stridesSession
  } else if (isTaper) {
    quality1 = {
      type: 'strides',
      label: 'Sharpener + strides',
      description: `${Math.round(easyKm * 0.8)} km easy, 4 × 20s strides${zones?.rep ? ` @ ${zones.rep}/km` : ''}, 3 min easy cool-down. Keep it short, keep it sharp.`,
      target_km: Math.round(easyKm * 0.9),
      notes: 'Race week. This session is to stay sharp, not to build fitness. Do not push anything hard.',
    }
  } else if (isShortRace) {
    // 5k/10k training — the interesting stuff
    // Vary the rep distance across the plan using week number
    const weekMod = (week % 4)
    if (weekMod === 0 || isBase) {
      // Neuromuscular short reps (the missing ingredient)
      quality1 = {
        type: 'neuromuscular',
        label: 'Speed session — short reps',
        description: zones?.rep
          ? `3 km easy warm-up. 10–14 × 200m @ ${zones.rep}/km, 100m walk recovery — do not stand still. 1 km cool-down.`
          : `3 km easy warm-up. 10–14 × 200m at controlled sprint effort, 100m walk recovery. 1 km cool-down.`,
        structure: `10–14 × 200m, 100m walk recovery`,
        target_pace: zones?.rep,
        target_km: 4 + 10 * 0.3,
        notes: 'These are NOT all-out sprints. Think 95% effort, smooth mechanics. The walk recovery is important — do not stand still or skip it. Short reps develop neuromuscular efficiency and top-end speed that translates directly to 5k performance.',
      }
    } else if (weekMod === 1) {
      // 400m reps — the classic
      const reps = isPeak ? '16–20' : isBuild ? '12–16' : '8–12'
      quality1 = {
        type: 'intervals',
        label: '400m repetitions',
        description: zones?.interval
          ? `3 km easy warm-up. ${reps} × 400m @ ${zones.interval}/km, 100m jog recovery (never stop — keep moving). ${reps === '16–20' ? 'Split into sets of 4 if needed, 90s between sets.' : ''} 1 km cool-down.`
          : `3 km easy warm-up. ${reps} × 400m at 5k race effort, 100m jog recovery. 1 km cool-down.`,
        structure: `${reps} × 400m @ 5k pace, 100m jog`,
        target_pace: zones?.interval,
        notes: 'Recovery jog — not walk, not standstill. Keeping moving between reps is deliberate: it develops lactate clearance. Hit each rep consistently, not faster early and dying late.',
      }
    } else if (weekMod === 2) {
      // 600m-800m speed endurance
      quality1 = {
        type: 'intervals',
        label: 'Speed endurance — 600s',
        description: zones?.interval
          ? `3 km easy warm-up. 8–10 × 600m @ ${secsToMMSS(paceToSecs(zones.interval) + 5)}/km — slightly slower than 5k pace, 200m jog recovery. 1 km cool-down.`
          : `3 km warm-up. 8–10 × 600m at 5k effort minus 5s/km, 200m jog recovery. 1 km cool-down.`,
        structure: `8–10 × 600m, 200m jog`,
        notes: 'Speed endurance. These should feel controlled through rep 1–4, genuinely challenging by rep 7. Consistent pace across all reps is the goal.',
      }
    } else {
      // Threshold reps for 10k/5k
      const reps5k = goal_race === '5k' ? '5 × 1km' : '4 × 1.5km'
      quality1 = {
        type: 'threshold',
        label: 'Threshold reps',
        description: zones?.threshold
          ? `3 km easy warm-up. ${reps5k} @ ${zones.threshold}/km, 90s jog recovery. 1 km cool-down.`
          : `3 km warm-up. ${reps5k} at threshold effort, 90s jog. 1 km cool-down.`,
        structure: `${reps5k}, 90s jog`,
        target_pace: zones?.threshold,
        notes: 'Threshold pace is "comfortably uncomfortable" — you could answer a question but wouldn\'t want to say much more. 90s jog recovery only, not standing rest.',
      }
    }
  } else {
    // Long race training (HM / marathon)
    quality1 = {
      type: 'tempo',
      label: 'Tempo run',
      description: zones?.tempo
        ? `${Math.round(weeklyKm * 0.12)} km easy warm-up, ${Math.round(weeklyKm * 0.18)} km continuous at ${zones.tempo}/km, ${Math.round(weeklyKm * 0.08)} km easy cool-down.`
        : `Warm-up 2 km, ${Math.round(weeklyKm * 0.2)} km at comfortably hard effort, 2 km cool-down.`,
      target_pace: zones?.tempo,
      target_km: Math.round(weeklyKm * 0.4),
      notes: 'Tempo pace is sustainable for 45–60 min but requires concentration. Don\'t drift faster — the purpose is time at threshold, not heroics.',
    }
  }

  // Quality session 2 (tier 3+, build/peak, 4+ days/week)
  let quality2: RunSession | null = null

  if (!isBase && !isTaper && days_per_week >= 4) {
    if (training_approach === 'norwegian' && tier >= 3) {
      // Double threshold
      quality2 = {
        type: 'double_threshold',
        label: 'Sub-threshold intervals',
        description: zones?.threshold
          ? `3 km easy warm-up. 5–7 × 5min @ ${secsToMMSS(paceToSecs(zones.threshold) + 12)}/km (10–15s/km SLOWER than threshold — stay aerobic), 90s jog between. This is LT1, not LT2. 2 km cool-down.`
          : `3 km warm-up. 5–7 × 5min at sub-threshold effort — aerobic but purposeful. 90s jog. 2 km cool-down.`,
        structure: `5–7 × 5min @ LT1 pace, 90s jog`,
        notes: 'Norwegian method: the key is staying below LT2. If your HR is spiking, you\'re going too hard. This should feel controlled throughout. High volume at sub-threshold builds the aerobic engine more safely than classic tempo work.',
      }
    } else if (isPeak && isShortRace) {
      quality2 = {
        type: 'vo2max',
        label: 'VO\u2082max intervals',
        description: zones?.interval
          ? `3 km easy warm-up. 5–6 × 3min @ ${zones.interval}/km, 3min jog recovery. 2 km cool-down.`
          : `3 km warm-up. 5–6 × 3min at hard effort (about 8.5/10), 3min jog recovery. 2 km cool-down.`,
        structure: `5–6 × 3min, 3min jog`,
        target_pace: zones?.interval,
        notes: 'VO\u2082max work. You should feel close to maximal by the end of each rep. Full jog recovery — this is not lactate tolerance training, it\'s pure VO\u2082max stimulus.',
      }
    } else if (!isShortRace && isPeak) {
      quality2 = {
        type: 'race_sim',
        label: 'Race simulation',
        description: zones?.marathon
          ? `5 km easy warm-up, then ${Math.round(weeklyKm * 0.2)} km at ${zones.marathon}/km — goal marathon pace. This is what race pace feels like on tired legs. 2 km easy cool-down.`
          : `5 km easy warm-up, ${Math.round(weeklyKm * 0.18)} km at goal race pace, 2 km cool-down.`,
        notes: 'This is the most race-specific session in the block. Mentally treat it as the race. Nutrition and hydration exactly as race day.',
      }
    } else {
      quality2 = {
        type: 'tempo',
        label: 'Mid-week tempo',
        description: zones?.tempo
          ? `2 km easy, 3 × 10min @ ${zones.tempo}/km, 2min jog between, 1 km cool-down.`
          : `2 km easy, 3 × 10min at comfortably hard effort, 2 min jog, 1 km cool-down.`,
        target_pace: zones?.tempo,
        notes: 'Broken tempo — easier to hit pace on a mid-week session. The recoveries are short by design.',
      }
    }
  }

  // Club night integration
  if (club_night && tier >= 3) {
    const altDesc = isBase
      ? `Club night alternative: ${easyKm + 1} km easy with 6 × 20s strides.`
      : isTaper
      ? `Club night — if the session is hard intervals, do this instead: 4 km easy + 4 × 20s strides. Race week, protect the legs.`
      : isShortRace
      ? `Club night alternative (if session doesn't suit): 3 km warm-up, 8 × 400m @ 5k pace, 100m jog, 1 km cool-down.`
      : `Club night alternative: 2 km warm-up, 5 × 1km @ threshold, 90s jog, 2 km cool-down.`

    quality1 = {
      ...quality1,
      label: `${quality1.label} · club night`,
      is_club_session: true,
      club_alternative: altDesc,
      notes: (quality1.notes ?? '') + ` · Club night: if the club session suits your phase, do that. If not (e.g. race week and they\'re doing mile reps), use the alternative below.`,
    }
  }

  sessions.push(quality1)
  if (quality2) sessions.push(quality2)
  if (days_per_week >= 3) sessions.push(days_per_week >= 4 ? stridesSession : easyRun)
  if (days_per_week >= 4) sessions.push(easyRun)
  if (days_per_week >= 5) sessions.push({ ...easyRun, label: 'Recovery run', description: `${Math.round(easyKm * 0.6)} km very easy recovery run. HR stays low.` })

  return sessions
}

// ─── KM PROGRESSION ───────────────────────────────────────────────────────────

function weeklyKmProgression(input: RunPlanInput, totalWeeks: number): number[] {
  const base = input.weekly_km ?? (input.tier === 1 ? 8 : input.tier === 2 ? 20 : input.tier === 3 ? 35 : 50)
  const peakMultiplier: Record<GoalRace, number> = {
    parkrun: 1.3, '5k': 1.4, '10k': 1.5, half: 1.7, marathon: 2.0, ultra: 2.2, fitness: 1.3
  }
  const peak = Math.round(base * (peakMultiplier[input.goal_race] ?? 1.4))

  return Array.from({ length: totalWeeks }, (_, i) => {
    const w = i + 1
    const pct = w / totalWeeks
    if (w === totalWeeks) return Math.round(base * 0.5) // taper week
    if (w >= totalWeeks - 1 && (input.goal_race === 'marathon' || input.goal_race === 'half' || input.goal_race === 'ultra')) return Math.round(base * 0.65)
    // Recovery weeks every 4th week
    if (w % 4 === 0 && pct < 0.75) return Math.round(base + (peak - base) * (pct - 0.08))
    return Math.round(base + (peak - base) * Math.min(pct * 1.2, 0.95))
  })
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateRunPlan(input: RunPlanInput): RunPlanTemplate {
  // Derive zones
  let vdot: number | undefined
  let zones: TrainingZones | undefined

  if (input.lt_pace) {
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

  const totalWeeks = getPlanWeeks(input.goal_race, input.race_date, input.starts_on)
  const kmByWeek   = weeklyKmProgression(input, totalWeeks)

  const RACE_LABELS: Record<GoalRace, string> = {
    parkrun: 'parkrun', '5k': '5k', '10k': '10k', half: 'half marathon',
    marathon: 'marathon', ultra: 'ultra', fitness: 'fitness'
  }

  const TIER_NAMES: Record<RunTier, string> = {
    1: 'start', 2: 'build', 3: 'club', 4: 'performance'
  }

  const name = input.name || `${RACE_LABELS[input.goal_race]} · ${TIER_NAMES[input.tier]}`

  const weeks: RunWeek[] = Array.from({ length: totalWeeks }, (_, i) => {
    const w = i + 1
    const phase = getPhase(w, totalWeeks, input.goal_race)
    const weekKm = kmByWeek[i]
    const sessions = buildWeekSessions(input, w, phase, zones, weekKm, totalWeeks)
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
