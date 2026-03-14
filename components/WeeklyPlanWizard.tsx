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
  { value: "aesthetic",    label: "Aesthetic & strong",  desc: "Shape, lean definition, functional composition. Proportion, tone, full range of motion." },
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
  aesthetic: "Aesthetic & strong",
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

// ─── Fuel notes ───────────────────────────────────────────────────────────────

const FUEL_NOTES: Record<string, { preSession: string; inSession: string; postSession: string; raceDay?: string; notes?: string }> = {
  strength: {
    preSession: "2–3 hrs before: 40–60g carbs + 25–35g protein. Oats with milk, chicken and rice, or Greek yoghurt with fruit.",
    inSession: "Water only for sessions under 75 min. Longer sessions: 20–30g carbs/hr via fruit, dates or intra-workout drink.",
    postSession: "Within 30 min: 30–40g protein + 40–60g fast carbs. Shake with banana, or chicken, rice and veg.",
  },
  hypertrophy: {
    preSession: "2 hrs before: 40–70g carbs + 20–30g protein. Sufficient glycogen is essential for volume training.",
    inSession: "Sip water throughout. Sessions over 90 min: 20–30g carbs/hr to maintain output.",
    postSession: "Within 30 min: 40g protein + 60–80g carbs. Prioritise leucine-rich sources: whey, eggs, meat.",
  },
  endurance_sc: {
    preSession: "2–3 hrs before: 60–80g carbs, moderate protein. For sessions over 90 min, load glycogen the night before too.",
    inSession: "60g carbs/hr for sessions over 60 min. Every 20 min: 1 gel or 500ml sports drink. Practise gut tolerance in training.",
    postSession: "Within 30 min: 30–40g protein + 60–80g carbs. Electrolytes if sweating heavily.",
    raceDay: "3 hrs pre-race: 80–120g carbs, low fibre. 30–45 min pre: 25g fast carbs (gel or banana). On course: 60–90g carbs/hr from the gun — every 20 min, consistent intake from early on.",
    notes: "Start practising race-day fuelling in training. Your gut adapts to taking on carbs while running — this takes weeks of consistent practice.",
  },
  power: {
    preSession: "2 hrs before: 50–60g carbs, low fibre. If using creatine, take with your pre-session meal.",
    inSession: "Water and electrolytes. Sessions over 60 min: 20–30g carbs to sustain explosive output.",
    postSession: "Within 30 min: 35–50g protein + 40–60g fast carbs. Creatine post-session is optimal timing if supplementing.",
  },
  plyo: {
    preSession: "2–3 hrs before: 50–70g carbs, moderate protein, low fibre. Hydration is critical for reactive ability.",
    inSession: "Water. Plyometric sessions are typically short — no in-session fuelling needed.",
    postSession: "Within 30 min: 30–40g protein + 50g carbs. Include anti-inflammatory foods: berries, oily fish.",
  },
  aesthetic: {
    preSession: "1.5–2 hrs before: 30–50g carbs + 20–25g protein. Moderate deficit is fine — avoid training fully fasted.",
    inSession: "Water. Sessions under 75 min need no in-session fuel. Electrolytes if sweating.",
    postSession: "Immediately after: 30–40g protein. Carb intake depends on deficit — 30–50g in moderate deficit.",
  },
  general: {
    preSession: "1.5–2 hrs before: 30–50g carbs + 20g protein. Don't train hungry — it impacts output and recovery.",
    inSession: "Water throughout. For sessions over 60 min: 20–30g carbs optional.",
    postSession: "Within 60 min: 25–35g protein + 40–60g carbs. Any balanced meal works well.",
  },
  mobility: {
    preSession: "1–2 hrs before: light snack, 20–30g carbs + 10–15g protein. Don't practise on a full stomach.",
    inSession: "Water throughout. No additional fuel needed for mobility and yoga sessions.",
    postSession: "1–2 hrs after: 20–30g protein to support tissue repair. Consistent hydration supports joint mobility.",
    notes: "Consistent hydration across the day supports joint mobility and tissue elasticity.",
  },
};

// ─── Nutrition goal step ──────────────────────────────────────────────────────

const NUTRITION_GOALS = [
  { value: "build",    label: "Build & gain",  desc: "Calorie surplus. Support muscle growth and performance gains." },
  { value: "maintain", label: "Maintain",      desc: "Match your output. Perform at your best, no composition change." },
  { value: "lean",     label: "Lean out",      desc: "Modest deficit. Reduce body fat while preserving muscle." },
] as const;

type NutritionGoal = typeof NUTRITION_GOALS[number]["value"];

function calcMacros(weightKg: number, nutritionGoal: NutritionGoal, daysPerWeek: number) {
  const activityMult = daysPerWeek <= 2 ? 1.375 : daysPerWeek <= 3 ? 1.55 : 1.725;
  const tdee = Math.round(weightKg * 22 * activityMult);
  const adjust = nutritionGoal === "build" ? 350 : nutritionGoal === "lean" ? -350 : 0;
  const calories = tdee + adjust;
  const proteinPerKg = nutritionGoal === "lean" ? 2.4 : 2.0;
  const protein = Math.round(weightKg * proteinPerKg);
  const remaining = calories - protein * 4;
  const carbRatio = nutritionGoal === "build" ? 0.55 : nutritionGoal === "lean" ? 0.35 : 0.45;
  const carbs = Math.round((remaining * carbRatio) / 4);
  const fat  = Math.round((remaining * (1 - carbRatio)) / 9);
  return { calories, protein, carbs, fat };
}

// ─── Plan card canvas ─────────────────────────────────────────────────────────

function getPlanCanvasTheme() {
  const t = typeof localStorage !== "undefined" ? (localStorage.getItem("cf_theme") ?? "dark") : "dark";
  const themes = {
    dark:  { bg: "#0a0a0a", surface: "#111111", surface2: "#1a1a1a", border: "#2a2a2a", text: "#f0f0f0", muted: "#888888", dimmed: "#555555", grid: "rgba(255,255,255,0.04)", accent: "#c8ff00" },
    light: { bg: "#f5f2ed", surface: "#ede9e3", surface2: "#e5e0d9", border: "#ccc8c0", text: "#1a1714", muted: "#7a7570", dimmed: "#999999", grid: "rgba(0,0,0,0.03)", accent: "#4a7c00" },
    sage:  { bg: "#edf0eb", surface: "#e3e7de", surface2: "#d7dcd1", border: "#b4bcac", text: "#1c2418", muted: "#627060", dimmed: "#8a9e88", grid: "rgba(0,0,0,0.03)", accent: "#3d6b34" },
    mocha: { bg: "#f2ede6", surface: "#e8e0d5", surface2: "#ddd4c5", border: "#c2b4a0", text: "#2c1f14", muted: "#7d6858", dimmed: "#a09080", grid: "rgba(0,0,0,0.03)", accent: "#7c4a1e" },
  };
  return themes[t as keyof typeof themes] ?? themes.dark;
}

function buildPlanCardCanvas(
  plan: import("@/lib/weeklyPlanEngine").TrainingPlanTemplate,
  goalLabel: string
): HTMLCanvasElement {
  const W = 1080;
  const H = 1920;
  const M = 80;
  const CONTENT_W = W - M * 2;
  const FONT = "'ui-monospace', 'Cascadia Code', 'Fira Mono', monospace";
  const T = getPlanCanvasTheme();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  function wrapLines(text: string, font: string, maxW: number): string[] {
    ctx.font = font;
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW) { if (line) lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // Background
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 90) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 90) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  const rule = (y: number) => {
    ctx.strokeStyle = T.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  };

  let y = 100;

  // Brand
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = T.text; ctx.fillText("concept", M, y);
  ctx.fillStyle = T.muted; ctx.fillText("//", M + ctx.measureText("concept").width, y);
  ctx.fillStyle = T.text; ctx.fillText("form", M + ctx.measureText("concept//").width, y);
  const tag = `TRAINING PLAN · ${plan.block_weeks} WEEKS`;
  ctx.font = `12px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.textAlign = "right"; ctx.fillText(tag, W - M, y); ctx.textAlign = "left";

  y += 30; rule(y); y += 70;

  // Plan name hero
  ctx.font = `14px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.fillText("TRAINING BLOCK", M, y); y += 52;

  const heroLines = wrapLines(plan.name, `bold 60px ${FONT}`, CONTENT_W);
  ctx.font = `bold 60px ${FONT}`; ctx.fillStyle = T.text;
  for (const line of heroLines) { ctx.fillText(line, M, y); y += 72; }
  y += 8;

  ctx.font = `20px ${FONT}`; ctx.fillStyle = T.muted;
  ctx.fillText(goalLabel, M, y); y += 56;

  rule(y); y += 48;

  // Plan details grid
  const detailRows = [
    { label: "GOAL", value: goalLabel },
    { label: "TRAINING STYLE", value: plan.training_style.replace("_", " ") },
    { label: "DAYS PER WEEK", value: `${plan.days_per_week} days` },
    { label: "BLOCK LENGTH", value: `${plan.block_weeks} weeks` },
  ];
  ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.fillText("PLAN OVERVIEW", M, y); y += 16; rule(y); y += 28;

  detailRows.forEach((row, i) => {
    ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
    ctx.fillRect(M, y - 6, CONTENT_W, 46);
    ctx.font = `11px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.fillText(row.label, M + 16, y + 12);
    ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = T.text;
    ctx.textAlign = "right"; ctx.fillText(row.value.toUpperCase(), W - M - 16, y + 16);
    ctx.textAlign = "left"; y += 50;
  });

  y += 20; rule(y); y += 48;

  // Week 1 sessions
  const week1 = plan.weeks[0];
  if (week1) {
    ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.fillText(`WEEK 1 · ${week1.phase_name.toUpperCase()}`, M, y); y += 16; rule(y); y += 20;

    week1.sessions.forEach((s, i) => {
      ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
      ctx.fillRect(M, y, CONTENT_W, 52);
      ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = T.text;
      ctx.fillText(s.label, M + 16, y + 32);
      ctx.font = `13px ${FONT}`; ctx.fillStyle = T.muted;
      ctx.textAlign = "right"; ctx.fillText(`${s.duration_minutes} min`, W - M - 16, y + 32);
      ctx.textAlign = "left"; y += 56;
    });

    // Phase note
    if (week1.phase_note) {
      y += 12;
      const noteLines = wrapLines(week1.phase_note, `13px ${FONT}`, CONTENT_W - 24);
      ctx.font = `13px ${FONT}`; ctx.fillStyle = T.muted;
      noteLines.forEach(l => { ctx.fillText(l, M + 8, y); y += 24; });
    }
  }

  y += 28; rule(y); y += 48;

  // Fuel notes
  const fuel = FUEL_NOTES[plan.goal];
  if (fuel) {
    ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.fillText("FUEL PROTOCOL", M, y); y += 16; rule(y); y += 20;

    const fuelRows = [
      { label: "PRE-SESSION", text: fuel.preSession },
      { label: "IN-SESSION", text: fuel.inSession },
      { label: "POST-SESSION", text: fuel.postSession },
      ...(fuel.raceDay ? [{ label: "RACE DAY", text: fuel.raceDay }] : []),
    ];

    fuelRows.forEach((row, i) => {
      const textLines = wrapLines(row.text, `13px ${FONT}`, CONTENT_W - 32);
      const rowH = 28 + textLines.length * 22 + 20;
      ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
      ctx.fillRect(M, y, CONTENT_W, rowH);
      ctx.font = `10px ${FONT}`; ctx.fillStyle = T.dimmed;
      ctx.fillText(row.label, M + 16, y + 18);
      ctx.font = `13px ${FONT}`; ctx.fillStyle = T.muted;
      let ty = y + 36;
      textLines.forEach(l => { ctx.fillText(l, M + 16, ty); ty += 22; });
      y += rowH + 4;
    });
  }

  // Footer
  const footerY = H - 80;
  rule(footerY);
  ctx.font = `13px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.fillText("conceptclub.co.uk/form", M, footerY + 36);
  ctx.textAlign = "right"; ctx.fillText("concept//form", W - M, footerY + 36);
  ctx.textAlign = "left";

  return canvas;
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
  const [savedPlan, setSavedPlan] = useState<import("@/lib/weeklyPlanEngine").TrainingPlanTemplate | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(1);
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [bodyWeight, setBodyWeight]       = useState<number | null>(null);

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

    setSavedPlan(plan);

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
      setSavedPlan(null);
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (saved && savedPlan) {
    const fuel = FUEL_NOTES[savedPlan.goal];

    const handleDownloadCard = async () => {
      setDownloadingCard(true);
      try {
        const canvas = buildPlanCardCanvas(savedPlan, goalLabel);
        const link = document.createElement("a");
        link.download = "concept-form-training-plan.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
      } finally {
        setDownloadingCard(false);
      }
    };

    return (
      <div style={{ maxWidth: "640px" }}>
        <p style={labelStyle}>concept<span style={{ color: "var(--text-muted)" }}>//</span>form · training plan</p>

        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "6px" }}>
          {savedPlan.name}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "28px" }}>
          {goalLabel} · {savedPlan.training_style.replace("_", " ")} · {savedPlan.block_weeks} weeks · {savedPlan.days_per_week} days/week
        </p>

        {/* Download card */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "36px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleDownloadCard}
            disabled={downloadingCard}
            style={{
              padding: "10px 20px", background: "var(--accent)", color: "var(--bg)",
              border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", opacity: downloadingCard ? 0.7 : 1,
            }}
          >
            {downloadingCard ? "Generating…" : "Download plan card"}
          </button>
          <Link
            href="/profile"
            style={{
              padding: "10px 20px", background: "none", border: "1px solid var(--border)",
              borderRadius: "4px", fontSize: "13px", color: "var(--text-muted)",
              textDecoration: "none", display: "inline-block",
            }}
          >
            View on profile →
          </Link>
        </div>

        {/* All weeks */}
        <p style={{ ...labelStyle, marginBottom: "12px" }}>Full programme</p>
        <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "36px" }}>
          {savedPlan.weeks.map((week) => {
            const isOpen = expandedWeek === week.week_number;
            return (
              <div key={week.week_number} style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setExpandedWeek(isOpen ? 0 : week.week_number)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 16px", background: "var(--surface)", border: "none",
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
                      Week {week.week_number}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {week.phase_name}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {week.sessions.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 16px", background: "var(--bg)",
                          borderBottom: i < week.sessions.length - 1 ? "1px solid var(--border)" : undefined,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text)" }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{s.duration_minutes} min</p>
                      </div>
                    ))}
                    <div style={{ padding: "10px 16px", background: "var(--surface)" }}>
                      <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                        {week.phase_note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Fuel notes */}
        {fuel && (
          <div style={{ marginBottom: "36px" }}>
            <p style={{ ...labelStyle, marginBottom: "12px" }}>Fuel protocol</p>
            <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
              {[
                { label: "Pre-session", text: fuel.preSession },
                { label: "In-session", text: fuel.inSession },
                { label: "Post-session", text: fuel.postSession },
                ...(fuel.raceDay ? [{ label: "Race day", text: fuel.raceDay }] : []),
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    padding: "14px 16px", background: "var(--surface)",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  <p style={{ margin: "0 0 4px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {row.label}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", lineHeight: 1.6 }}>
                    {row.text}
                  </p>
                </div>
              ))}
              {fuel.notes && (
                <div style={{ padding: "12px 16px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
                    {fuel.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily nutrition targets (if set) */}
        {nutritionGoal && bodyWeight && bodyWeight >= 40 && (() => {
          const m = calcMacros(bodyWeight, nutritionGoal, savedPlan.days_per_week);
          return (
            <div style={{ marginBottom: "36px" }}>
              <p style={{ ...labelStyle, marginBottom: "12px" }}>Daily nutrition targets</p>
              <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {NUTRITION_GOALS.find(g => g.value === nutritionGoal)?.label} · {nutritionGoal === "build" ? "+350 kcal surplus" : nutritionGoal === "lean" ? "−350 kcal deficit" : "maintenance"}
                  </p>
                </div>
                {[
                  { label: "Calories",     value: `${m.calories} kcal` },
                  { label: "Protein",      value: `${m.protein} g` },
                  { label: "Carbohydrate", value: `${m.carbs} g` },
                  { label: "Fat",          value: `${m.fat} g` },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 16px", background: "var(--surface)",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  if (saved && !savedPlan) {
    return (
      <div style={{ maxWidth: "560px" }}>
        <p style={labelStyle}>concept<span style={{ color: "var(--text-muted)" }}>//</span>form · training plan</p>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.04em", marginBottom: "14px" }}>
          Plan saved.
        </h1>
        <Link href="/profile" style={{ display: "inline-block", padding: "12px 24px", background: "var(--accent)", color: "var(--bg)", borderRadius: "4px", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
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

  const STEPS = ["Goal", "Days", "Style", "Block", "Nutrition", "Review"];

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

      {/* ── Step 4: Nutrition (optional) ─────────────────────────────────────── */}
      {step === 4 && (
        <div>
          <p style={labelStyle}>Daily nutrition targets <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· optional</span></p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "24px" }}>
            Set a daily nutrition target that supports this training block. You can skip this step if you prefer.
          </p>

          <div style={cardGridStyle}>
            {NUTRITION_GOALS.map((g) => (
              <OptionCard
                key={g.value}
                selected={nutritionGoal === g.value}
                onClick={() => setNutritionGoal(g.value)}
                label={g.label}
                desc={g.desc}
              />
            ))}
          </div>

          {nutritionGoal && (
            <div style={{ marginTop: "20px", marginBottom: "4px" }}>
              <label style={labelStyle}>Your weight (kg)</label>
              <input
                type="number"
                min={40} max={200} step={0.5}
                placeholder="e.g. 72"
                value={bodyWeight ?? ""}
                onChange={(e) => setBodyWeight(e.target.value ? parseFloat(e.target.value) : null)}
                style={{
                  width: "160px",
                  fontSize: "16px",
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  display: "block",
                  marginTop: "6px",
                }}
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                Used only to estimate your daily targets.
              </p>
            </div>
          )}

          {nutritionGoal && bodyWeight && bodyWeight >= 40 && (() => {
            const m = calcMacros(bodyWeight, nutritionGoal, daysPerWeek ?? 3);
            return (
              <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", marginTop: "20px" }}>
                <div style={{ padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Daily targets · {nutritionGoal === "build" ? "+350 kcal surplus" : nutritionGoal === "lean" ? "−350 kcal deficit" : "maintenance"}
                  </p>
                </div>
                {[
                  { label: "Calories",      value: `${m.calories} kcal` },
                  { label: "Protein",       value: `${m.protein} g` },
                  { label: "Carbohydrate",  value: `${m.carbs} g` },
                  { label: "Fat",           value: `${m.fat} g` },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 16px", background: "var(--surface)",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{row.value}</p>
                  </div>
                ))}
                <div style={{ padding: "10px 16px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
                    Starting-point estimates based on weight and training frequency. Adjust after 2–3 weeks based on energy and progress.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Step 5: Review & save ─────────────────────────────────────────────── */}
      {step === 5 && (
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "36px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {step === 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
                padding: "10px 0",
              }}
            >
              Skip
            </button>
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
    </div>
  );
}
