import { describe, it, expect } from 'vitest'
import {
  generateFuelPlan,
  roundToNearest5,
  roundToNearest50,
  parseDurationToMinutes,
  type ProfileInput,
  type PlanInput,
} from './fuelEngine'

// ─── UTIL TESTS ───────────────────────────────────────────────────────────────

describe('roundToNearest5', () => {
  it('rounds 22 to 20', () => expect(roundToNearest5(22)).toBe(20))
  it('rounds 23 to 25', () => expect(roundToNearest5(23)).toBe(25))
  it('rounds 90 to 90', () => expect(roundToNearest5(90)).toBe(90))
})

describe('roundToNearest50', () => {
  it('rounds 420 to 400', () => expect(roundToNearest50(420)).toBe(400))
  it('rounds 450 to 450', () => expect(roundToNearest50(450)).toBe(450))
  it('rounds 475 to 500', () => expect(roundToNearest50(475)).toBe(500))
})

describe('parseDurationToMinutes', () => {
  it('parses 1:30 -> 90', () => expect(parseDurationToMinutes('1:30')).toBe(90))
  it('parses 3:00 -> 180', () => expect(parseDurationToMinutes('3:00')).toBe(180))
  it('parses 0:45 -> 45', () => expect(parseDurationToMinutes('0:45')).toBe(45))
})

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const baseProfile: ProfileInput = {
  weight_kg: 70,
  sex: 'male',
  gi_tolerance: 'med',
  caffeine_tolerance: 'med',
}

const basePlan: PlanInput = {
  plan_type: 'race',
  sport: 'running',
  effort: 'race',
  conditions: 'normal',
  duration_minutes: 240,
  caffeine_enabled: true,
  bicarb_enabled: false,
}

// ─── CASE 1: Marathon, race mode, race effort, gi=high ─────────────────────

describe('Case 1: Marathon race, race effort, gi=high', () => {
  it('target is near top of 75–95 band', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'high' }
    const plan: PlanInput = {
      ...basePlan,
      duration_minutes: 240, // marathon ~4hr
      effort: 'race',
      plan_type: 'race',
    }
    const result = generateFuelPlan(profile, plan)
    expect(result.carb_target_g_per_hr).toBeGreaterThanOrEqual(80)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(95)
  })

  it('schedule frequency is 15 or 20 min', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'high' }
    const plan: PlanInput = {
      ...basePlan,
      duration_minutes: 240,
      effort: 'race',
      plan_type: 'race',
    }
    const result = generateFuelPlan(profile, plan)
    if (result.schedule.length >= 2) {
      const diff = result.schedule[1].minute_offset - result.schedule[0].minute_offset
      expect([15, 20]).toContain(diff)
    }
  })
})

// ─── CASE 2: Marathon session, long_run, steady, gi=med ──────────────────────

describe('Case 2: Marathon session, long_run, steady, gi=med', () => {
  it('target is around midpoint of band', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'med' }
    const plan: PlanInput = {
      ...basePlan,
      plan_type: 'session',
      effort: 'steady',
      session_subtype: 'long_run',
      duration_minutes: 210,
    }
    const result = generateFuelPlan(profile, plan)
    // 75–95 band, steady/long_run p=0.5, cap med=band.max-5=90, target ~85
    expect(result.carb_target_g_per_hr).toBeGreaterThanOrEqual(70)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(90)
  })

  it('race mode gives higher target than session mode same effort', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'high' }
    const sessionPlan: PlanInput = {
      ...basePlan,
      plan_type: 'session',
      effort: 'steady',
      session_subtype: 'long_run',
      duration_minutes: 210,
    }
    const racePlan: PlanInput = {
      ...basePlan,
      plan_type: 'race',
      effort: 'steady',
      duration_minutes: 210,
    }
    const sessionResult = generateFuelPlan(profile, sessionPlan)
    const raceResult = generateFuelPlan(profile, racePlan)
    expect(raceResult.carb_target_g_per_hr).toBeGreaterThanOrEqual(
      sessionResult.carb_target_g_per_hr
    )
  })
})

// ─── CASE 3: Half marathon, race, hard effort, hot conditions ─────────────────

describe('Case 3: Half marathon race, hard effort, hot', () => {
  it('fluid target is in hot band (>=600)', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'hard',
      conditions: 'hot',
      duration_minutes: 105,
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.fluid_ml_per_hr).toBeGreaterThanOrEqual(600)
    expect(result.fluid_ml_per_hr).toBeLessThanOrEqual(1000)
  })

  it('sodium target is in hot band (>=600)', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'hard',
      conditions: 'hot',
      duration_minutes: 105,
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.sodium_mg_per_hr).toBeGreaterThanOrEqual(600)
    expect(result.sodium_mg_per_hr).toBeLessThanOrEqual(1000)
  })
})

// ─── CASE 4: 10k race, race effort ────────────────────────────────────────────

describe('Case 4: 10k race, race effort', () => {
  it('target is in 30–60 band', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 55, // typical 10k
      distance: '10k',
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.carb_target_g_per_hr).toBeGreaterThanOrEqual(30)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(60)
  })
})

// ─── CASE 5: 5k race -> <=30, no schedule ─────────────────────────────────────

describe('Case 5: 5k race, short duration', () => {
  it('target is <= 30', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 22,
      distance: '5k',
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(30)
  })

  it('no schedule generated (target < 30)', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 22,
      distance: '5k',
    }
    const result = generateFuelPlan(baseProfile, plan)
    if (result.carb_target_g_per_hr < 30) {
      expect(result.schedule).toHaveLength(0)
    }
  })
})

// ─── CASE 6: Hyrox 70 min, race, gi=med -> upper bound reduced ────────────────

describe('Case 6: Hyrox 70 min, race effort, gi=med', () => {
  it('upper bound is reduced from running band (60 vs 50)', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'med' }
    const plan: PlanInput = {
      ...basePlan,
      sport: 'hyrox',
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 70,
    }
    const result = generateFuelPlan(profile, plan)
    // Running band for 45-75min = 30-60; Hyrox reduces to 30-50
    // med gi: cap at band.max-5 = 45
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(50)
  })

  it('hyrox target is <= running band for same params', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'med' }
    const sharedPlan = {
      effort: 'race' as const,
      plan_type: 'race' as const,
      conditions: 'normal' as const,
      duration_minutes: 70,
      caffeine_enabled: true,
      bicarb_enabled: false,
    }
    const runPlan: PlanInput = { ...sharedPlan, sport: 'running' }
    const hyroxPlan: PlanInput = { ...sharedPlan, sport: 'hyrox' }
    const runResult = generateFuelPlan(profile, runPlan)
    const hyroxResult = generateFuelPlan(profile, hyroxPlan)
    expect(hyroxResult.carb_target_g_per_hr).toBeLessThanOrEqual(runResult.carb_target_g_per_hr)
  })
})

// ─── CASE 7: Hyrox race + gi=high + effort=race -> running band allowed ──────

describe('Case 7: Hyrox race, gi=high, effort=race -> running band', () => {
  it('allows running band upper bound (not reduced)', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'high' }
    const hyroxPlan: PlanInput = {
      ...basePlan,
      sport: 'hyrox',
      effort: 'race',
      plan_type: 'race',
      gi_tolerance: 'high',
      duration_minutes: 70,
    } as PlanInput
    const runPlan: PlanInput = {
      ...basePlan,
      sport: 'running',
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 70,
    }
    const hyroxResult = generateFuelPlan(profile, hyroxPlan)
    const runResult = generateFuelPlan(profile, runPlan)
    // When gi=high and effort=race, hyrox gets full running band
    expect(hyroxResult.carb_target_g_per_hr).toBe(runResult.carb_target_g_per_hr)
  })
})

// ─── CASE 8: GI low, long duration -> cap <=75 ────────────────────────────────

describe('Case 8: GI low, long duration', () => {
  it('target capped at <= 75 when duration > 150 and gi=low', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'low' }
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 200,
    }
    const result = generateFuelPlan(profile, plan)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(75)
  })

  it('target never exceeds 80 for gi=low', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'low' }
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 130,
    }
    const result = generateFuelPlan(profile, plan)
    expect(result.carb_target_g_per_hr).toBeLessThanOrEqual(80)
  })
})

// ─── CASE 9: Caffeine low tolerance, 70kg -> correct mg range ─────────────────

describe('Case 9: Caffeine guidance, low tolerance, 70kg', () => {
  it('range_mg is [70, 140] for 70kg low tolerance', () => {
    const profile: ProfileInput = { ...baseProfile, weight_kg: 70, caffeine_tolerance: 'low' }
    const plan: PlanInput = { ...basePlan, caffeine_enabled: true, duration_minutes: 90 }
    const result = generateFuelPlan(profile, plan)
    expect(result.caffeine_guidance).toBeDefined()
    expect(result.caffeine_guidance!.range_mg).toEqual([70, 140])
  })

  it('no caffeine guidance when caffeine_enabled=false', () => {
    const plan: PlanInput = { ...basePlan, caffeine_enabled: false }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.caffeine_guidance).toBeUndefined()
  })
})

// ─── CASE 10: Maurten bicarb, 70kg, first_time -> 17.5g ───────────────────────

describe('Case 10: Maurten bicarb 70kg first_time', () => {
  it('dose_g = 17.5', () => {
    const profile: ProfileInput = { ...baseProfile, weight_kg: 70 }
    const plan: PlanInput = {
      ...basePlan,
      bicarb_enabled: true,
      bicarb_brand: 'maurten',
      bicarb_experience: 'first_time',
    }
    const result = generateFuelPlan(profile, plan)
    expect(result.bicarb_protocol).toBeDefined()
    expect(result.bicarb_protocol!.dose_g).toBe(17.5)
  })
})

// ─── CASE 11: Maurten bicarb, 70kg, experienced -> 21g ─────────────────────

describe('Case 11: Maurten bicarb 70kg experienced', () => {
  it('dose_g = 21.0', () => {
    const profile: ProfileInput = { ...baseProfile, weight_kg: 70 }
    const plan: PlanInput = {
      ...basePlan,
      bicarb_enabled: true,
      bicarb_brand: 'maurten',
      bicarb_experience: 'experienced',
    }
    const result = generateFuelPlan(profile, plan)
    expect(result.bicarb_protocol).toBeDefined()
    expect(result.bicarb_protocol!.dose_g).toBe(21)
  })
})

// ─── CASE 12: Flycarb includes cautions and timing text ──────────────────────

describe('Case 12: Flycarb protocol', () => {
  it('includes timing_text and cautions array', () => {
    const plan: PlanInput = {
      ...basePlan,
      bicarb_enabled: true,
      bicarb_brand: 'flycarb',
      bicarb_experience: 'experienced',
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.bicarb_protocol).toBeDefined()
    expect(result.bicarb_protocol!.timing_text).toContain('60–120 min')
    expect(result.bicarb_protocol!.cautions.length).toBeGreaterThan(0)
    const cautionsText = result.bicarb_protocol!.cautions.join(' ')
    expect(cautionsText).toMatch(/sodium/i)
    expect(cautionsText).toMatch(/hydration/i)
  })

  it('no dose_g for flycarb', () => {
    const plan: PlanInput = {
      ...basePlan,
      bicarb_enabled: true,
      bicarb_brand: 'flycarb',
      bicarb_experience: 'first_time',
    }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.bicarb_protocol!.dose_g).toBeUndefined()
  })
})

// ─── CASE 13: Schedule frequency matches target ───────────────────────────────

describe('Case 13: Schedule frequency matches carb target', () => {
  it('>=90 g/hr -> 15 min intervals', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'high' }
    const plan: PlanInput = {
      ...basePlan,
      effort: 'race',
      plan_type: 'race',
      duration_minutes: 200,
    }
    const result = generateFuelPlan(profile, plan)
    if (result.carb_target_g_per_hr >= 90 && result.schedule.length >= 2) {
      const diff = result.schedule[1].minute_offset - result.schedule[0].minute_offset
      expect(diff).toBe(15)
    }
  })

  it('>=60 <90 g/hr -> 20 min intervals', () => {
    const profile: ProfileInput = { ...baseProfile, gi_tolerance: 'med' }
    const plan: PlanInput = {
      ...basePlan,
      effort: 'steady',
      plan_type: 'session',
      session_subtype: 'long_run',
      duration_minutes: 150,
    }
    const result = generateFuelPlan(profile, plan)
    if (
      result.carb_target_g_per_hr >= 60 &&
      result.carb_target_g_per_hr < 90 &&
      result.schedule.length >= 2
    ) {
      const diff = result.schedule[1].minute_offset - result.schedule[0].minute_offset
      expect(diff).toBe(20)
    }
  })

  it('>=30 <60 g/hr -> 30 min intervals', () => {
    const plan: PlanInput = {
      ...basePlan,
      effort: 'easy',
      plan_type: 'session',
      duration_minutes: 90,
    }
    const result = generateFuelPlan(baseProfile, plan)
    if (
      result.carb_target_g_per_hr >= 30 &&
      result.carb_target_g_per_hr < 60 &&
      result.schedule.length >= 2
    ) {
      const diff = result.schedule[1].minute_offset - result.schedule[0].minute_offset
      expect(diff).toBe(30)
    }
  })
})

// ─── CASE 14: Total carbs calculation ─────────────────────────────────────────

describe('Case 14: Total carbs', () => {
  it('total_carbs_g = round(carb_target * duration_hours)', () => {
    const plan: PlanInput = { ...basePlan, duration_minutes: 120 }
    const result = generateFuelPlan(baseProfile, plan)
    expect(result.total_carbs_g).toBe(
      Math.round(result.carb_target_g_per_hr * (120 / 60))
    )
  })
})
