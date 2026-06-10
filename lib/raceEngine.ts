// concept//race — deterministic race plan engine
// Pure, side-effect-free. No AI calls. Every output traceable to an input.

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RaceDistance = '5k' | '10k' | 'half' | 'marathon'
export type SplitUnit = 'km' | 'mi'
export type FitnessSource = 'recent_race' | 'estimate'
export type ExperienceLevel = 'first_time' | 'done_before' | 'racing_often'
export type AgeBand = 'under35' | '35_44' | '45_54' | '55_plus'

export type Struggle =
  | 'starts_too_fast'
  | 'fades_late'
  | 'fuelling'
  | 'long_run_motivation'
  | 'recovery'
  | 'race_nerves'
  | 'pacing_blind'

export interface RaceInput {
  // The race
  distance: RaceDistance
  race_name?: string
  race_date: string            // ISO date
  // Fitness marker
  fitness_source: FitnessSource
  marker_distance: RaceDistance
  marker_time_s: number        // seconds
  // Goals
  goal_a_s: number             // seconds
  goal_b_s: number             // seconds
  // Context
  weeks_out: number
  runs_per_week: number
  experience: ExperienceLevel
  age_band: AgeBand
  longest_recent_km?: number   // marathon and half only
  // The honest bit
  struggles: Struggle[]
  // Fuelling intent
  fuelling_in_race: 'yes' | 'no' | 'not_sure'
  // Output preference
  split_unit: SplitUnit
  // Identity
  first_name: string
}

export interface SplitRow {
  marker: string               // '1', '2' ... or 'Finish'
  cumulative_dist: string      // '5.0 km'
  a_split: string              // 'MM:SS'
  a_cumulative: string         // 'H:MM:SS'
  b_split: string
  b_cumulative: string
  note?: string                // tactical note at key points
}

export interface RaceWeekDay {
  day_label: string            // 'Monday' relative to race day
  days_to_race: number
  run: string
  detail: string
  life: string                 // sleep, food, admin guidance
}

export interface TimelineItem {
  clock: string                // 'T minus 3:00' style offsets
  action: string
  detail: string
}

export interface WeaknessProtocol {
  struggle: Struggle
  title: string
  read: string                 // why this happens, one or two lines
  protocol: string[]           // the actual decisions, in advance
}

export interface FuelSection {
  applicable: boolean
  carb_target_g_per_hr?: number
  headline: string
  points: string[]
  fuel_tool_cta: boolean
}

export interface FeasibilityRead {
  verdict: 'on_target' | 'stretch' | 'ambitious' | 'conservative'
  predicted_time_s: number
  text: string
}

export interface RacePlan {
  meta: {
    first_name: string
    race_name: string
    race_date: string
    distance: RaceDistance
    distance_label: string
    goal_a: string
    goal_b: string
    generated_on: string
  }
  vdot: number
  feasibility: FeasibilityRead
  overview: string[]
  splits: SplitRow[]
  split_unit: SplitUnit
  pace_a_per_unit: string
  pace_b_per_unit: string
  race_week: RaceWeekDay[]
  race_day: TimelineItem[]
  fuelling: FuelSection
  protocols: WeaknessProtocol[]
  coach_note: string[]
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const DIST_KM: Record<RaceDistance, number> = {
  '5k': 5,
  '10k': 10,
  half: 21.0975,
  marathon: 42.195,
}

const DIST_LABEL: Record<RaceDistance, string> = {
  '5k': '5K',
  '10k': '10K',
  half: 'Half Marathon',
  marathon: 'Marathon',
}

const MI_PER_KM = 0.621371

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────

export function fmtTime(totalSeconds: number): string {
  const s = Math.round(totalSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function fmtPace(secondsPerUnit: number): string {
  const m = Math.floor(secondsPerUnit / 60)
  const s = Math.round(secondsPerUnit % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseTimeToSeconds(input: string): number | null {
  const parts = input.trim().split(':').map((p) => parseInt(p, 10))
  if (parts.some((p) => isNaN(p) || p < 0)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

// ─── VDOT (Daniels & Gilbert) ─────────────────────────────────────────────────

function vo2AtVelocity(vMetersPerMin: number): number {
  return -4.6 + 0.182258 * vMetersPerMin + 0.000104 * vMetersPerMin * vMetersPerMin
}

function pctVo2MaxAtDuration(tMinutes: number): number {
  return (
    0.8 +
    0.1894393 * Math.exp(-0.012778 * tMinutes) +
    0.2989558 * Math.exp(-0.1932605 * tMinutes)
  )
}

export function vdotFromPerformance(distanceKm: number, timeSeconds: number): number {
  const tMin = timeSeconds / 60
  const v = (distanceKm * 1000) / tMin
  return vo2AtVelocity(v) / pctVo2MaxAtDuration(tMin)
}

// Predict time for a distance at a given VDOT, by bisection on duration.
export function predictTime(distanceKm: number, vdot: number): number {
  let lo = (distanceKm * 1000) / 600   // 600 m/min, absurdly fast lower bound (minutes)
  let hi = (distanceKm * 1000) / 80    // 80 m/min, very slow upper bound (minutes)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const v = (distanceKm * 1000) / mid
    const impliedVdot = vo2AtVelocity(v) / pctVo2MaxAtDuration(mid)
    if (impliedVdot > vdot) lo = mid
    else hi = mid
  }
  return ((lo + hi) / 2) * 60 // seconds
}

// ─── FEASIBILITY ──────────────────────────────────────────────────────────────

function ageAdjustedVdot(vdot: number, age: AgeBand, source: FitnessSource): number {
  // The VDOT itself already reflects current fitness if it came from a recent race.
  // Estimates get a small haircut because self-reported effort paces run hot.
  let adjusted = vdot
  if (source === 'estimate') adjusted = vdot * 0.985
  return adjusted
}

function buildFeasibility(
  input: RaceInput,
  vdot: number
): FeasibilityRead {
  const targetKm = DIST_KM[input.distance]
  const predicted = predictTime(targetKm, vdot)
  const ratio = input.goal_a_s / predicted

  // Endurance penalty: a 5K marker does not guarantee marathon endurance.
  // If stepping up two or more distance classes with thin long run history, be honest.
  const order: RaceDistance[] = ['5k', '10k', 'half', 'marathon']
  const stepUp = order.indexOf(input.distance) - order.indexOf(input.marker_distance)
  const thinLongRuns =
    input.distance === 'marathon' &&
    (input.longest_recent_km === undefined || input.longest_recent_km < 26)

  let verdict: FeasibilityRead['verdict']
  let text: string
  const predStr = fmtTime(predicted)
  const goalStr = fmtTime(input.goal_a_s)

  if (ratio < 0.965) {
    verdict = 'ambitious'
    text = `Your current fitness marker points to roughly ${predStr} on a good day. ${goalStr} is a big ask from where you are now. It is not impossible over ${input.weeks_out} weeks, but the plan below treats your B goal as the primary race and your A goal as the reward if everything clicks. Race the B splits and upgrade at the point noted in the table, not before.`
  } else if (ratio < 0.995) {
    verdict = 'stretch'
    text = `Your fitness marker suggests roughly ${predStr}. ${goalStr} is a genuine stretch but inside reach with a clean block. The splits below are built to keep the A goal alive without burning the race in the first half. Hold the line early. The decision point is marked in the table.`
  } else if (ratio <= 1.04) {
    verdict = 'on_target'
    text = `Your fitness marker predicts roughly ${predStr}, which sits right on your A goal. This is a well-chosen target. The job now is not fitness, it is execution: even pacing, fuelling done properly, and not getting dragged out by the field in the first ${input.distance === '5k' ? 'kilometre' : 'few kilometres'}.`
  } else {
    verdict = 'conservative'
    text = `Your fitness marker predicts roughly ${predStr}, which is quicker than your A goal of ${goalStr}. You have more in the tank than you are asking for. The splits below are built to your stated goal, but the table marks where to make the call if you are travelling well. Do not change anything before that point.`
  }

  if (stepUp >= 2) {
    text += ` One honest caveat: your marker comes from a ${DIST_LABEL[input.marker_distance]}, which proves speed, not ${DIST_LABEL[input.distance].toLowerCase()} endurance. Treat the late-race sections of this plan as non-negotiable.`
  }
  if (thinLongRuns) {
    text += ` Your longest recent run is on the short side for the marathon. The last 10K will be decided by discipline in the first 30K, so the early splits matter more for you than for most.`
  }

  return { verdict, predicted_time_s: predicted, text }
}

// ─── PACING SHAPES ────────────────────────────────────────────────────────────
// Offsets in seconds per km applied to the flat average, per tenth of the race.
// Positive = slower than average. Each shape sums to ~zero so totals stay honest.

const SHAPES: Record<RaceDistance, number[]> = {
  // 5K: controlled opening, lock in, press from 60%, empty the tank.
  '5k': [3, 1, 0, 0, 0, -0.5, -1, -1, -1.5, 0],
  // 10K: patient first 2K, metronome middle, wind up final quarter.
  '10k': [3, 1.5, 0.5, 0, 0, 0, -0.5, -1, -1.5, -2],
  // Half: conservative 10%, settle, gentle press from 70%, strong close.
  half: [4, 2, 0.5, 0, 0, 0, -0.5, -1, -1.5, -3.5],
  // Marathon: deliberately slow opening 10%, even through 30K, controlled
  // press only if earned. The negative back end is small on purpose.
  marathon: [5, 2.5, 1, 0, 0, 0, 0, -1, -2.5, -5],
}

const DECISION_POINT: Record<RaceDistance, number> = {
  '5k': 6,      // tenth index where the upgrade call is made (60%)
  '10k': 7,
  half: 7,
  marathon: 8,  // 32K and a bit. Earn it first.
}

function buildSplits(input: RaceInput): {
  rows: SplitRow[]
  paceA: string
  paceB: string
} {
  const totalKm = DIST_KM[input.distance]
  const useMiles = input.split_unit === 'mi'
  const unitKm = useMiles ? 1 / MI_PER_KM : 1
  const totalUnits = totalKm / unitKm
  const fullUnits = Math.floor(totalUnits)
  const shape = SHAPES[input.distance]
  const decisionTenth = DECISION_POINT[input.distance]

  const avgA = input.goal_a_s / totalKm  // s per km
  const avgB = input.goal_b_s / totalKm

  // Per-display-unit segment lengths in km. Final segment may be partial.
  const segments: number[] = []
  for (let i = 0; i < fullUnits; i++) segments.push(unitKm)
  const remainderUnits = totalUnits - fullUnits
  if (remainderUnits > 0.005) segments.push(remainderUnits * unitKm)

  // Shape offset for a segment, sampled at its midpoint.
  function offsetFor(segStartKm: number, segLenKm: number): number {
    const frac = Math.min((segStartKm + segLenKm / 2) / totalKm, 0.999)
    return shape[Math.floor(frac * 10)]
  }

  // Build segment times for one goal, normalised so the total is exact.
  function buildSeries(avgPerKm: number, goalSeconds: number): number[] {
    const raw: number[] = []
    let startKm = 0
    for (const segLen of segments) {
      raw.push((avgPerKm + offsetFor(startKm, segLen)) * segLen)
      startKm += segLen
    }
    const sum = raw.reduce((a, b) => a + b, 0)
    const scale = goalSeconds / sum
    return raw.map((r) => r * scale)
  }

  const seriesA = buildSeries(avgA, input.goal_a_s)
  const seriesB = buildSeries(avgB, input.goal_b_s)

  const rows: SplitRow[] = []
  let cumA = 0
  let cumB = 0
  const unitLabel = useMiles ? 'mi' : 'km'
  let decisionPlaced = false
  let segStartKm = 0

  for (let i = 0; i < segments.length; i++) {
    cumA += seriesA[i]
    cumB += seriesB[i]
    const isLast = i === segments.length - 1
    const isPartial = isLast && remainderUnits > 0.005
    const distSoFar = isLast ? totalUnits : i + 1
    const tenth = Math.floor(
      Math.min((segStartKm + segments[i] / 2) / totalKm, 0.999) * 10
    )

    let note: string | undefined
    if (i === 0) note = 'Slower than feels right. That is the plan working.'
    if (!decisionPlaced && tenth >= decisionTenth && !isLast) {
      note = 'Decision point. Strong and on B splits? Move to A. Anything less, hold.'
      decisionPlaced = true
    }
    if (isLast) note = 'Everything you have left.'

    rows.push({
      marker: isLast ? 'Finish' : String(i + 1),
      cumulative_dist: `${isLast ? totalUnits.toFixed(1) : distSoFar} ${unitLabel}`,
      // For full units the segment time IS the split. For the final partial
      // segment, show the actual time for that stretch, which is what a
      // runner reads off their watch at the line.
      a_split: isPartial ? fmtTime(seriesA[i]) : fmtPace(seriesA[i]),
      a_cumulative: fmtTime(cumA),
      b_split: isPartial ? fmtTime(seriesB[i]) : fmtPace(seriesB[i]),
      b_cumulative: fmtTime(cumB),
      note,
    })
    segStartKm += segments[i]
  }

  const paceA = fmtPace(avgA * unitKm)
  const paceB = fmtPace(avgB * unitKm)
  return { rows, paceA, paceB }
}

// ─── RACE WEEK ────────────────────────────────────────────────────────────────

function buildRaceWeek(input: RaceInput): RaceWeekDay[] {
  const raceDate = new Date(input.race_date + 'T12:00:00')
  const dayName = (offset: number) => {
    const d = new Date(raceDate)
    d.setDate(d.getDate() - offset)
    return d.toLocaleDateString('en-GB', { weekday: 'long' })
  }

  const isLong = input.distance === 'half' || input.distance === 'marathon'
  const lowVolume = input.runs_per_week <= 3

  const days: RaceWeekDay[] = [
    {
      day_label: dayName(6),
      days_to_race: 6,
      run: isLong ? 'Final moderate run. 50 to 60 minutes easy with the last 10 at race effort.' : 'Normal easy run, 30 to 45 minutes.',
      detail: 'This is the last run that adds anything. Everything after today is about arriving fresh.',
      life: 'Normal eating. Start going to bed 30 minutes earlier than usual.',
    },
    {
      day_label: dayName(5),
      days_to_race: 5,
      run: lowVolume ? 'Rest.' : 'Easy 30 to 40 minutes. Nothing more.',
      detail: 'If your legs feel flat today, good. That is the volume leaving your body.',
      life: 'Sort your race logistics today: travel, parking, kit, number pickup. Not later.',
    },
    {
      day_label: dayName(4),
      days_to_race: 4,
      run: 'Rest or 20 minutes very easy.',
      detail: 'Doubting your fitness this week is normal. The work is done. You cannot add fitness now, only take freshness away.',
      life: 'Sleep is the priority. The two nights that matter most are tonight and tomorrow, not the night before the race.',
    },
    {
      day_label: dayName(3),
      days_to_race: 3,
      run: 'Easy 25 to 35 minutes with 4 strides at race pace.',
      detail: 'The strides are not training. They are a reminder to your legs of what race pace feels like.',
      life: isLong ? 'Begin shifting meals towards carbohydrate. Nothing exotic, just bigger portions of what you already eat.' : 'Eat normally. Hydrate properly through the day.',
    },
    {
      day_label: dayName(2),
      days_to_race: 2,
      run: 'Rest.',
      detail: 'Stay off your feet where you can. This is the most important sleep night of the week.',
      life: isLong ? 'Main carb day. Three proper meals, carbohydrate at each. Reduce fibre from this evening.' : 'Normal food, slightly more carbohydrate at dinner. Lay your kit out tonight.',
    },
    {
      day_label: dayName(1),
      days_to_race: 1,
      run: '15 to 20 minutes very easy with 3 short strides, or full rest. Your call, both are right.',
      detail: 'A short shakeout settles nerves for some people and wastes energy for others. You know which one you are.',
      life: 'Early dinner, familiar food, nothing new. Set two alarms. Do not look at the weather forecast more than once.',
    },
    {
      day_label: dayName(0),
      days_to_race: 0,
      run: 'Race day.',
      detail: 'The full timeline is below. Follow it and the morning runs itself.',
      life: 'Trust the plan you are holding.',
    },
  ]
  return days
}

// ─── RACE DAY TIMELINE ────────────────────────────────────────────────────────

function buildRaceDay(input: RaceInput): TimelineItem[] {
  const isLong = input.distance === 'half' || input.distance === 'marathon'
  const items: TimelineItem[] = [
    {
      clock: 'Gun minus 3:00',
      action: 'Wake up',
      detail: 'Even if the race is local and late morning, three hours gives your body time to be fully awake and fed. Glass of water first thing.',
    },
    {
      clock: 'Gun minus 2:45',
      action: 'Breakfast',
      detail: isLong
        ? 'Your practised pre-race breakfast, carbohydrate led, low fibre, low fat. Porridge, toast and jam, a banana. Whatever you have rehearsed on long run mornings. Nothing new today.'
        : 'Light and familiar. Toast and jam, a small bowl of porridge, or whatever you have eaten before hard sessions. You need less than you think for this distance.',
    },
    {
      clock: 'Gun minus 1:15',
      action: 'Arrive',
      detail: 'On site with time to spare. Find the toilets, find the bag drop, find the start pens. Queues eat 20 minutes on race morning.',
    },
    {
      clock: 'Gun minus 0:45',
      action: 'Final admin',
      detail: 'Bag dropped, kit decided, number pinned. ' + (isLong ? 'Gels where you can reach them without breaking stride.' : 'Nothing in your hands or pockets that you do not need.'),
    },
    {
      clock: 'Gun minus 0:30',
      action: 'Warm up',
      detail:
        input.distance === '5k' || input.distance === '10k'
          ? '10 to 12 minutes easy jogging, then drills if you use them, then 4 strides building to race pace. You should reach the line slightly warm and breathing lightly. Short races punish cold starts.'
          : '8 to 10 minutes of easy jogging at most, or brisk walking to the pen. The first 2K of the race is your warm up. Save everything.',
    },
    {
      clock: 'Gun minus 0:10',
      action: 'Into the pen',
      detail: 'Position yourself with runners at your B goal pace, not your A goal. Being passed early costs nothing. Passing people late is free speed for the mind.',
    },
    {
      clock: 'Gun minus 0:02',
      action: 'One thought',
      detail: `The first ${input.split_unit === 'mi' ? 'mile' : 'kilometre'} split on your plan. Say it to yourself. That number is the whole job for the next few minutes.`,
    },
  ]
  return items
}

// ─── FUELLING ─────────────────────────────────────────────────────────────────

function buildFuelling(input: RaceInput): FuelSection {
  const goalMinutes = input.goal_b_s / 60

  if (input.distance === '5k' || (input.distance === '10k' && goalMinutes < 50)) {
    return {
      applicable: false,
      headline: 'No in-race fuel needed',
      points: [
        'At this distance and duration, in-race carbohydrate does not improve performance. Your glycogen stores cover it comfortably.',
        'What matters: arrive properly hydrated, have eaten your normal breakfast, and consider a caffeine dose 45 to 60 minutes before the gun if you use it.',
        'A carbohydrate mouth rinse in the final third can give a small central nervous system lift if you want every edge, but it is marginal.',
      ],
      fuel_tool_cta: true,
    }
  }

  let target: number
  if (input.distance === '10k') target = 30
  else if (input.distance === 'half') target = goalMinutes > 105 ? 50 : 40
  else target = goalMinutes > 210 ? 75 : 65

  const points: string[] = []
  if (input.distance === 'marathon') {
    points.push(
      `Target ${target}g of carbohydrate per hour. That is roughly a gel every 20 to 25 minutes depending on your gel, starting at 20 minutes in. Do not wait until you feel you need one. By then it is too late.`
    )
    points.push(
      'Take your first gel earlier than feels necessary. The wall is not a fitness failure, it is a fuelling failure, and it is decided in the first half.'
    )
    points.push(
      'Practise the exact gels, exact timing, on at least two long runs before race day. Race morning is not a trial.'
    )
    points.push(
      'Water at every station from halfway even if just a mouthful. Sodium matters over this duration: if you are a heavy or salty sweater, electrolytes are not optional.'
    )
  } else if (input.distance === 'half') {
    points.push(
      `Target around ${target}g of carbohydrate per hour. For most runners that is 2 gels: one at 25 minutes, one at 55 to 60 minutes.`
    )
    points.push('Practise both in training at race effort. Your gut needs rehearsal as much as your legs.')
    points.push('Water to thirst. Full electrolyte protocols matter more in heat or for very salty sweaters.')
  } else {
    points.push(
      'One gel at 20 to 25 minutes is enough at this duration. Caffeine pre-race does more for a 10K than carbohydrate during it.'
    )
  }

  if (input.fuelling_in_race === 'no' || input.fuelling_in_race === 'not_sure') {
    points.unshift(
      'You said you are not currently fuelling in races, or not sure. For this distance that is the single biggest free improvement available to you. Read this section twice.'
    )
  }

  return {
    applicable: true,
    carb_target_g_per_hr: target,
    headline: `${target}g per hour`,
    points,
    fuel_tool_cta: true,
  }
}

// ─── WEAKNESS PROTOCOLS ───────────────────────────────────────────────────────

function buildProtocols(input: RaceInput): WeaknessProtocol[] {
  const unit = input.split_unit === 'mi' ? 'mile' : 'kilometre'
  const map: Record<Struggle, WeaknessProtocol> = {
    starts_too_fast: {
      struggle: 'starts_too_fast',
      title: 'Going out too hot',
      read: 'Race adrenaline makes goal pace feel slow for the first ten minutes. Every runner who blows up late made the mistake in the first ten minutes.',
      protocol: [
        `Your first ${unit} split is deliberately the slowest on the plan. Hitting it will feel like being held back. Hold the number anyway.`,
        'Pick a landmark around 10 minutes in. You are not allowed to assess how you feel until you pass it. Feelings before that point are adrenaline, not information.',
        'If your watch shows you ahead of plan in the opening section, ease off immediately. Banking time does not work. Banked seconds are paid back with heavy interest late on.',
      ],
    },
    fades_late: {
      struggle: 'fades_late',
      title: 'Fading in the final stretch',
      read: 'A late fade is almost always one of three things: too fast early, underfuelled, or a pacing plan with no late-race instructions. This plan addresses all three.',
      protocol: [
        'The decision point marked in your split table is the only place you make a tactical change. Before it, you are a metronome.',
        input.distance === 'marathon' || input.distance === 'half'
          ? 'Fuel on schedule even when you feel good. Feeling good at halfway with gels skipped is how the fade starts.'
          : 'When it gets hard late, shorten your focus: get to the next corner, the next runner ahead, the next minute. The finish is too big to think about. The next 200 metres is not.',
        'Pick one runner ahead in the final 15% and reel them in slowly. Then the next one. Hunting beats surviving, in pace and in mindset.',
      ],
    },
    fuelling: {
      struggle: 'fuelling',
      title: 'Getting fuelling right',
      read: 'You flagged fuelling as a weak point. The fuelling section of this plan is written for you specifically. The short version: earlier, more, and rehearsed.',
      protocol: [
        'Follow the gel timings in the fuelling section to the minute. Set your watch to buzz if it helps.',
        'Rehearse the full race fuelling plan on your remaining long runs. Same products, same timing, at race effort for at least part of the run.',
        'Build your precise schedule with the free fuel planner on this site. It will give you exact grams and timings for your goal time and your specific gels.',
      ],
    },
    long_run_motivation: {
      struggle: 'long_run_motivation',
      title: 'Long run motivation',
      read: 'Motivation is unreliable. Structure is not. The runners who get the long runs done are not more motivated, they have removed the decision.',
      protocol: [
        'Same day, same start time, every week between now and the race. The long run is an appointment, not an option.',
        'Decide the route the night before and lay kit out. Every decision left for the morning is a chance to bail.',
        'Make the first 3K a warm up with zero pace expectations. Most abandoned long runs die in the first 15 minutes. Get past them and the run usually completes itself.',
      ],
    },
    recovery: {
      struggle: 'recovery',
      title: 'Recovery between sessions',
      read: input.age_band === '45_54' || input.age_band === '55_plus'
        ? 'You flagged recovery, and at your age band this is signal, not weakness. Recovery windows genuinely lengthen. Plans written for 28 year olds ignore this. Yours does not.'
        : 'Recovery is where adaptation happens. Training hard with poor recovery is just accumulating fatigue with extra steps.',
      protocol: [
        input.age_band === '45_54' || input.age_band === '55_plus'
          ? 'Protect at least 48 hours, ideally 72, between your hardest efforts in these final weeks. One quality session landed fresh beats two landed tired.'
          : 'Keep your easy days genuinely easy in these final weeks. If you cannot hold a conversation, you are stealing from race day.',
        'Sleep is the only recovery intervention with overwhelming evidence behind it. The supplements and gadgets are rounding errors next to 30 extra minutes in bed.',
        'In race week, doing less than the plan is fine. Doing more is the only real mistake available to you.',
      ],
    },
    race_nerves: {
      struggle: 'race_nerves',
      title: 'Race day nerves',
      read: 'Nerves are arousal, and arousal is performance fuel pointed in the wrong direction. The fix is not calming down, it is having so much process to execute that there is no spare attention for dread.',
      protocol: [
        'Your race morning timeline is deliberately detailed. Follow it step by step and the morning becomes admin, not anticipation.',
        'In the pen, your only thought is the first split. Not the finish time, not the distance, not who is around you. One number.',
        'Reframe the sensation once: the body cannot tell the difference between nerves and readiness. Same chemicals. Call it readiness and get on with the warm up.',
      ],
    },
    pacing_blind: {
      struggle: 'pacing_blind',
      title: 'Pacing without feel',
      read: 'You flagged that judging pace is hard. The split table is your external pacing brain. Your job is execution, not estimation.',
      protocol: [
        `Set your watch to show current ${unit} pace and last ${unit} split, nothing else. More data fields means more noise.`,
        'Check pace at fixed points, not constantly. Every time the watch buzzes a split, adjust gently if needed. Between buzzes, run.',
        'GPS wanders in cities and under trees. Trust the official course markers over your watch when they disagree, and learn your splits at the key markers before race day.',
      ],
    },
  }

  return input.struggles.map((s) => map[s])
}

// ─── OVERVIEW + COACH NOTE ────────────────────────────────────────────────────

function buildOverview(input: RaceInput, feas: FeasibilityRead): string[] {
  const lines: string[] = []
  const distLabel = DIST_LABEL[input.distance]

  lines.push(
    `This plan is built for one race: ${input.race_name || 'your ' + distLabel} on ${new Date(
      input.race_date + 'T12:00:00'
    ).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Everything in it is derived from the fitness marker you gave, your goals, and what you told us about how you race.`
  )
  lines.push(feas.text)

  if (input.experience === 'first_time') {
    lines.push(
      `This is your first ${distLabel.toLowerCase()}. The single most common first-timer error is racing the first half on excitement. Your splits are built to prevent it, but the splits only work if you obey them when they feel too easy. They will feel too easy. That is the point.`
    )
  } else if (input.experience === 'racing_often') {
    lines.push(
      'You race regularly, so this plan skips the basics and concentrates on the margins: pacing shape, the decision point, and the late-race instructions. The difference between your good races and your best races lives there.'
    )
  }

  return lines
}

function buildCoachNote(input: RaceInput, feas: FeasibilityRead): string[] {
  const lines: string[] = []
  const name = input.first_name

  lines.push(
    `${name}, a few words from the coaching side of this.`
  )

  if (input.distance === 'marathon') {
    lines.push(
      'The marathon does not care what shape you are in. It cares what you do with it. I have run this distance hard enough to cramp at mile 23 with the finish in sight, and what I would tell you from that experience is simple: the discipline in the first 10K and the gels you take when you do not yet want them are worth more than any session you could still run between now and race day.'
    )
  } else if (input.distance === 'half') {
    lines.push(
      'The half is honest. It is long enough to punish poor pacing and short enough to reward bravery in the final quarter. The plan gives you both: patience early, and a defined place to be brave. Be boring for 70% of this race and the final 30% will be the best part of your day.'
    )
  } else if (input.distance === '10k') {
    lines.push(
      'The 10K hurts from about 6K no matter what shape you are in. The good news is that everyone around you is hurting at the same point. The plan winds the pace up exactly where the field starts coming back to you. There is no better feeling in racing than passing people who went too early. Set yourself up to be the one doing the passing.'
    )
  } else {
    lines.push(
      'The 5K rewards two things: an honest first kilometre and the willingness to sit in discomfort from halfway. There is no hiding place and no fuelling strategy to lean on. It is you, the splits, and ten to twenty minutes of concentration. Keep the first kilometre honest and you have earned the right to empty it at the end.'
    )
  }

  lines.push(
    'Trust what you are holding. It was built from your numbers, not a template, and the thinking behind every section comes from coaching real athletes and racing these distances at the sharp end. If you execute the boring parts, the exciting parts take care of themselves.'
  )
  lines.push('Good luck. Go and collect what you trained for.')
  lines.push('Concept Athletic')

  return lines
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function generateRacePlan(input: RaceInput): RacePlan {
  const markerKm = DIST_KM[input.marker_distance]
  const rawVdot = vdotFromPerformance(markerKm, input.marker_time_s)
  const vdot = ageAdjustedVdot(rawVdot, input.age_band, input.fitness_source)

  const feasibility = buildFeasibility(input, vdot)
  const { rows, paceA, paceB } = buildSplits(input)

  return {
    meta: {
      first_name: input.first_name,
      race_name: input.race_name || DIST_LABEL[input.distance],
      race_date: input.race_date,
      distance: input.distance,
      distance_label: DIST_LABEL[input.distance],
      goal_a: fmtTime(input.goal_a_s),
      goal_b: fmtTime(input.goal_b_s),
      generated_on: new Date().toISOString().slice(0, 10),
    },
    vdot: Math.round(vdot * 10) / 10,
    feasibility,
    overview: buildOverview(input, feasibility),
    splits: rows,
    split_unit: input.split_unit,
    pace_a_per_unit: paceA,
    pace_b_per_unit: paceB,
    race_week: buildRaceWeek(input),
    race_day: buildRaceDay(input),
    fuelling: buildFuelling(input),
    protocols: buildProtocols(input),
    coach_note: buildCoachNote(input, feasibility),
  }
}
