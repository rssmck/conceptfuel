// concept//fuel — deterministic fuel engine
// Pure, side-effect-free. No AI calls.

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type GITolerance = 'low' | 'med' | 'high'
export type CaffeineTolerance = 'none' | 'low' | 'med' | 'high'
export type Sex = 'male' | 'female' | 'prefer_not'
export type PlanType = 'race' | 'session'
export type Sport = 'running' | 'trail_running' | 'cycling' | 'hyrox'
export type Effort = 'easy' | 'steady' | 'hard' | 'race'
export type Conditions = 'normal' | 'hot'
export type Distance = '5k' | '10k' | 'half' | 'marathon' | 'twenty_miles' | 'other'
export type SessionSubtype = 'long_run' | 'tempo_threshold' | 'intervals' | 'hyrox_sim' | 'long_ride' | 'tempo_ride' | 'trail_run' | 'indoor_ride'
export type BicarbBrand = 'maurten' | 'flycarb'
export type BicarbExperience = 'first_time' | 'experienced'

export interface ProfileInput {
  weight_kg: number
  sex: Sex
  gi_tolerance: GITolerance
  caffeine_tolerance: CaffeineTolerance
}

export interface PlanInput {
  plan_type: PlanType
  sport: Sport
  effort: Effort
  conditions: Conditions
  duration_minutes: number
  caffeine_enabled: boolean
  bicarb_enabled: boolean
  bicarb_brand?: BicarbBrand
  bicarb_experience?: BicarbExperience
  nomio_enabled: boolean
  gel_product?: GelProduct
  // Running-only
  distance?: Distance
  // Session-only
  session_subtype?: SessionSubtype
  // Trail running / cycling
  elevation_gain_m?: number
}

export interface GelProduct {
  name: string
  carbs_g: number  // carbs per serving
}

export interface ScheduleItem {
  minute_offset: number
  carbs_g: number
  servings?: number
  suggestion: string
}

export interface CaffeineGuidance {
  range_mg: [number, number]
  timing_text: string
  notes: string[]
}

export interface BicarbProtocol {
  brand: string
  dose_g?: number
  timing_text: string
  cautions: string[]
}

export interface NomioProtocol {
  timing_text: string
  serving_note: string
  cautions: string[]
}

export interface FuelPlanOutput {
  protocol_name: string
  carb_target_g_per_hr: number
  total_carbs_g: number
  schedule: ScheduleItem[]
  fluid_ml_per_hr: number
  sodium_mg_per_hr: number
  caffeine_guidance?: CaffeineGuidance
  bicarb_protocol?: BicarbProtocol
  nomio_protocol?: NomioProtocol
  notes: string[]
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

export function roundToNearest5(n: number): number {
  return Math.round(n / 5) * 5
}

export function roundToNearest50(n: number): number {
  return Math.round(n / 50) * 50
}

export function parseDurationToMinutes(hhMM: string): number {
  const [h, m] = hhMM.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// ─── BAND LOOKUP ──────────────────────────────────────────────────────────────

interface CarbBand {
  min: number
  max: number
}

function getCarbBand(
  duration_minutes: number,
  sport: Sport,
  effort: Effort,
  gi_tolerance: GITolerance
): CarbBand {
  // Running baseline bands
  let band: CarbBand

  if (duration_minutes < 45) {
    band = { min: 0, max: 30 }
  } else if (duration_minutes < 75) {
    band = { min: 30, max: 60 }
  } else if (duration_minutes < 150) {
    band = { min: 60, max: 90 }
  } else if (duration_minutes < 240) {
    band = { min: 75, max: 95 }
  } else {
    band = { min: 75, max: 90 }
  }

  // Cycling: riders can absorb more carbs (lower GI stress vs running impact)
  if (sport === 'cycling') {
    band = { min: band.min, max: Math.min(120, band.max + 10) }
  }

  // Hyrox adjustment: reduce upper bound by 10
  // UNLESS effort='race' AND gi_tolerance='high'
  if (sport === 'hyrox' && !(effort === 'race' && gi_tolerance === 'high')) {
    band = { min: band.min, max: Math.max(band.min, band.max - 10) }
  }

  return band
}

// ─── EFFORT SCALAR ────────────────────────────────────────────────────────────

function getEffortScalar(
  effort: Effort,
  plan_type: PlanType,
  session_subtype?: SessionSubtype
): number {
  const baseP: Record<Effort, number> = {
    easy: 0.3,
    steady: 0.5,
    hard: 0.7,
    race: 0.8,
  }

  let p = baseP[effort]

  if (plan_type === 'race') {
    p = Math.min(0.9, p + 0.1)
  } else {
    // session mode adjustments
    if (session_subtype === 'long_run' || session_subtype === 'long_ride' || session_subtype === 'trail_run') {
      if (effort !== 'race') p = 0.5
    } else if (
      (session_subtype === 'intervals' || session_subtype === 'tempo_threshold' || session_subtype === 'tempo_ride') &&
      effort === 'hard'
    ) {
      p = Math.min(0.75, p)
    }
  }

  return p
}

// ─── GI CAPS ─────────────────────────────────────────────────────────────────

function applyGICap(
  target: number,
  band: CarbBand,
  gi_tolerance: GITolerance,
  duration_minutes: number
): number {
  let capped = target

  if (gi_tolerance === 'low') {
    const giCap = Math.min(80, band.min + 20)
    capped = Math.min(capped, giCap)
    if (duration_minutes > 150) {
      capped = Math.min(capped, 75)
    }
  } else if (gi_tolerance === 'med') {
    capped = Math.min(capped, band.max - 5)
  }
  // gi_tolerance='high' -> allow up to band.max

  return capped
}

// ─── ELEVATION BOOST ──────────────────────────────────────────────────────────

/**
 * Additional g/hr carbs from climbing. Based on elevation gain rate (m/hr).
 * Applies to trail running and cycling only.
 */
function computeElevationBoost(elevation_gain_m: number, duration_minutes: number): number {
  if (elevation_gain_m <= 0) return 0
  const gain_per_hr = elevation_gain_m / (duration_minutes / 60)
  if (gain_per_hr < 200) return 0
  if (gain_per_hr < 500) return 5
  if (gain_per_hr < 800) return 10
  return 15
}

// ─── CARB TARGET ──────────────────────────────────────────────────────────────

function computeCarbTarget(
  duration_minutes: number,
  sport: Sport,
  effort: Effort,
  plan_type: PlanType,
  gi_tolerance: GITolerance,
  session_subtype?: SessionSubtype,
  elevation_gain_m?: number
): number {
  const band = getCarbBand(duration_minutes, sport, effort, gi_tolerance)
  const p = getEffortScalar(effort, plan_type, session_subtype)

  let raw = band.min + p * (band.max - band.min)

  // For <45 min, override with simpler defaults
  if (duration_minutes < 45) {
    if (plan_type === 'race' && effort === 'race') {
      raw = 25 // mid of 20–30 range
    } else if (effort === 'easy' || effort === 'steady') {
      raw = 10
    } else {
      raw = 20
    }
  }

  let target = roundToNearest5(raw)

  // Apply GI caps
  target = applyGICap(target, band, gi_tolerance, duration_minutes)

  // Elevation boost for trail running and cycling
  if (elevation_gain_m && elevation_gain_m > 0 && (sport === 'trail_running' || sport === 'cycling')) {
    const boost = computeElevationBoost(elevation_gain_m, duration_minutes)
    target = roundToNearest5(target + boost)
    // Re-apply GI cap after elevation boost
    target = applyGICap(target, band, gi_tolerance, duration_minutes)
  }

  // Global cap: never exceed 110 (cycling can push slightly higher)
  const globalCap = sport === 'cycling' ? 110 : 105
  target = Math.min(target, globalCap)

  // Ensure not below band.min (except <45 min where 0 is allowed)
  if (duration_minutes >= 45) {
    target = Math.max(target, band.min)
  }

  return target
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────

function makeSuggestion(carbs_g: number, product?: GelProduct): string {
  if (product && product.carbs_g > 0) {
    const servings = Math.max(1, Math.round(carbs_g / product.carbs_g))
    const actual = servings * product.carbs_g
    return `${servings} x ${product.name} (${actual}g)`
  }
  // Generic: show actual target amount so the maths is transparent
  if (carbs_g >= 45) return `~${carbs_g}g (2 gels or 500ml drink mix; adjust to your products)`
  if (carbs_g >= 20) return `~${carbs_g}g (gel or chews; adjust to your products)`
  return `~${carbs_g}g (chews or small gel; adjust to your products)`
}

function generateSchedule(
  carb_target_g_per_hr: number,
  duration_minutes: number,
  product?: GelProduct,
  includePreStart?: boolean
): ScheduleItem[] {
  if (carb_target_g_per_hr < 30) return []

  let freq_minutes: number
  let carbs_per_dose: number

  if (product && product.carbs_g > 0) {
    // Work backwards from serving size so the schedule actually hits the target rate.
    // e.g. OTE Superfuel (40g) at 80g/hr → ideal interval = 40/80*60 = 30 min, not 20 min.
    const idealInterval = (product.carbs_g / carb_target_g_per_hr) * 60
    const snapPoints = [12, 15, 20, 25, 30, 45, 60]
    freq_minutes = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - idealInterval) < Math.abs(prev - idealInterval) ? curr : prev
    )
    carbs_per_dose = product.carbs_g // 1 serving per interval
  } else {
    // Rate-first scheduling for generic / no product.
    // Use 30-min intervals — most athletes take 1 gel every 30 min in practice.
    // e.g. 90 g/hr → 45g every 30 min (≈ 2 gels); 60 g/hr → 30g every 30 min (≈ 1 gel).
    freq_minutes = 30
    carbs_per_dose = Math.round(carb_target_g_per_hr * (freq_minutes / 60))
  }

  const items: ScheduleItem[] = []

  // Pre-start gel for longer race plans
  if (includePreStart) {
    const preCarbs = product ? product.carbs_g : 25
    items.push({
      minute_offset: 0,
      carbs_g: preCarbs,
      suggestion: product
        ? `1 x ${product.name} (${preCarbs}g) — at the start line`
        : '~25g (1 gel at the start line)',
    })
  }

  // Start offset: first in-race intake no later than 20 min
  const start = duration_minutes >= 60 ? Math.min(freq_minutes, 20) : 15

  let minute = start
  while (minute <= duration_minutes - 10) {
    const servings =
      product && product.carbs_g > 0
        ? Math.max(1, Math.round(carbs_per_dose / product.carbs_g))
        : undefined
    items.push({
      minute_offset: minute,
      carbs_g: servings && product ? servings * product.carbs_g : carbs_per_dose,
      servings,
      suggestion: makeSuggestion(carbs_per_dose, product),
    })
    minute += freq_minutes
  }

  return items
}

// ─── FLUID + SODIUM ───────────────────────────────────────────────────────────

function computeFluid(
  effort: Effort,
  conditions: Conditions,
  plan_type: PlanType,
  session_subtype?: SessionSubtype
): number {
  // Indoor cycling: no airflow, high core temp — treat as at least 'hot'
  const isIndoor = session_subtype === 'indoor_ride'
  const effectiveConditions: Conditions = isIndoor && conditions === 'normal' ? 'hot' : conditions

  const bands: Record<Conditions, { min: number; max: number }> = {
    normal: { min: 400, max: 700 },
    hot: { min: 600, max: 1000 },
  }
  const b = bands[effectiveConditions]

  const scalars: Record<Effort, number> = {
    easy: 0.35,
    steady: 0.5,
    hard: 0.65,
    race: 0.75,
  }
  let p = scalars[effort]
  if (plan_type === 'race') p = Math.min(0.85, p + 0.05)
  // Indoor: push toward upper end of already-elevated band
  if (isIndoor) p = Math.min(0.9, p + 0.1)

  return roundToNearest50(b.min + p * (b.max - b.min))
}

function computeSodium(
  effort: Effort,
  conditions: Conditions,
  plan_type: PlanType,
  session_subtype?: SessionSubtype
): number {
  // Indoor cycling: elevated sweat rate + sodium losses with no cooling airflow
  const isIndoor = session_subtype === 'indoor_ride'
  const effectiveConditions: Conditions = isIndoor && conditions === 'normal' ? 'hot' : conditions

  const bands: Record<Conditions, { min: number; max: number }> = {
    normal: { min: 300, max: 600 },
    hot: { min: 600, max: 1000 },
  }
  const b = bands[effectiveConditions]

  const scalars: Record<Effort, number> = {
    easy: 0.35,
    steady: 0.5,
    hard: 0.65,
    race: 0.75,
  }
  let p = scalars[effort]
  if (plan_type === 'race') p = Math.min(0.85, p + 0.05)
  if (isIndoor) p = Math.min(0.9, p + 0.1)

  return roundToNearest50(b.min + p * (b.max - b.min))
}

// ─── CAFFEINE GUIDANCE ────────────────────────────────────────────────────────

function computeCaffeine(
  weight_kg: number,
  caffeine_tolerance: CaffeineTolerance,
  duration_minutes: number
): CaffeineGuidance | undefined {
  if (caffeine_tolerance === 'none') return undefined

  const ranges: Record<Exclude<CaffeineTolerance, 'none'>, [number, number]> = {
    low: [1, 2],
    med: [2, 3],
    high: [3, 4],
  }

  const timings: Record<Exclude<CaffeineTolerance, 'none'>, string> = {
    low: '30–45 min before start',
    med: '30–60 min before start',
    high: '45–60 min before start',
  }

  const [loMgKg, hiMgKg] = ranges[caffeine_tolerance as Exclude<CaffeineTolerance, 'none'>]
  const range_mg: [number, number] = [
    Math.round(loMgKg * weight_kg),
    Math.round(hiMgKg * weight_kg),
  ]

  const notes: string[] = [
    'Avoid if caffeine-sensitive or taking medication that interacts with caffeine.',
    'Trial in training before using on race day.',
  ]

  if (duration_minutes > 150) {
    notes.push(
      `For longer efforts, consider a small top-up of ${Math.round(0.5 * weight_kg)}–${Math.round(1 * weight_kg)} mg after ~2 hours. Trial in training only.`
    )
  }

  return {
    range_mg,
    timing_text: timings[caffeine_tolerance as Exclude<CaffeineTolerance, 'none'>],
    notes,
  }
}

// ─── BICARB PROTOCOL ──────────────────────────────────────────────────────────

function computeBicarb(
  weight_kg: number,
  bicarb_brand: BicarbBrand,
  bicarb_experience: BicarbExperience
): BicarbProtocol {
  const baseCautions = [
    'Trial in training well before race day. Never first use on race day.',
    'GI distress risk: nausea, bloating, discomfort. Start with lower dose.',
    'Do not use if you have contraindications (e.g. kidney conditions, certain medications).',
    'Consult a clinician if you have any medical conditions or take regular medication.',
  ]

  if (bicarb_brand === 'maurten') {
    const factor = bicarb_experience === 'first_time' ? 0.25 : 0.3
    const dose_raw = factor * weight_kg
    // Round to nearest 0.5
    const dose_g = Math.round(dose_raw * 2) / 2

    return {
      brand: 'Maurten Bicarb System',
      dose_g,
      timing_text:
        'Aim to complete intake 60–120 min before the start. Individual response varies.',
      cautions: [
        ...baseCautions,
        'Follow the Maurten product instructions precisely.',
        'Ensure adequate water intake alongside the product.',
      ],
    }
  } else {
    // flycarb
    return {
      brand: 'Flycarb',
      timing_text:
        'Typically 60–120 min pre-event; many athletes aim for 90–120 min. Individual response varies. Trial in training.',
      cautions: [
        ...baseCautions,
        'High sodium load. Pay close attention to hydration on the day.',
        'Some guidance suggests max ~3x per week. Do not overuse.',
        'Follow the Flycarb product instructions precisely.',
      ],
    }
  }
}

// ─── NOMIO PROTOCOL ───────────────────────────────────────────────────────────

function computeNomio(): NomioProtocol {
  return {
    timing_text:
      'Take one serving approximately 3 hours before your intense session. Take a second serving before bed on the same day as the session.',
    serving_note:
      'Nomio is a fixed-serving broccoli sprout concentrate (stabilised isothiocyanates / sulforaphane). Follow the product label for serving size.',
    cautions: [
      'Trial before any race or key event. Never use for the first time on race day.',
      'GI sensitivity risk: some individuals experience digestive discomfort. Start with a single serving to assess tolerance.',
      'Not suitable as a substitute for carbohydrate fuelling. This is a separate performance support supplement.',
      'Consult a clinician if you are pregnant, have a medical condition, or take regular medication.',
      'Research on isothiocyanates in sport is emerging. Guidance may evolve.',
    ],
  }
}

// ─── PROTOCOL NAME ────────────────────────────────────────────────────────────

function computeProtocolName(plan_type: PlanType, effort: Effort): string {
  if (plan_type === 'race') return 'race day'
  // session
  if (effort === 'easy')   return 'easy endurance'
  if (effort === 'steady') return 'steady endurance'
  if (effort === 'hard')   return 'high output'
  if (effort === 'race')   return 'race simulation'
  return 'training session'
}

// ─── MAIN ENGINE ──────────────────────────────────────────────────────────────

export function generateFuelPlan(
  profile: ProfileInput,
  plan: PlanInput
): FuelPlanOutput {
  const { weight_kg, gi_tolerance, caffeine_tolerance } = profile
  const {
    plan_type,
    sport,
    effort,
    conditions,
    duration_minutes,
    caffeine_enabled,
    bicarb_enabled,
    bicarb_brand,
    bicarb_experience,
    session_subtype,
  } = plan

  // A) Carb target
  const carb_target_g_per_hr = computeCarbTarget(
    duration_minutes,
    sport,
    effort,
    plan_type,
    gi_tolerance,
    session_subtype,
    plan.elevation_gain_m
  )

  // B) Schedule (computed before total so we can sum actual delivered carbs)
  // Interval sessions: no in-session schedule — fuel pre-session only.
  // Rest intervals make deterministic gel timing impractical and unnecessary.
  const isIntervalSession = plan_type === 'session' && session_subtype === 'intervals'
  const includePreStart = plan_type === 'race' && duration_minutes >= 90
  const schedule = isIntervalSession
    ? []
    : generateSchedule(carb_target_g_per_hr, duration_minutes, plan.gel_product, includePreStart)

  // C) Total carbs — sum actual schedule carbs so displayed figure matches the plan
  const total_carbs_g = schedule.length > 0
    ? schedule.reduce((sum, item) => sum + item.carbs_g, 0)
    : Math.round(carb_target_g_per_hr * (duration_minutes / 60))

  // D) Fluid + Sodium
  const fluid_ml_per_hr = computeFluid(effort, conditions, plan_type, session_subtype)
  const sodium_mg_per_hr = computeSodium(effort, conditions, plan_type, session_subtype)

  // E) Caffeine
  const caffeine_guidance =
    caffeine_enabled && caffeine_tolerance !== 'none'
      ? computeCaffeine(weight_kg, caffeine_tolerance, duration_minutes)
      : undefined

  // F) Bicarb
  const bicarb_protocol =
    bicarb_enabled && bicarb_brand && bicarb_experience
      ? computeBicarb(weight_kg, bicarb_brand, bicarb_experience)
      : undefined

  // G) Nomio
  const nomio_protocol = plan.nomio_enabled ? computeNomio() : undefined

  // Notes
  const productNote = plan.gel_product
    ? `Schedule uses ${plan.gel_product.name} (${plan.gel_product.carbs_g}g carbs per serving).`
    : 'Assumes ~25g carbs per serving. Adjust targets to match your specific products.'

  const notes: string[] = [
    'Practise this strategy in training before race day.',
    productNote,
    'These targets are starting points. Individual needs vary. Adjust based on training experience.',
  ]

  if (gi_tolerance === 'low') {
    notes.push(
      'Your GI tolerance is set to low. Targets have been capped conservatively. Prioritise real-food and liquid carb sources where possible.'
    )
  }

  if (plan.elevation_gain_m && plan.elevation_gain_m > 0 && (sport === 'trail_running' || sport === 'cycling')) {
    const boost = computeElevationBoost(plan.elevation_gain_m, duration_minutes)
    if (boost > 0) {
      notes.push(
        `${plan.elevation_gain_m}m of elevation has added +${boost}g/hr to your carb target. Climbing significantly increases energy cost. Adjust based on how climbing is distributed throughout the event.`
      )
    }
  }

  if (sport === 'cycling') {
    notes.push(
      'Cycling targets are set slightly higher than road running — reduced GI stress from no impact means most riders can tolerate more carbs per hour. Build up through training.'
    )
  }

  if (session_subtype === 'indoor_ride') {
    notes.push(
      'Indoor cycling (Zwift / turbo): no airflow cooling means significantly higher sweat rates and sodium losses. Fluid and sodium targets have been elevated accordingly. Use a fan if possible and pre-cool where practical.'
    )
  }

  if (isIntervalSession) {
    notes.push(
      'Track and interval sessions: fuel around the session, not during it. Have a gel or carb drink 30 min before your warm-up. Rest intervals between reps mean in-session gel timing is impractical — your gut needs blood flow, not carbs, mid-effort. Keep electrolytes available throughout.'
    )
    notes.push(
      'Session duration is variable — 16×400m with 100m jog recovery plus warm-up and cool-down might run 55 min to 90 min depending on pace. Set your duration as an estimate; your carb target per-hour remains valid regardless of total session length.'
    )
  }

  if (carb_target_g_per_hr === 0) {
    notes.push('No in-session fuelling required. Focus on pre-session nutrition.')
  }

  const protocol_name = computeProtocolName(plan_type, effort)

  return {
    protocol_name,
    carb_target_g_per_hr,
    total_carbs_g,
    schedule,
    fluid_ml_per_hr,
    sodium_mg_per_hr,
    caffeine_guidance,
    bicarb_protocol,
    nomio_protocol,
    notes,
  }
}
