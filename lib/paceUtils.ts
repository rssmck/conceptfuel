// Pace and distance utilities — pure, no side effects

export type PaceUnit = 'km' | 'mile'
export type KnownDistance = '5k' | '10k' | 'half' | 'marathon'

const DISTANCE_KM: Record<KnownDistance, number> = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'marathon': 42.195,
}

const KM_PER_MILE = 1.60934

/** Parse "M:SS" or "MM:SS" pace string -> decimal minutes per km. Returns null if invalid. */
export function parsePaceToMinPerKm(paceStr: string, unit: PaceUnit): number | null {
  const match = paceStr.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const mins = parseInt(match[1], 10)
  const secs = parseInt(match[2], 10)
  if (secs >= 60) return null
  const minPerUnit = mins + secs / 60
  if (minPerUnit <= 0) return null
  return unit === 'km' ? minPerUnit : minPerUnit / KM_PER_MILE
}

/** Convert a KnownDistance to km. Returns null for 'other'. */
export function distanceToKm(distance: string): number | null {
  return DISTANCE_KM[distance as KnownDistance] ?? null
}

/**
 * Estimate finish time from pace and distance.
 * Returns "H:MM" string, or null if inputs are invalid.
 */
export function estimateDuration(paceStr: string, unit: PaceUnit, distanceKm: number): string | null {
  const minPerKm = parsePaceToMinPerKm(paceStr, unit)
  if (!minPerKm) return null
  const totalMins = minPerKm * distanceKm
  if (totalMins <= 0 || !isFinite(totalMins)) return null
  const h = Math.floor(totalMins / 60)
  const m = Math.round(totalMins % 60)
  // handle rounding up to next hour
  if (m === 60) return `${h + 1}:00`
  return `${h}:${String(m).padStart(2, '0')}`
}
