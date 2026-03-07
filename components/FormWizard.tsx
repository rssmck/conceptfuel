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

// ─── Share section ────────────────────────────────────────────────────────────

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

function FormShareSection({ plan, name }: { plan: FormPlanOutput; name?: string }) {
  const [copied, setCopied] = useState(false);

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

  const shareText = `My ${plan.protocol_name} session plan from concept//form.\n\nconceptathletic.com/form`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const xHref  = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const btnBase: React.CSSProperties = {
    padding: "9px 16px",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    background: "var(--surface)",
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "none",
    display: "inline-block",
    whiteSpace: "nowrap",
  };

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
        Share
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleCopy} style={btnBase}>
          {copied ? "✓ Copied" : "Copy plan"}
        </button>
        <a href={waHref} target="_blank" rel="noopener noreferrer" style={btnBase}>
          WhatsApp
        </a>
        <a href={xHref} target="_blank" rel="noopener noreferrer" style={btnBase}>
          X / Twitter
        </a>
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
            <FormShareSection plan={plan} name={name || undefined} />
          </div>
        </>
      )}
    </div>
  );
}
