"use client";
import { useState } from "react";
import {
  generateFormPlan,
  type FormInput,
  type FormPlanOutput,
  type SessionType,
  type TrainingStyle,
  type CardioLevel,
  type TrainingGoal,
} from "@/lib/formEngine";

// ─── Option maps ──────────────────────────────────────────────────────────────

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "legs",       label: "Legs" },
  { value: "glutes",     label: "Glutes" },
  { value: "back",       label: "Back" },
  { value: "chest",      label: "Chest" },
  { value: "shoulders",  label: "Shoulders" },
  { value: "arms",       label: "Arms" },
  { value: "core",       label: "Core" },
  { value: "full_body",  label: "Full body" },
  { value: "hybrid",     label: "Hybrid" },
];

const TRAINING_STYLES: { value: TrainingStyle; label: string; desc: string }[] = [
  { value: "free_weights", label: "Free weights",  desc: "Barbells, dumbbells, kettlebells" },
  { value: "machines",     label: "Machines",       desc: "Cables, plate-loaded, selectorised" },
  { value: "bodyweight",   label: "Bodyweight",     desc: "No equipment required" },
  { value: "mixed",        label: "Mixed",          desc: "Combination of all" },
];

const CARDIO_LEVELS: { value: CardioLevel; label: string; desc: string }[] = [
  { value: "none",       label: "No cardio",      desc: "Weights only" },
  { value: "short",      label: "Short",          desc: "10–15 min finish" },
  { value: "moderate",   label: "Moderate",       desc: "20–30 min included" },
  { value: "endurance",  label: "Endurance",      desc: "30+ min, main focus" },
];

const TRAINING_GOALS: { value: TrainingGoal; label: string; desc: string }[] = [
  { value: "strength",    label: "Strength",    desc: "Heavy loads, low reps, max output" },
  { value: "hypertrophy", label: "Hypertrophy", desc: "Muscle size, volume-focused" },
  { value: "athletic",    label: "Athletic",    desc: "Power, speed, sport carryover" },
  { value: "aesthetic",   label: "Aesthetic",   desc: "Shape, tone, body composition" },
  { value: "general",     label: "General",     desc: "Health, fitness, no single focus" },
];

const DURATIONS = [45, 60, 75, 90];

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--text-muted)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  marginBottom: "10px",
  display: "block",
};

const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "8px",
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
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "4px",
        background: selected ? "var(--accent-bg, rgba(255,255,255,0.06))" : "var(--surface)",
        color: selected ? "var(--accent)" : "var(--text)",
        textAlign: "left",
        cursor: "pointer",
        transition: "border-color 0.15s, color 0.15s",
      }}
    >
      <p style={{ fontSize: "13px", fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
        {label}
      </p>
      {desc && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", marginBottom: 0, lineHeight: 1.4 }}>
          {desc}
        </p>
      )}
    </button>
  );
}

// ─── Configure step ───────────────────────────────────────────────────────────

const SEX_OPTIONS = [
  { value: "male",         label: "Male" },
  { value: "female",       label: "Female" },
  { value: "prefer_not",   label: "Prefer not to say" },
];

function ConfigureStep({
  onSubmit,
}: {
  onSubmit: (input: FormInput, name: string, sex: string) => void;
}) {
  const [name, setName]                     = useState<string>("");
  const [sex, setSex]                       = useState<string>("");
  const [sessionType, setSessionType]       = useState<SessionType | null>(null);
  const [trainingStyle, setTrainingStyle]   = useState<TrainingStyle | null>(null);
  const [cardio, setCardio]                 = useState<CardioLevel>("none");
  const [goal, setGoal]                     = useState<TrainingGoal | null>(null);
  const [duration, setDuration]             = useState<number>(60);
  const [weight, setWeight]                 = useState<string>("");
  const [error, setError]                   = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionType) { setError("Select a session type"); return; }
    if (!trainingStyle) { setError("Select a training style"); return; }
    if (!goal) { setError("Select your training goal"); return; }
    setError(null);
    const weightNum = weight ? parseFloat(weight) : undefined;
    onSubmit(
      {
        session_type:    sessionType,
        training_style:  trainingStyle,
        cardio,
        goal,
        duration_minutes: duration,
        weight_kg:        weightNum && !isNaN(weightNum) ? weightNum : undefined,
      },
      name.trim(),
      sex
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Name + Sex row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={labelStyle} htmlFor="form-name">
              First name // optional
            </label>
            <input
              id="form-name"
              type="text"
              placeholder="your first name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <span style={labelStyle}>Sex // optional</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SEX_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSex(sex === s.value ? "" : s.value)}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${sex === s.value ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "4px",
                    background: "var(--surface)",
                    color: sex === s.value ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Session type */}
        <div>
          <span style={labelStyle}>Session type</span>
          <div style={cardGridStyle}>
            {SESSION_TYPES.map((s) => (
              <OptionCard
                key={s.value}
                selected={sessionType === s.value}
                onClick={() => setSessionType(s.value)}
                label={s.label}
              />
            ))}
          </div>
        </div>

        {/* Training style */}
        <div>
          <span style={labelStyle}>Training style</span>
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

        {/* Goal */}
        <div>
          <span style={labelStyle}>Training goal</span>
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

        {/* Cardio */}
        <div>
          <span style={labelStyle}>Cardio included</span>
          <div style={cardGridStyle}>
            {CARDIO_LEVELS.map((c) => (
              <OptionCard
                key={c.value}
                selected={cardio === c.value}
                onClick={() => setCardio(c.value)}
                label={c.label}
                desc={c.desc}
              />
            ))}
          </div>
        </div>

        {/* Duration + weight row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <span style={labelStyle}>Session duration</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  style={{
                    padding: "8px 16px",
                    border: `1px solid ${duration === d ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "4px",
                    background: duration === d ? "transparent" : "var(--surface)",
                    color: duration === d ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="form-weight">
              Bodyweight // optional
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                id="form-weight"
                type="number"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min={30}
                max={200}
                style={{ width: "80px" }}
              />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>kg</span>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
              Used for protein targets
            </p>
          </div>
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          style={{
            padding: "14px",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 700,
            fontSize: "14px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.02em",
            fontFamily: "inherit",
          }}
        >
          Build session plan →
        </button>
      </div>
    </form>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

const CARB_LEVEL_COLOUR: Record<string, string> = {
  high:     "var(--accent)",
  moderate: "var(--accent-dim)",
  low:      "var(--text-muted)",
};

function FormResults({ plan, name }: { plan: FormPlanOutput; name?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Personalised greeting */}
      {name && (
        <div style={{ marginBottom: "4px" }}>
          <h2
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              margin: 0,
            }}
          >
            Hi {name}, here is your session plan.
          </h2>
        </div>
      )}

      {/* Protocol header */}
      <div
        style={{
          padding: "28px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
        }}
      >
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
          Protocol
        </p>
        <p style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: "8px" }}>
          {plan.protocol_name}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
          {plan.protocol_desc}
        </p>
      </div>

      {/* Session structure */}
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
          Session structure
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {plan.session_structure.map((block) => (
            <div
              key={block.phase}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: "16px",
                padding: "16px 20px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>
                  {block.phase}
                </p>
                <p style={{ fontSize: "11px", color: "var(--accent-dim)" }}>
                  {block.duration_min} min
                </p>
              </div>
              <div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {block.items.map((item) => (
                    <li key={item} style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.4 }}>
                      {item}
                    </li>
                  ))}
                </ul>
                {block.note && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", marginBottom: 0, lineHeight: 1.5 }}>
                    {block.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warm-up mobility */}
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
          Warm-up mobility
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {plan.warm_up_mobility.map((item) => (
            <div
              key={item.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px",
                alignItems: "center",
                padding: "12px 18px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  {item.cue}
                </p>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--accent-dim)",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                {item.hold}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
          Nutrition targets
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {/* Protein */}
          <div style={{ padding: "18px 20px", background: "var(--surface)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Protein</p>
            {plan.macros.protein_range && (
              <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                {plan.macros.protein_range}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
              {plan.macros.protein_note}
            </p>
          </div>
          {/* Carbs */}
          <div style={{ padding: "18px 20px", background: "var(--surface)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Carbohydrate</p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: CARB_LEVEL_COLOUR[plan.macros.carb_level] || "var(--text)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {plan.macros.carb_level} priority
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
              {plan.macros.carb_guidance}
            </p>
          </div>
          {/* Fat */}
          <div style={{ padding: "18px 20px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Fat</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
              {plan.macros.fat_guidance}
            </p>
          </div>
        </div>

        {/* Pre/post session */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", border: "1px solid var(--border)", borderTop: "none", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "var(--surface)", borderRight: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Pre-session</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{plan.macros.pre_session_timing}</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{plan.macros.pre_session_foods}</p>
          </div>
          <div style={{ padding: "16px 20px", background: "var(--surface)" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Post-session</p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{plan.macros.post_session_timing}</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{plan.macros.post_session_foods}</p>
          </div>
        </div>

        {plan.macros.calorie_note && (
          <div style={{ padding: "12px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 4px 4px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              {plan.macros.calorie_note}
            </p>
          </div>
        )}
      </div>

      {/* Cool-down mobility */}
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
          Cool-down mobility
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {plan.cool_down_mobility.map((item) => (
            <div
              key={item.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px",
                alignItems: "center",
                padding: "12px 18px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  {item.cue}
                </p>
              </div>
              <span style={{ fontSize: "11px", color: "var(--accent-dim)", whiteSpace: "nowrap", fontWeight: 600 }}>
                {item.hold}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery */}
      <div
        style={{
          padding: "24px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
        }}
      >
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
          Recovery
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "64px", paddingTop: "1px" }}>SLEEP</span>
            <p style={{ fontSize: "13px", color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{plan.recovery.sleep_hours}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "64px", paddingTop: "1px" }}>FLUID</span>
            <div>
              {plan.recovery.hydration.map((h) => (
                <p key={h} style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 4px", lineHeight: 1.5 }}>{h}</p>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "64px", paddingTop: "1px" }}>SORENESS</span>
            <p style={{ fontSize: "13px", color: "var(--text)", margin: 0, lineHeight: 1.5 }}>{plan.recovery.soreness_note}</p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {plan.notes.length > 0 && (
        <div
          style={{
            padding: "20px",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            background: "var(--surface-2, rgba(255,255,255,0.03))",
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "12px" }}>
            Notes
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
            {plan.notes.map((note) => (
              <li key={note} style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.65, paddingLeft: "12px", borderLeft: "2px solid var(--border)" }}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Share canvas ─────────────────────────────────────────────────────────────

const FORM_CANVAS_THEMES = {
  dark:  { bg: "#0a0a0a", surface: "#111111", surface2: "#1a1a1a", border: "#2a2a2a", text: "#f0f0f0", muted: "#888888", dimmed: "#555555", rowA: "#111111", rowB: "#0e0e0e", grid: "rgba(255,255,255,0.04)" },
  light: { bg: "#f5f2ed", surface: "#ede9e3", surface2: "#e5e0d9", border: "#ccc8c0", text: "#1a1714", muted: "#7a7570", dimmed: "#999999", rowA: "#e8e4de", rowB: "#e3dfd9", grid: "rgba(0,0,0,0.03)" },
  sage:  { bg: "#edf0eb", surface: "#e3e7de", surface2: "#d7dcd1", border: "#b4bcac", text: "#1c2418", muted: "#627060", dimmed: "#8a9e88", rowA: "#dde1d8", rowB: "#d8dcd3", grid: "rgba(0,0,0,0.03)" },
  mocha: { bg: "#f2ede6", surface: "#e8e0d5", surface2: "#ddd4c5", border: "#c2b4a0", text: "#2c1f14", muted: "#7d6858", dimmed: "#a09080", rowA: "#e2d9cc", rowB: "#ddd4c7", grid: "rgba(0,0,0,0.03)" },
};

function getFormCanvasTheme() {
  const t = typeof localStorage !== "undefined" ? (localStorage.getItem("cf_theme") ?? "dark") : "dark";
  return FORM_CANVAS_THEMES[t as keyof typeof FORM_CANVAS_THEMES] ?? FORM_CANVAS_THEMES.dark;
}

function buildFormShareCanvas(
  plan: FormPlanOutput,
  input: FormInput | null,
  name?: string
): HTMLCanvasElement {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const FONT = "'ui-monospace', 'Cascadia Code', 'Fira Mono', monospace";
  const T = getFormCanvasTheme();

  // Background
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = T.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Brand mark
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillStyle = T.text;
  ctx.fillText("concept", 60, 68);
  ctx.fillStyle = T.muted;
  ctx.fillText("//", 60 + ctx.measureText("concept").width, 68);
  ctx.fillStyle = T.text;
  ctx.fillText("form", 60 + ctx.measureText("concept//").width, 68);

  // Context
  if (input) {
    const ctxText = [
      input.session_type.replace("_", " "),
      input.goal,
      `${input.duration_minutes} min`,
    ].join(" · ");
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.textAlign = "right";
    ctx.fillText(ctxText, W - 60, 68);
    ctx.textAlign = "left";
  }

  // Divider
  ctx.strokeStyle = T.border;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 90); ctx.lineTo(W - 60, 90); ctx.stroke();

  // Greeting or label
  if (name) {
    ctx.font = `16px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText(`${name}'s session plan`, 60, 140);
  } else {
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText("SESSION PLAN", 60, 140);
  }

  // Protocol name (large)
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillStyle = T.text;
  ctx.fillText(plan.protocol_name, 60, 215);

  ctx.font = `18px ${FONT}`;
  ctx.fillStyle = T.muted;
  const descTrunc = plan.protocol_desc.length > 72 ? plan.protocol_desc.slice(0, 70) + "…" : plan.protocol_desc;
  ctx.fillText(descTrunc, 60, 255);

  // Session structure blocks (left column)
  const blocksY = 295;
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("STRUCTURE", 60, blocksY);
  ctx.strokeStyle = T.border;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, blocksY + 8); ctx.lineTo(520, blocksY + 8); ctx.stroke();

  plan.session_structure.slice(0, 5).forEach((block, i) => {
    const by = blocksY + 28 + i * 42;
    ctx.fillStyle = i % 2 === 0 ? T.rowA : T.rowB;
    ctx.fillRect(60, by - 14, 460, 36);
    ctx.strokeStyle = T.border;
    ctx.strokeRect(60, by - 14, 460, 36);

    ctx.font = `bold 12px ${FONT}`;
    ctx.fillStyle = T.text;
    ctx.fillText(block.phase, 74, by + 6);

    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = T.muted;
    ctx.textAlign = "right";
    ctx.fillText(`${block.duration_min} min`, 510, by + 6);
    ctx.textAlign = "left";
  });

  // Nutrition panel (right column)
  const nutX = 620;
  const nutY = 295;
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("NUTRITION", nutX, nutY);
  ctx.strokeStyle = T.border;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(nutX, nutY + 8); ctx.lineTo(W - 60, nutY + 8); ctx.stroke();

  const nutItems: { label: string; value: string }[] = [];
  if (plan.macros.protein_range) nutItems.push({ label: "PROTEIN", value: plan.macros.protein_range });
  nutItems.push({ label: "CARBS", value: plan.macros.carb_level.toUpperCase() + " priority" });
  nutItems.push({ label: "PRE-SESSION", value: plan.macros.pre_session_timing });
  nutItems.push({ label: "POST-SESSION", value: plan.macros.post_session_timing });

  nutItems.slice(0, 4).forEach((item, i) => {
    const ny = nutY + 28 + i * 52;
    ctx.fillStyle = T.surface;
    ctx.fillRect(nutX, ny - 14, W - 60 - nutX, 44);
    ctx.strokeStyle = T.border;
    ctx.strokeRect(nutX, ny - 14, W - 60 - nutX, 44);
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText(item.label, nutX + 14, ny + 2);
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillStyle = T.text;
    ctx.fillText(item.value, nutX + 14, ny + 22);
  });

  // Bottom bar
  ctx.fillStyle = T.surface;
  ctx.fillRect(0, H - 60, W, 60);
  ctx.strokeStyle = T.border;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H - 60); ctx.lineTo(W, H - 60); ctx.stroke();

  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("Build your session plan →", 60, H - 22);

  ctx.font = `bold 13px ${FONT}`;
  ctx.fillStyle = T.muted;
  ctx.textAlign = "right";
  ctx.fillText("conceptathletic.com/form", W - 60, H - 22);
  ctx.textAlign = "left";

  return canvas;
}

// ─── Share copy text ──────────────────────────────────────────────────────────

function buildFormCopyText(plan: FormPlanOutput, name?: string): string {
  const lines: string[] = [];
  lines.push("concept//form — Session Plan");
  lines.push("=".repeat(36));
  if (name) lines.push(`Athlete: ${name}`);
  lines.push(`Protocol: ${plan.protocol_name}`);
  lines.push(`\n${plan.protocol_desc}`);
  lines.push("\n── Session Structure ──");
  for (const b of plan.session_structure) {
    lines.push(`${b.phase} (${b.duration_min} min)`);
    b.items.forEach((item) => lines.push(`  · ${item}`));
  }
  lines.push("\n── Warm-up Mobility ──");
  plan.warm_up_mobility.forEach((m) => lines.push(`  · ${m.name} — ${m.hold}`));
  lines.push("\n── Cool-down Mobility ──");
  plan.cool_down_mobility.forEach((m) => lines.push(`  · ${m.name} — ${m.hold}`));
  lines.push("\n── Nutrition ──");
  if (plan.macros.protein_range) lines.push(`Protein: ${plan.macros.protein_range}`);
  lines.push(`Pre-session: ${plan.macros.pre_session_timing} — ${plan.macros.pre_session_foods}`);
  lines.push(`Post-session: ${plan.macros.post_session_timing} — ${plan.macros.post_session_foods}`);
  lines.push("\nconcept//athleticclub — conceptathletic.com/form");
  return lines.join("\n");
}

function FormShareSection({
  plan,
  input,
  name,
}: {
  plan: FormPlanOutput;
  input: FormInput | null;
  name?: string;
}) {
  const [copied, setCopied]         = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [canShare]                  = useState(() => typeof navigator !== "undefined" && !!navigator.share);

  const shareText = `My ${plan.protocol_name} session plan from concept//form.\n\nconceptathletic.com/form`;

  const handleCopy = async () => {
    const text = buildFormCopyText(plan, name);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = buildFormShareCanvas(plan, input, name);
      const link = document.createElement("a");
      link.download = "concept-form-plan.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      const canvas = buildFormShareCanvas(plan, input, name);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "form-plan.png", { type: "image/png" });
        const shareData: ShareData = {
          title: `My ${plan.protocol_name} session plan — concept//form`,
          text: shareText,
          files: [file],
        };
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.share({ title: `concept//form — ${plan.protocol_name}`, text: shareText });
        }
      }, "image/png");
    } catch {
      // User cancelled or not supported
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const xHref  = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: "10px 18px",
    background: primary ? "var(--accent)" : "var(--surface-2)",
    color: primary ? "var(--bg)" : "var(--text)",
    fontWeight: 600,
    fontSize: "13px",
    borderRadius: "4px",
    border: `1px solid ${primary ? "transparent" : "var(--border)"}`,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap" as const,
    fontFamily: "inherit",
  });

  return (
    <div
      style={{
        padding: "24px",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        background: "var(--surface)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Share your plan
      </p>

      {/* Primary actions */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
        {canShare && (
          <button onClick={handleNativeShare} style={btnStyle(true)}>
            ↑ Share (Instagram / WhatsApp / TikTok…)
          </button>
        )}
        <button onClick={handleDownload} disabled={downloading} style={btnStyle()}>
          {downloading ? "Generating…" : "↓ Download card"}
        </button>
        <button
          onClick={handleCopy}
          style={{
            ...btnStyle(),
            background: copied ? "rgba(68,255,136,0.1)" : "var(--surface-2)",
            color: copied ? "var(--success, #44ff88)" : "var(--text)",
            border: `1px solid ${copied ? "rgba(68,255,136,0.3)" : "var(--border)"}`,
          }}
        >
          {copied ? "✓ Copied!" : "Copy text"}
        </button>
      </div>

      {/* Social links */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <a href={waHref} target="_blank" rel="noopener noreferrer" style={btnStyle()}>
          WhatsApp
        </a>
        <a href={xHref} target="_blank" rel="noopener noreferrer" style={btnStyle()}>
          X / Twitter
        </a>
        {!canShare && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "auto 0" }}>
            On mobile: use &ldquo;Share&rdquo; to post directly to Instagram or TikTok.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Step = "configure" | "loading" | "results";

export default function FormWizard() {
  const [step, setStep]       = useState<Step>("configure");
  const [plan, setPlan]       = useState<FormPlanOutput | null>(null);
  const [input, setInput]     = useState<FormInput | null>(null);
  const [name, setName]       = useState<string>("");

  const handleConfigure = (formInput: FormInput, formName: string) => {
    setInput(formInput);
    setName(formName);
    setStep("loading");
    setTimeout(() => {
      const result = generateFormPlan(formInput);
      setPlan(result);
      setStep("results");
    }, 600);
  };

  const handleReset = () => {
    setStep("configure");
    setPlan(null);
    setInput(null);
    setName("");
  };

  return (
    <div className="cf-page">
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          concept<span style={{ color: "var(--text-muted)" }}>//</span>form
        </p>
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "10px",
          }}
        >
          Session planner
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "480px", margin: 0 }}>
          Build your training session. Structure, macros, mobility and recovery — matched to your goal.
        </p>
      </div>

      {/* Steps */}
      {step === "configure" && (
        <ConfigureStep onSubmit={(input, n) => handleConfigure(input, n)} />
      )}

      {step === "loading" && (
        <div
          style={{
            minHeight: "280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Building your plan…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === "results" && plan && (
        <>
          {/* Result header bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "28px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                {input?.session_type?.replace("_", " ")} · {input?.goal} · {input?.duration_minutes} min
              </p>
              <p style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                {plan.protocol_name}
              </p>
            </div>
            <button
              onClick={handleReset}
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ← New plan
            </button>
          </div>

          <FormResults plan={plan} name={name || undefined} />
          <div style={{ marginTop: "28px" }}>
            <FormShareSection plan={plan} input={input} name={name || undefined} />
          </div>
        </>
      )}
    </div>
  );
}
