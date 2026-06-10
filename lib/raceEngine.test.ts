import { describe, it, expect } from "vitest";
import {
  generateRacePlan,
  parseTimeToSeconds,
  fmtTime,
  vdotFromPerformance,
  predictTime,
  type RaceInput,
} from "./raceEngine";

function base(over: Partial<RaceInput> = {}): RaceInput {
  return {
    distance: "half",
    race_name: "Test Half",
    race_date: "2026-10-04",
    fitness_source: "recent_race",
    marker_distance: "10k",
    marker_time_s: 41 * 60 + 30,
    goal_a_s: 89 * 60 + 59,
    goal_b_s: 92 * 60,
    weeks_out: 16,
    runs_per_week: 4,
    experience: "done_before",
    age_band: "35_44",
    struggles: ["starts_too_fast", "fades_late"],
    fuelling_in_race: "not_sure",
    split_unit: "km",
    first_name: "Test",
    ...over,
  };
}

describe("time helpers", () => {
  it("parses and formats round trip", () => {
    expect(parseTimeToSeconds("1:29:59")).toBe(5399);
    expect(parseTimeToSeconds("24:30")).toBe(1470);
    expect(fmtTime(5399)).toBe("1:29:59");
    expect(fmtTime(1470)).toBe("24:30");
  });
  it("rejects junk", () => {
    expect(parseTimeToSeconds("abc")).toBeNull();
    expect(parseTimeToSeconds("-5:00")).toBeNull();
  });
});

describe("vdot", () => {
  it("is sane for a known performance", () => {
    // ~63 VDOT runner from a 17:44 5.43k relay leg
    const v = vdotFromPerformance(5.43, 17 * 60 + 44);
    expect(v).toBeGreaterThan(60);
    expect(v).toBeLessThan(66);
  });
  it("predicts longer distances slower than shorter", () => {
    const v = 50;
    expect(predictTime(42.195, v)).toBeGreaterThan(predictTime(21.0975, v));
    expect(predictTime(21.0975, v)).toBeGreaterThan(predictTime(10, v));
  });
});

describe("splits sum exactly to the goals", () => {
  for (const distance of ["5k", "10k", "half", "marathon"] as const) {
    for (const unit of ["km", "mi"] as const) {
      it(`${distance} in ${unit}`, () => {
        const plan = generateRacePlan(base({ distance, split_unit: unit }));
        const last = plan.splits[plan.splits.length - 1];
        expect(last.a_cumulative).toBe(plan.meta.goal_a);
        expect(last.b_cumulative).toBe(plan.meta.goal_b);
        expect(last.marker).toBe("Finish");
      });
    }
  }
});

describe("pacing shape", () => {
  it("opens slower than it finishes (full units)", () => {
    const plan = generateRacePlan(base({ distance: "marathon" }));
    const full = plan.splits.filter((r) => r.marker !== "Finish");
    const first = parseTimeToSeconds(full[0].a_split)!;
    const last = parseTimeToSeconds(full[full.length - 1].a_split)!;
    expect(first).toBeGreaterThan(last);
  });
  it("always marks exactly one decision point", () => {
    const plan = generateRacePlan(base());
    const decisions = plan.splits.filter((r) => r.note?.startsWith("Decision"));
    expect(decisions.length).toBe(1);
  });
});

describe("feasibility verdicts", () => {
  it("flags an ambitious goal", () => {
    const plan = generateRacePlan(
      base({ marker_distance: "10k", marker_time_s: 50 * 60, goal_a_s: 80 * 60, goal_b_s: 83 * 60 })
    );
    expect(plan.feasibility.verdict).toBe("ambitious");
  });
  it("flags a conservative goal", () => {
    const plan = generateRacePlan(
      base({ marker_distance: "10k", marker_time_s: 38 * 60, goal_a_s: 100 * 60, goal_b_s: 103 * 60 })
    );
    expect(plan.feasibility.verdict).toBe("conservative");
  });
});

describe("fuelling logic", () => {
  it("is not applicable for a fast 5k", () => {
    const plan = generateRacePlan(base({ distance: "5k", goal_a_s: 19 * 60, goal_b_s: 20 * 60 }));
    expect(plan.fuelling.applicable).toBe(false);
  });
  it("targets carbs for a marathon", () => {
    const plan = generateRacePlan(base({ distance: "marathon", goal_a_s: 210 * 60, goal_b_s: 220 * 60 }));
    expect(plan.fuelling.applicable).toBe(true);
    expect(plan.fuelling.carb_target_g_per_hr).toBeGreaterThanOrEqual(60);
  });
});

describe("protocols", () => {
  it("returns one protocol per struggle", () => {
    const plan = generateRacePlan(base({ struggles: ["fuelling", "recovery", "race_nerves"] }));
    expect(plan.protocols.length).toBe(3);
  });
  it("handles zero struggles", () => {
    const plan = generateRacePlan(base({ struggles: [] }));
    expect(plan.protocols.length).toBe(0);
  });
});

describe("house style", () => {
  it("contains no em or en dashes anywhere in the output", () => {
    const plan = generateRacePlan(base({ struggles: ["starts_too_fast", "fades_late", "fuelling"] }));
    const json = JSON.stringify(plan);
    expect(json.includes("\u2014")).toBe(false);
    expect(json.includes("\u2013")).toBe(false);
  });
  it("race week is the seven days before the race", () => {
    const plan = generateRacePlan(base());
    expect(plan.race_week.length).toBe(7);
    expect(plan.race_week[6].days_to_race).toBe(0);
  });
});
