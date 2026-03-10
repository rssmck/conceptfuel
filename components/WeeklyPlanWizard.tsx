"use client";
import { useState } from "react";
import Link from "next/link";
import type { TrainingGoal, TrainingStyle } from "@/lib/formEngine";
import { generateTrainingPlan } from "@/lib/weeklyPlanEngine";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

// ─── Option maps ──────────────────────────────────────────────────────────────

const TRAINING_GOALS: { value: TrainingGoal; label: string; desc: string }[] = [
  { value: "strength",     label: "Strength",        desc: "Heavy lifting. Low reps, high load, maximum force output." },
  { value: "hypertrophy",  label: "Build muscle",    desc: "Moderate load, higher volume. Size, fullness, progressive overload." },
  { value: "power",        label: "Power",           desc: "Explosive output. Sprinting, athletics, dynamic sports." },
  { value: "endurance_sc", label: "Endurance S&C",   desc: "Stabilising, functional, injury prevention. For runners, cyclists and endurance athletes." },
  { value: "plyo",         label: "Plyometrics",     desc: "Jump training. Reactive, ground contact, power endurance." },
  { value: "aesthetic",    label: "Lean and strong",  desc: "Shape, tone, functional composition. Glute development, muscle definition, full range of motion." },
  { value: "general",      label: "General fitness",  desc: "Balanced sessions, no single focus. Build a foundation and feel good moving." },
];

const TRAINING_STYLES: { value: TrainingStyle; label: string; desc: string }[] = [
  { value: "free_weights", label: "Free weights", desc: "Barbells, dumbbells, kettlebells" },
  { value: "machines",     label: "Machines",     desc: "Cables, plate-loaded, selectorised" },
  { value: "bodyweight",   label: "Bodyweight",   desc: "No equipment required" },
  { value: "mixed",        label: "Mixed",        desc: "Combination of all" },
];

const DAYS = [2, 3, 4, 5];
const BLOCK_WEEKS = [4, 6, 8];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const GOAL_LABELS: Record<string, string> = {
  strength: "Strength",
  hypertrophy: "Build muscle",
  power: "Power",
  endurance_sc: "Endurance S&C",
  plyo: "Plyometrics",
  aesthetic: "Lean and strong",
  general: "General fitness",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyPlanWizard() {
  const { user, openAuth } = useAuth();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<TrainingGoal | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [trainingStyle, setTrainingStyle] = useState<TrainingStyle | null>(null);
  const [blockWeeks, setBlockWeeks] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [startsOn, setStartsOn] = useState(nextMonday());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const goalLabel = goal ? (GOAL_LABELS[goal] ?? goal) : "";
  const effectiveName = planName.trim() || (goal ? `${goalLabel} block` : "");

  function toggleDay(day: string) {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function canContinue(): boolean {
    if (step === 0) return goal !== null;
    if (step === 1) return daysPerWeek !== null;
    if (step === 2) return trainingStyle !== null;
    if (step === 3) return blockWeeks !== null && startsOn.length > 0;
    return true;
  }

  async function handleSave() {
    if (!goal || !trainingStyle || !daysPerWeek || !blockWeeks || !user) return;
    setSaving(true);
    setSaveError(null);

    const plan = generateTrainingPlan({
      goal,
      training_style: trainingStyle,
      days_per_week: daysPerWeek,
      block_weeks: blockWeeks,
      starts_on: startsOn,
      name: effectiveName,
    });

    const supabase = createClient();
    const { error } = await supabase.from("training_plans").insert({
      user_id: user.id,
      name: plan.name,
      goal: plan.goal,
      training_style: plan.training_style,
      days_per_week: plan.days_per_week,
      block_weeks: plan.block_weeks,
      starts_on: plan.starts_on,
      active: true,
      sessions: plan.weeks,
    });

    if (error) {
      setSaveError("Something went wrong. Please try again.");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <p style={labelStyle}>concept<span style={{ color: "var(--text-muted)" }}>//</span>form · training plan</p>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "14px" }}>
          Plan saved.
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "28px" }}>
          Your {blockWeeks}-week plan is ready. Head to your profile to see this week&apos;s sessions and track your progress.
        </p>
        <Link
          href="/profile"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          View plan on profile →
        </Link>
      </div>
    );
  }

  // ── Wizard preview helper ──────────────────────────────────────────────────

  function renderWeek1Preview() {
    if (!goal || !trainingStyle || !daysPerWeek || !blockWeeks) return null;
    const plan = generateTrainingPlan({
      goal,
      training_style: trainingStyle,
      days_per_week: daysPerWeek,
      block_weeks: blockWeeks,
      starts_on: startsOn,
      name: effectiveName,
    });
    const week1 = plan.weeks[0];
    if (!week1) return null;
    return (
      <div style={{ marginTop: "20px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Week 1 preview · {week1.phase_name}
          </p>
        </div>
        {week1.sessions.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: i < week1.sessions.length - 1 ? "1px solid var(--border)" : undefined,
              background: "var(--surface)",
            }}
          >
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text)" }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{s.duration_minutes} min</p>
          </div>
        ))}
      </div>
    );
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  const STEPS = ["Goal", "Days", "Style", "Block", "Review"];

  return (
    <div style={{ maxWidth: "600px" }}>
      {/* Header */}
      <p style={labelStyle}>
        concept<span style={{ color: "var(--text-muted)" }}>//</span>form · training plan
      </p>
      <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "8px" }}>
        Build a training plan.
      </h1>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "32px" }}>
        Answer a few questions and get a structured {blockWeeks ?? "4, 6 or 8"}-week programme saved to your profile.
      </p>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              height: "3px",
              flex: 1,
              borderRadius: "2px",
              background: i <= step ? "var(--accent)" : "var(--border)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      {/* ── Step 0: Goal ──────────────────────────────────────────────────────── */}
      {step === 0 && (
        <div>
          <p style={labelStyle}>What is your goal?</p>
          <div style={cardGridStyle}>
            {TRAINING_GOALS.map((g) => (
              <OptionCard
                key={g.value}
                selected={goal === g.value}
                onClick={() => setGoal(g.value)}
                label={g.label}
                desc={g.desc}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step 1: Days per week ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <p style={labelStyle}>How many days per week?</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysPerWeek(d)}
                style={{
                  padding: "14px 20px",
                  background: daysPerWeek === d ? "transparent" : "var(--surface)",
                  border: daysPerWeek === d ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: daysPerWeek === d ? "var(--accent)" : "var(--text)",
                  minWidth: "56px",
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <p style={{ ...labelStyle, marginBottom: "10px" }}>Preferred days (optional)</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
            {DAY_NAMES.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                style={{
                  padding: "6px 14px",
                  background: preferredDays.includes(day) ? "var(--accent)" : "var(--surface)",
                  border: preferredDays.includes(day) ? "1px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: preferredDays.includes(day) ? "var(--bg)" : "var(--text-muted)",
                }}
              >
                {day}
              </button>
            ))}
          </div>
          {daysPerWeek && preferredDays.length > 0 && preferredDays.length !== daysPerWeek && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
              Select {daysPerWeek} days to match your weekly plan, or leave blank.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Training style ────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <p style={labelStyle}>Training style</p>
          <div style={cardGridStyle}>
            {TRAINING_STYLES.map((s) => (
              <OptionCard
                key={s.value}
                selected={trainingStyle === s.value}
                onClick={() => setTrainingStyle(s.value)}
                label={s.label}
                desc={s.desc}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Block ─────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <p style={labelStyle}>Block length</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
            {BLOCK_WEEKS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setBlockWeeks(w)}
                style={{
                  padding: "14px 20px",
                  background: blockWeeks === w ? "transparent" : "var(--surface)",
                  border: blockWeeks === w ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: blockWeeks === w ? "var(--accent)" : "var(--text)",
                  minWidth: "56px",
                }}
              >
                {w} wk
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Plan name</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder={goal ? `e.g. ${goalLabel} block` : "e.g. Spring strength block"}
              style={{
                width: "100%",
                fontSize: "13px",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Start date</label>
            <input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
              style={{
                fontSize: "13px",
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Review & save ─────────────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <p style={labelStyle}>Review your plan</p>

          <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "24px" }}>
            {[
              { label: "Plan name", value: effectiveName },
              { label: "Goal", value: goalLabel },
              { label: "Training style", value: trainingStyle ? TRAINING_STYLES.find(s => s.value === trainingStyle)?.label : "" },
              { label: "Days per week", value: daysPerWeek ? `${daysPerWeek} days` : "" },
              { label: "Block length", value: blockWeeks ? `${blockWeeks} weeks` : "" },
              { label: "Starts", value: startsOn ? new Date(startsOn + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "" },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "12px",
                  padding: "11px 16px",
                  background: "var(--surface)",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{row.value}</p>
              </div>
            ))}
          </div>

          {renderWeek1Preview()}

          <div style={{ marginTop: "28px" }}>
            {!user ? (
              <div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Sign in to save your plan to your profile.
                </p>
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  style={{
                    padding: "12px 24px",
                    background: "var(--accent)",
                    color: "var(--bg)",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Sign in to save →
                </button>
              </div>
            ) : (
              <div>
                {saveError && (
                  <p style={{ fontSize: "12px", color: "var(--error, #e05555)", marginBottom: "10px" }}>{saveError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "12px 28px",
                    background: "var(--accent)",
                    color: "var(--bg)",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Saving…" : "Save plan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "36px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "13px",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Back
          </button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue()}
            style={{
              padding: "10px 24px",
              background: canContinue() ? "var(--accent)" : "var(--surface)",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
              color: canContinue() ? "var(--bg)" : "var(--text-muted)",
              cursor: canContinue() ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
