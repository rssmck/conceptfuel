"use client";
import { useState } from "react";
import Link from "next/link";
import { generateRunPlan } from "@/lib/runEngine";
import type {
  RunPlanInput,
  RunTier,
  GoalRace,
  ElevationProfile,
  TrainingApproach,
  RunPlanTemplate,
} from "@/lib/runEngine";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

// ─── Option maps ──────────────────────────────────────────────────────────────

const TIER_OPTIONS: { value: RunTier; label: string; desc: string }[] = [
  { value: 1, label: "start",       desc: "First steps. Build the running habit and complete your goal. No numbers, just movement." },
  { value: 2, label: "build",       desc: "Structure your training. Build mileage, hit a goal time, nail your first or next race." },
  { value: 3, label: "club",        desc: "Competitive training. Race-specific sessions, time targets, structured quality work." },
  { value: 4, label: "performance", desc: "Data-driven, structured and precise. Double threshold, VO\u2082 work, neuromuscular sessions and full periodisation." },
];

const GOAL_RACE_OPTIONS: { value: GoalRace; label: string; desc: string }[] = [
  { value: "parkrun",  label: "Parkrun \u00b7 5k",   desc: "Saturday morning. Community, consistency and a weekly benchmark. Post-run coffee optional but encouraged." },
  { value: "5k",       label: "5k",              desc: "Speed, power and race sharpness." },
  { value: "10k",      label: "10k",             desc: "The sweet spot of speed and endurance." },
  { value: "half",     label: "Half marathon",   desc: "21.1 km. Endurance meets speed." },
  { value: "marathon", label: "Marathon",        desc: "42.2 km. The full test." },
  { value: "ultra",    label: "Ultra",           desc: "Beyond the marathon." },
  { value: "fitness",  label: "Just run",        desc: "No race. Build fitness and enjoy it." },
];

const ELEVATION_OPTIONS: { value: ElevationProfile; label: string }[] = [
  { value: "flat",       label: "Flat" },
  { value: "undulating", label: "Undulating" },
  { value: "hilly",      label: "Hilly" },
  { value: "mountain",   label: "Mountain" },
];

const APPROACH_OPTIONS: { value: TrainingApproach; label: string; desc: string }[] = [
  {
    value: "standard",
    label: "Standard",
    desc: "Periodised quality sessions based on Jack Daniels principles. Tempo, threshold, intervals and neuromuscular work.",
  },
  {
    value: "norwegian",
    label: "Norwegian",
    desc: "Sub-threshold emphasis. Double threshold sessions, high aerobic volume below LT2. For athletes who respond well to volume over intensity.",
  },
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RACE_DISTANCES = ["5k", "10k", "half", "marathon"];

const RACE_LABELS: Record<GoalRace, string> = {
  parkrun: "parkrun", "5k": "5k", "10k": "10k", half: "half marathon",
  marathon: "marathon", ultra: "ultra", fitness: "fitness",
};

const TIER_NAMES: Record<RunTier, string> = {
  1: "start", 2: "build", 3: "club", 4: "performance",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

function getPlanWeeksPreview(goalRace: GoalRace, raceDateStr?: string, startsOn?: string): number {
  if (raceDateStr && startsOn) {
    const weeks = Math.floor(
      (new Date(raceDateStr).getTime() - new Date(startsOn).getTime()) / (7 * 24 * 3600 * 1000)
    );
    return Math.min(Math.max(weeks, 4), 20);
  }
  const defaults: Record<GoalRace, number> = {
    parkrun: 6, "5k": 8, "10k": 10, half: 12, marathon: 16, ultra: 18, fitness: 8,
  };
  return defaults[goalRace];
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "12px",
  display: "block",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "8px",
  marginBottom: "24px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "var(--text)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const noteStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
  marginTop: "6px",
  lineHeight: 1.5,
};

// ─── OptionCard ───────────────────────────────────────────────────────────────

function OptionCard({
  selected,
  onClick,
  label,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "14px 16px",
        background: selected ? "transparent" : "var(--surface)",
        border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "6px",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.12s, background 0.12s",
      }}
    >
      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: selected ? "var(--accent)" : "var(--text)",
          margin: 0,
          marginBottom: desc ? "4px" : 0,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </p>
      {desc && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          {desc}
        </p>
      )}
    </button>
  );
}

// ─── PillButton ───────────────────────────────────────────────────────────────

function PillButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        background: selected ? "var(--accent)" : "var(--surface)",
        border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "20px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: selected ? 700 : 400,
        color: selected ? "var(--bg)" : "var(--text)",
        transition: "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RunPage() {
  const { user, openAuth } = useAuth();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep]             = useState(0);

  // Step 0 — tier
  const [tier, setTier]             = useState<RunTier | null>(null);

  // Step 1 — goal
  const [goalRace, setGoalRace]     = useState<GoalRace | null>(null);
  const [raceDate, setRaceDate]     = useState("");
  const [targetTime, setTargetTime] = useState("");
  const [elevation, setElevation]   = useState<ElevationProfile>("flat");

  // Step 2 — fitness
  const [tier1Range, setTier1Range] = useState<string | null>(null);
  const [weeklyKm, setWeeklyKm]     = useState<string>("");
  const [longestKm, setLongestKm]   = useState<string>("");
  const [recentDist, setRecentDist] = useState<string>("");
  const [recentTime, setRecentTime] = useState<string>("");
  const [ltPace, setLtPace]         = useState<string>("");
  const [vo2max, setVo2max]         = useState<string>("");

  // Step 3 — your week
  const [daysPerWeek, setDaysPerWeek]       = useState<number | null>(null);
  const [availableDays, setAvailableDays]   = useState<string[]>([]);
  const [hasClub, setHasClub]               = useState<boolean | null>(null);
  const [clubNight, setClubNight]           = useState<string>("");
  const [clubSessionType, setClubSessionType] = useState<string>("");
  const [gymAccess, setGymAccess]           = useState(false);
  const [includeStrength, setIncludeStrength] = useState(false);
  const [includeMobility, setIncludeMobility] = useState(false);

  // Step 4 — approach (tiers 3-4 only)
  const [approach, setApproach]     = useState<TrainingApproach>("standard");

  // Review / save
  const [planName, setPlanName]     = useState("");
  const [startsOn, setStartsOn]     = useState(nextMonday());
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [savedPlan, setSavedPlan]   = useState<RunPlanTemplate | null>(null);

  // ── Steps ─────────────────────────────────────────────────────────────────
  const STEPS = tier !== null && tier >= 3
    ? ["Level", "Goal", "Fitness", "Your week", "Approach", "Review"]
    : ["Level", "Goal", "Fitness", "Your week", "Review"];

  const totalSteps = STEPS.length;

  function toggleDay(day: string) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function canContinue(): boolean {
    if (step === 0) return tier !== null;
    if (step === 1) return goalRace !== null;
    if (step === 2) {
      if (tier === 1) return tier1Range !== null;
      return weeklyKm.trim() !== "";
    }
    if (step === 3) return daysPerWeek !== null;
    if (step === 4 && tier !== null && tier >= 3) return true; // approach always has a default
    return true;
  }

  function getReviewStep(): number {
    return tier !== null && tier >= 3 ? 5 : 4;
  }

  function handleNext() {
    if (!canContinue()) return;
    // Skip approach step for tiers 1-2
    if (step === 3 && (tier === null || tier < 3)) {
      setStep(getReviewStep());
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step === getReviewStep() && (tier === null || tier < 3)) {
      setStep(3);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  }

  // Derive the display step index for the progress bar
  function displayStepIndex(): number {
    if (step === getReviewStep()) return totalSteps - 1;
    return step;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!tier || !goalRace || !daysPerWeek || !user) return;
    if (!user) { openAuth(); return; }
    setSaving(true);
    setSaveError(null);

    const effectiveName =
      planName.trim() ||
      `${RACE_LABELS[goalRace]} \u00b7 ${TIER_NAMES[tier as RunTier]}`;

    const input: RunPlanInput = {
      tier: tier as RunTier,
      goal_race: goalRace,
      race_date: raceDate || undefined,
      target_time: targetTime || undefined,
      elevation_profile: elevation,
      weekly_km: weeklyKm ? Number(weeklyKm) : undefined,
      longest_recent_km: longestKm ? Number(longestKm) : undefined,
      recent_race_distance: recentDist || undefined,
      recent_race_time: recentTime || undefined,
      lt_pace: ltPace || undefined,
      vo2max: vo2max ? Number(vo2max) : undefined,
      days_per_week: daysPerWeek,
      available_days: availableDays,
      club_night: hasClub && clubNight ? clubNight : undefined,
      club_session_type: hasClub && clubSessionType ? clubSessionType : undefined,
      gym_access: gymAccess,
      include_strength: includeStrength,
      include_mobility: includeMobility,
      training_approach: approach,
      starts_on: startsOn,
      name: effectiveName,
    };

    const plan = generateRunPlan(input);
    setSavedPlan(plan);

    const supabase = createClient();
    const { error } = await supabase.from("run_plans").insert({
      user_id: user.id,
      name: plan.name,
      tier: plan.tier,
      goal_race: input.goal_race,
      race_date: input.race_date || null,
      target_time: input.target_time || null,
      elevation_profile: input.elevation_profile,
      weekly_km: input.weekly_km || null,
      longest_recent_km: input.longest_recent_km || null,
      recent_race_distance: input.recent_race_distance || null,
      recent_race_time: input.recent_race_time || null,
      lt_pace: input.lt_pace || null,
      vo2max: input.vo2max || null,
      days_per_week: input.days_per_week,
      available_days: input.available_days,
      club_night: input.club_night || null,
      club_session_type: input.club_session_type || null,
      gym_access: input.gym_access,
      include_strength: input.include_strength,
      include_mobility: input.include_mobility,
      training_approach: input.training_approach,
      training_zones: plan.training_zones || null,
      vdot: plan.vdot || null,
      weeks: plan.weeks,
      plan_weeks: plan.plan_weeks,
      starts_on: startsOn,
      active: true,
    });

    if (error) {
      setSaveError("Something went wrong. Please try again.");
      setSavedPlan(null);
    }
    setSaving(false);
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (savedPlan) {
    const zones = savedPlan.training_zones;
    const week1 = savedPlan.weeks[0];

    return (
      <div className="cf-page-narrow"><div style={{ maxWidth: "640px" }}>
        <p style={labelStyle}>
          concept<span style={{ color: "var(--text-muted)" }}>//</span>run · plan saved
        </p>

        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            marginBottom: "6px",
          }}
        >
          {savedPlan.name}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "28px" }}>
          {savedPlan.plan_weeks}-week plan · {TIER_NAMES[savedPlan.tier]} tier
          {savedPlan.vdot ? ` · VDOT ${savedPlan.vdot}` : ""}
        </p>

        {zones && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <p style={{ ...labelStyle, marginBottom: "16px" }}>training zones</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {(
                  [
                    ["Easy",      zones.easy],
                    ["Tempo",     zones.tempo],
                    ["Threshold", zones.threshold],
                    ["Interval",  zones.interval],
                    ["Rep",       zones.rep],
                  ] as [string, string][]
                ).map(([zone, pace]) => (
                  <tr key={zone}>
                    <td
                      style={{
                        padding: "6px 0",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {zone}
                    </td>
                    <td
                      style={{
                        padding: "6px 0",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--accent)",
                        textAlign: "right",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {pace}/km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {week1 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <p style={{ ...labelStyle, marginBottom: "16px" }}>
              week 1 preview · {week1.phase}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
              {week1.phase_note}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {week1.sessions.slice(0, 3).map((session, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: "2px solid var(--accent)",
                    paddingLeft: "14px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      margin: 0,
                      marginBottom: "4px",
                      color: "var(--text)",
                    }}
                  >
                    {session.label}
                    {session.target_km ? (
                      <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                        {session.target_km} km
                      </span>
                    ) : null}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    {session.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/profile"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "var(--accent)",
              color: "var(--bg)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            View profile
          </Link>
          <button
            type="button"
            onClick={() => alert("Download plan card — canvas export coming soon.")}
            style={{
              padding: "10px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "var(--text)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Download plan card
          </button>
        </div>
      </div></div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────

  const stepIndex = displayStepIndex();

  return (
    <div className="cf-page-narrow">
    <div style={{ maxWidth: "640px" }}>
      <p style={labelStyle}>
        concept<span style={{ color: "var(--text-muted)" }}>//</span>run
      </p>

      {/* Progress bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "32px",
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: i <= stepIndex ? "var(--accent)" : "var(--border)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* Step label */}
      <p style={{ ...labelStyle, marginBottom: "20px" }}>
        {STEPS[stepIndex]} · step {stepIndex + 1} of {totalSteps}
      </p>

      {/* ── Step 0: Tier ── */}
      {step === 0 && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Choose your level
          </h2>
          <div style={cardGridStyle}>
            {TIER_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                selected={tier === opt.value}
                onClick={() => setTier(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Step 1: Goal race ── */}
      {step === 1 && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            What are you training for?
          </h2>

          <div style={cardGridStyle}>
            {GOAL_RACE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                selected={goalRace === opt.value}
                onClick={() => setGoalRace(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </div>

          {goalRace && goalRace !== "fitness" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Race date (optional)</label>
              <input
                type="date"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          {tier !== null && tier >= 2 && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Target time (optional, e.g. 22:30)</label>
              <input
                type="text"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                placeholder="e.g. 22:30"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: "8px" }}>
            <label style={labelStyle}>Elevation profile</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {ELEVATION_OPTIONS.map((opt) => (
                <PillButton
                  key={opt.value}
                  selected={elevation === opt.value}
                  onClick={() => setElevation(opt.value)}
                  label={opt.label}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Step 2: Fitness ── */}
      {step === 2 && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Where are you right now?
          </h2>

          {tier === 1 ? (
            <>
              <label style={labelStyle}>How far can you run without stopping?</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                {["< 1 km", "1–3 km", "3–5 km", "5 km+"].map((opt) => (
                  <PillButton
                    key={opt}
                    selected={tier1Range === opt}
                    onClick={() => setTier1Range(opt)}
                    label={opt}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Current weekly distance (km)</label>
                <input
                  type="number"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(e.target.value)}
                  placeholder="e.g. 35"
                  min={0}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Longest run in the last 4 weeks (km)</label>
                <input
                  type="number"
                  value={longestKm}
                  onChange={(e) => setLongestKm(e.target.value)}
                  placeholder="e.g. 18"
                  min={0}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Recent race (optional)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={recentDist}
                    onChange={(e) => setRecentDist(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">Distance</option>
                    {RACE_DISTANCES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={recentTime}
                    onChange={(e) => setRecentTime(e.target.value)}
                    placeholder="e.g. 48:30"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              </div>

              {tier !== null && tier >= 3 && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>LT pace (optional)</label>
                  <input
                    type="text"
                    value={ltPace}
                    onChange={(e) => setLtPace(e.target.value)}
                    placeholder="e.g. 4:45"
                    style={inputStyle}
                  />
                  <p style={noteStyle}>
                    Your lactate threshold pace per km. Leave blank to estimate from race time.
                  </p>
                </div>
              )}

              {tier !== null && tier >= 4 && (
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>VO\u2082max (optional)</label>
                  <input
                    type="number"
                    value={vo2max}
                    onChange={(e) => setVo2max(e.target.value)}
                    placeholder="e.g. 52"
                    min={20}
                    max={90}
                    style={inputStyle}
                  />
                  <p style={noteStyle}>
                    Known VO\u2082max. We'll generate a field test if you'd prefer.
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Step 3: Your week ── */}
      {step === 3 && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Your week
          </h2>

          {/* Days per week */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>How many days per week?</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[2, 3, 4, 5].map((d) => (
                <PillButton
                  key={d}
                  selected={daysPerWeek === d}
                  onClick={() => setDaysPerWeek(d)}
                  label={String(d)}
                />
              ))}
            </div>
          </div>

          {/* Which days */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Which days?</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {DAY_NAMES.map((day) => (
                <PillButton
                  key={day}
                  selected={availableDays.includes(day)}
                  onClick={() => toggleDay(day)}
                  label={day}
                />
              ))}
            </div>
          </div>

          {/* Club */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Do you run with a club?</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <PillButton selected={hasClub === true}  onClick={() => setHasClub(true)}  label="Yes" />
              <PillButton selected={hasClub === false} onClick={() => { setHasClub(false); setClubNight(""); setClubSessionType(""); }} label="No" />
            </div>
          </div>

          {hasClub && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Which night?</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {DAY_NAMES.map((day) => (
                    <PillButton
                      key={day}
                      selected={clubNight === day}
                      onClick={() => setClubNight(day)}
                      label={day}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>What type of session?</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["Track", "Road tempo", "Mixed / varies"].map((type) => (
                    <PillButton
                      key={type}
                      selected={clubSessionType === type}
                      onClick={() => setClubSessionType(type)}
                      label={type}
                    />
                  ))}
                </div>
              </div>

              <p style={noteStyle}>
                We'll build your plan around club sessions and provide alternatives for weeks when the session doesn't suit your phase.
              </p>
            </div>
          )}

          {/* Gym access */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Gym access</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <PillButton selected={gymAccess === true}  onClick={() => setGymAccess(true)}  label="I have gym access" />
              <PillButton selected={gymAccess === false} onClick={() => setGymAccess(false)} label="No gym" />
            </div>
          </div>

          {gymAccess && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Include strength sessions?</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <PillButton selected={includeStrength === true}  onClick={() => setIncludeStrength(true)}  label="Yes" />
                <PillButton selected={includeStrength === false} onClick={() => setIncludeStrength(false)} label="No" />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "8px" }}>
            <label style={labelStyle}>Include mobility sessions?</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <PillButton selected={includeMobility === true}  onClick={() => setIncludeMobility(true)}  label="Yes" />
              <PillButton selected={includeMobility === false} onClick={() => setIncludeMobility(false)} label="No" />
            </div>
          </div>
        </>
      )}

      {/* ── Step 4: Approach (tiers 3-4 only) ── */}
      {step === 4 && tier !== null && tier >= 3 && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Training approach
          </h2>
          <div style={cardGridStyle}>
            {APPROACH_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.value}
                selected={approach === opt.value}
                onClick={() => setApproach(opt.value)}
                label={opt.label}
                desc={opt.desc}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Review step ── */}
      {step === getReviewStep() && goalRace && tier && daysPerWeek && (
        <>
          <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Review your plan
          </h2>

          {/* Plan name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Plan name</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={`${RACE_LABELS[goalRace]} \u00b7 ${TIER_NAMES[tier as RunTier]}`}
              style={inputStyle}
            />
          </div>

          {/* Summary card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <p style={{ ...labelStyle, marginBottom: "16px" }}>plan summary</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {(
                  [
                    ["Goal race",    RACE_LABELS[goalRace]],
                    ["Level",        TIER_NAMES[tier as RunTier]],
                    ["Days/week",    String(daysPerWeek)],
                    ["Elevation",    elevation],
                    ["Approach",     approach],
                    ["Plan length",  `${getPlanWeeksPreview(goalRace, raceDate || undefined, startsOn)} weeks`],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <tr key={k}>
                    <td
                      style={{
                        padding: "7px 0",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {k}
                    </td>
                    <td
                      style={{
                        padding: "7px 0",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text)",
                        textAlign: "right",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Start date */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Start date</label>
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              style={inputStyle}
            />
          </div>

          {saveError && (
            <p style={{ fontSize: "13px", color: "var(--accent)", marginBottom: "16px" }}>
              {saveError}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              if (!user) { openAuth(); return; }
              handleSave();
            }}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--accent)",
              color: "var(--bg)",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 0.12s",
            }}
          >
            {saving ? "Saving..." : "Save plan"}
          </button>
        </>
      )}

      {/* ── Navigation ── */}
      {step !== getReviewStep() && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "32px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "13px",
              color: step === 0 ? "var(--text-muted)" : "var(--text)",
              cursor: step === 0 ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue()}
            style={{
              padding: "10px 20px",
              background: canContinue() ? "var(--accent)" : "var(--surface)",
              border: canContinue() ? "none" : "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 700,
              color: canContinue() ? "var(--bg)" : "var(--text-muted)",
              cursor: canContinue() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
          >
            Continue &rarr;
          </button>
        </div>
      )}

      {step === getReviewStep() && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "10px 18px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "13px",
              color: "var(--text)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
