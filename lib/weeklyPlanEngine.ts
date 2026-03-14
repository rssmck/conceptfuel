import type { TrainingGoal, TrainingStyle } from './formEngine'

export type PlanGoal = TrainingGoal
export type PlanStyle = TrainingStyle

export interface PlanSession {
  session_type: string
  goal: string
  label: string
  duration_minutes: number
}

export interface WeekPhase {
  week_number: number
  phase_name: string
  phase_note: string
  sessions: PlanSession[]
}

export interface TrainingPlanTemplate {
  name: string
  goal: string
  training_style: string
  days_per_week: number
  block_weeks: number
  starts_on: string
  weeks: WeekPhase[]
}

// ─── Default durations ────────────────────────────────────────────────────────

const DEFAULT_DURATION: Record<string, number> = {
  strength: 60,
  hypertrophy: 60,
  power: 60,
  endurance_sc: 60,
  plyo: 45,
  aesthetic: 60,
  general: 45,
}

// ─── Session maps ─────────────────────────────────────────────────────────────

function getSessions(goal: PlanGoal, days: number): PlanSession[] {
  const d = DEFAULT_DURATION[goal] ?? 60

  if (goal === 'strength') {
    if (days === 2) return [
      { session_type: 'legs', goal: 'strength', label: 'Lower body', duration_minutes: d },
      { session_type: 'back', goal: 'strength', label: 'Back', duration_minutes: d },
    ]
    if (days === 3) return [
      { session_type: 'legs', goal: 'strength', label: 'Lower body', duration_minutes: d },
      { session_type: 'back', goal: 'strength', label: 'Back', duration_minutes: d },
      { session_type: 'chest', goal: 'strength', label: 'Chest and shoulders', duration_minutes: d },
    ]
    if (days === 4) return [
      { session_type: 'legs', goal: 'strength', label: 'Lower body A', duration_minutes: d },
      { session_type: 'back', goal: 'strength', label: 'Back', duration_minutes: d },
      { session_type: 'legs', goal: 'strength', label: 'Lower B', duration_minutes: d },
      { session_type: 'chest', goal: 'strength', label: 'Chest', duration_minutes: d },
    ]
    // 5
    return [
      { session_type: 'legs', goal: 'strength', label: 'Lower body A', duration_minutes: d },
      { session_type: 'back', goal: 'strength', label: 'Back', duration_minutes: d },
      { session_type: 'chest', goal: 'strength', label: 'Chest', duration_minutes: d },
      { session_type: 'legs', goal: 'strength', label: 'Lower B', duration_minutes: d },
      { session_type: 'full_body', goal: 'strength', label: 'Full body accessory', duration_minutes: d },
    ]
  }

  if (goal === 'hypertrophy') {
    if (days === 2) return [
      { session_type: 'full_body', goal: 'hypertrophy', label: 'Full body A', duration_minutes: d },
      { session_type: 'full_body', goal: 'hypertrophy', label: 'Full body B', duration_minutes: d },
    ]
    if (days === 3) return [
      { session_type: 'chest', goal: 'hypertrophy', label: 'Push', duration_minutes: d },
      { session_type: 'back', goal: 'hypertrophy', label: 'Pull', duration_minutes: d },
      { session_type: 'legs', goal: 'hypertrophy', label: 'Legs', duration_minutes: 75 },
    ]
    if (days === 4) return [
      { session_type: 'chest', goal: 'hypertrophy', label: 'Chest and shoulders', duration_minutes: d },
      { session_type: 'back', goal: 'hypertrophy', label: 'Back and arms', duration_minutes: d },
      { session_type: 'legs', goal: 'hypertrophy', label: 'Legs A', duration_minutes: 75 },
      { session_type: 'glutes', goal: 'hypertrophy', label: 'Glutes and legs B', duration_minutes: 75 },
    ]
    // 5
    return [
      { session_type: 'chest', goal: 'hypertrophy', label: 'Chest', duration_minutes: d },
      { session_type: 'back', goal: 'hypertrophy', label: 'Back', duration_minutes: d },
      { session_type: 'legs', goal: 'hypertrophy', label: 'Legs', duration_minutes: 75 },
      { session_type: 'shoulders', goal: 'hypertrophy', label: 'Shoulders and arms', duration_minutes: d },
      { session_type: 'glutes', goal: 'hypertrophy', label: 'Glutes', duration_minutes: 75 },
    ]
  }

  if (goal === 'power') {
    if (days === 2) return [
      { session_type: 'full_body', goal: 'power', label: 'Power A', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power B', duration_minutes: d },
    ]
    if (days === 3) return [
      { session_type: 'full_body', goal: 'power', label: 'Lower power', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Upper power', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Full power', duration_minutes: d },
    ]
    if (days === 4) return [
      { session_type: 'full_body', goal: 'power', label: 'Power A', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power B', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power C', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power D', duration_minutes: d },
    ]
    // 5
    return [
      { session_type: 'full_body', goal: 'power', label: 'Power A', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power B', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power C', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power D', duration_minutes: d },
      { session_type: 'full_body', goal: 'power', label: 'Power E', duration_minutes: d },
    ]
  }

  if (goal === 'endurance_sc') {
    if (days === 2) return [
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C A', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C B', duration_minutes: d },
    ]
    if (days === 3) return [
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C A', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C B', duration_minutes: d },
      { session_type: 'core', goal: 'general', label: 'Core and stability', duration_minutes: 45 },
    ]
    if (days === 4) return [
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C A', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C B', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C C', duration_minutes: d },
      { session_type: 'core', goal: 'general', label: 'Core and stability', duration_minutes: 45 },
    ]
    // 5
    return [
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C A', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C B', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C C', duration_minutes: d },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C D', duration_minutes: d },
      { session_type: 'core', goal: 'general', label: 'Core and stability', duration_minutes: 45 },
    ]
  }

  if (goal === 'plyo') {
    if (days === 2) return [
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics A', duration_minutes: 45 },
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics B', duration_minutes: 45 },
    ]
    if (days === 3) return [
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics A', duration_minutes: 45 },
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics B', duration_minutes: 45 },
      { session_type: 'legs', goal: 'strength', label: 'Strength support', duration_minutes: 60 },
    ]
    if (days === 4) return [
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics A', duration_minutes: 45 },
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics B', duration_minutes: 45 },
      { session_type: 'legs', goal: 'strength', label: 'Strength support', duration_minutes: 60 },
      { session_type: 'full_body', goal: 'endurance_sc', label: 'Endurance S&C', duration_minutes: 60 },
    ]
    // 5
    return [
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics A', duration_minutes: 45 },
      { session_type: 'full_body', goal: 'plyo', label: 'Plyometrics B', duration_minutes: 45 },
      { session_type: 'legs', goal: 'strength', label: 'Strength support A', duration_minutes: 60 },
      { session_type: 'legs', goal: 'strength', label: 'Strength support B', duration_minutes: 60 },
      { session_type: 'core', goal: 'general', label: 'Core and stability', duration_minutes: 45 },
    ]
  }

  if (goal === 'aesthetic') {
    if (days === 2) return [
      { session_type: 'full_body', goal: 'aesthetic', label: 'Full body A', duration_minutes: d },
      { session_type: 'full_body', goal: 'aesthetic', label: 'Full body B', duration_minutes: d },
    ]
    if (days === 3) return [
      { session_type: 'glutes', goal: 'aesthetic', label: 'Glutes and posterior chain', duration_minutes: d },
      { session_type: 'back', goal: 'aesthetic', label: 'Back and arms', duration_minutes: d },
      { session_type: 'legs', goal: 'aesthetic', label: 'Legs', duration_minutes: d },
    ]
    if (days === 4) return [
      { session_type: 'glutes', goal: 'aesthetic', label: 'Glutes and posterior chain', duration_minutes: d },
      { session_type: 'back', goal: 'aesthetic', label: 'Back and arms', duration_minutes: d },
      { session_type: 'legs', goal: 'aesthetic', label: 'Legs', duration_minutes: d },
      { session_type: 'shoulders', goal: 'aesthetic', label: 'Shoulders and chest', duration_minutes: d },
    ]
    // 5
    return [
      { session_type: 'glutes', goal: 'aesthetic', label: 'Glutes and posterior chain', duration_minutes: d },
      { session_type: 'back', goal: 'aesthetic', label: 'Back and arms', duration_minutes: d },
      { session_type: 'legs', goal: 'aesthetic', label: 'Legs', duration_minutes: d },
      { session_type: 'shoulders', goal: 'aesthetic', label: 'Shoulders and chest', duration_minutes: d },
      { session_type: 'arms', goal: 'aesthetic', label: 'Arms and core', duration_minutes: 45 },
    ]
  }

  // general
  if (days === 2) return [
    { session_type: 'full_body', goal: 'general', label: 'Full body A', duration_minutes: 45 },
    { session_type: 'full_body', goal: 'general', label: 'Full body B', duration_minutes: 45 },
  ]
  if (days === 3) return [
    { session_type: 'full_body', goal: 'general', label: 'Full body A', duration_minutes: 45 },
    { session_type: 'full_body', goal: 'general', label: 'Full body B', duration_minutes: 45 },
    { session_type: 'core', goal: 'general', label: 'Core and mobility', duration_minutes: 45 },
  ]
  if (days === 4) return [
    { session_type: 'legs', goal: 'general', label: 'Lower body', duration_minutes: 45 },
    { session_type: 'chest', goal: 'general', label: 'Push', duration_minutes: 45 },
    { session_type: 'back', goal: 'general', label: 'Pull', duration_minutes: 45 },
    { session_type: 'full_body', goal: 'general', label: 'Full body', duration_minutes: 60 },
  ]
  // 5
  return [
    { session_type: 'legs', goal: 'general', label: 'Lower body', duration_minutes: 45 },
    { session_type: 'chest', goal: 'general', label: 'Push', duration_minutes: 45 },
    { session_type: 'back', goal: 'general', label: 'Pull', duration_minutes: 45 },
    { session_type: 'full_body', goal: 'general', label: 'Full body', duration_minutes: 60 },
    { session_type: 'core', goal: 'general', label: 'Core and mobility', duration_minutes: 30 },
  ]
}

// ─── Phase logic ──────────────────────────────────────────────────────────────

interface PhaseInfo {
  name: string
  note: string
}

const PHASE_NOTES: Record<string, string> = {
  Foundation: 'Focus on movement quality and building the habit. Use 70% of working weight to establish technique and get a feel for the session.',
  Build: 'Increase load or volume from last week. Add a set, add weight, or reduce rest. Progressive overload starts here.',
  Push: 'Working at 85-90% capacity. This is where adaptation happens. Recover properly between sessions.',
  Peak: 'Final push. Week 7 is maximum effort. Week 8 is an active deload. Reduce volume by 40%, keep intensity moderate.',
}

function getPhase(weekNumber: number, blockWeeks: number): PhaseInfo {
  if (blockWeeks === 4) {
    if (weekNumber <= 2) return { name: 'Foundation', note: PHASE_NOTES.Foundation }
    return { name: 'Build', note: PHASE_NOTES.Build }
  }
  if (blockWeeks === 6) {
    if (weekNumber <= 2) return { name: 'Foundation', note: PHASE_NOTES.Foundation }
    if (weekNumber <= 4) return { name: 'Build', note: PHASE_NOTES.Build }
    return { name: 'Push', note: PHASE_NOTES.Push }
  }
  // 8 weeks
  if (weekNumber <= 2) return { name: 'Foundation', note: PHASE_NOTES.Foundation }
  if (weekNumber <= 4) return { name: 'Build', note: PHASE_NOTES.Build }
  if (weekNumber <= 6) return { name: 'Push', note: PHASE_NOTES.Push }
  return { name: 'Peak', note: PHASE_NOTES.Peak }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateTrainingPlan(params: {
  goal: PlanGoal
  training_style: PlanStyle
  days_per_week: number
  block_weeks: number
  starts_on: string
  name?: string
}): TrainingPlanTemplate {
  const { goal, training_style, days_per_week, block_weeks, starts_on } = params

  const GOAL_LABELS: Record<string, string> = {
    strength: 'Strength',
    hypertrophy: 'Build muscle',
    power: 'Power',
    endurance_sc: 'Endurance S&C',
    plyo: 'Plyometrics',
    aesthetic: 'Aesthetic & strong',
    general: 'General fitness',
  }

  const name = params.name || `${GOAL_LABELS[goal] ?? goal} block`
  const sessions = getSessions(goal, days_per_week)

  const weeks: WeekPhase[] = []
  for (let w = 1; w <= block_weeks; w++) {
    const phase = getPhase(w, block_weeks)
    weeks.push({
      week_number: w,
      phase_name: phase.name,
      phase_note: phase.note,
      sessions: sessions.map(s => ({ ...s })),
    })
  }

  return {
    name,
    goal,
    training_style,
    days_per_week,
    block_weeks,
    starts_on,
    weeks,
  }
}
