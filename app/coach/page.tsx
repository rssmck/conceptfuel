"use client";
import { useState } from "react";
import { generateCoachSession } from "@/lib/coachEngine";
import type {
  Discipline,
  AthleticsEvent,
  AgeGroup,
  Ability,
  Venue,
  GroupSize,
  SessionType,
  CoachSessionPlan,
  SprintSessionType,
  HurdleSessionType,
  MiddleSessionType,
  EnduranceSessionType,
} from "@/lib/coachEngine";

// ─── Option maps ──────────────────────────────────────────────────────────────

const DISCIPLINES: { value: Discipline; label: string; desc: string }[] = [
  { value: "sprints",         label: "Sprints",         desc: "60m to 400m. Drive phase, maximum velocity, speed endurance." },
  { value: "hurdles",         label: "Hurdles",         desc: "Sprint hurdles and 400m hurdles. Rhythm, lead leg, trail leg." },
  { value: "middle_distance", label: "Middle distance", desc: "800m to 3000m. Speed endurance, threshold, VO\u2082max, race pace." },
  { value: "endurance",       label: "Endurance",       desc: "5k and beyond. Cross country, road, track distance." },
];

const EVENTS_BY_DISCIPLINE: Record<Discipline, { value: AthleticsEvent; label: string }[]> = {
  sprints: [
    { value: "60m",  label: "60m" },
    { value: "100m", label: "100m" },
    { value: "200m", label: "200m" },
    { value: "400m", label: "400m" },
  ],
  hurdles: [
    { value: "80mH",  label: "80m hurdles" },
    { value: "100mH", label: "100m hurdles" },
    { value: "110mH", label: "110m hurdles" },
    { value: "300mH", label: "300m hurdles" },
    { value: "400mH", label: "400m hurdles" },
  ],
  middle_distance: [
    { value: "800m",        label: "800m" },
    { value: "1500m",       label: "1500m" },
    { value: "3000m",       label: "3000m" },
    { value: "steeplechase",label: "Steeplechase" },
  ],
  endurance: [
    { value: "5000m",        label: "5000m" },
    { value: "10000m",       label: "10000m" },
    { value: "cross_country",label: "Cross country" },
    { value: "road",         label: "Road" },
  ],
};

const SESSION_TYPES_BY_DISCIPLINE: Record<Discipline, { value: SessionType; label: string; desc: string }[]> = {
  sprints: [
    { value: "acceleration",          label: "Acceleration",             desc: "Drive phase, falling starts, short max efforts. Foundation of all sprint training." },
    { value: "max_velocity",          label: "Maximum velocity",         desc: "Flying runs. Absolute top-end speed in the fly zone." },
    { value: "speed_endurance_short", label: "Speed endurance — short",  desc: "150-200m efforts at race pace. Holds mechanics under fatigue." },
    { value: "speed_endurance_long",  label: "Speed endurance — long",   desc: "300-400m efforts. Race-specific for 400m athletes." },
    { value: "race_practice",         label: "Race practice",            desc: "Full distance time trial or race simulation." },
  ],
  hurdles: [
    { value: "rhythm_spacing", label: "Rhythm and spacing", desc: "3-stride rhythm between hurdles. Consistency and approach confidence." },
    { value: "lead_leg",       label: "Lead leg mechanics", desc: "Isolated lead leg drills and partial runs." },
    { value: "trail_leg",      label: "Trail leg mechanics", desc: "Hip rotation and trail leg clearance." },
    { value: "full_runs",      label: "Full hurdle runs",   desc: "Full flight at competition height." },
  ],
  middle_distance: [
    { value: "speed_endurance", label: "Speed endurance",    desc: "Repeated race-pace reps. Core session for 800m-3000m." },
    { value: "threshold",       label: "Threshold / tempo",  desc: "Sustained effort at the top of the aerobic zone." },
    { value: "vo2max",          label: "VO\u2082max intervals", desc: "Short hard efforts with full recovery." },
    { value: "race_pace",       label: "Race pace work",     desc: "Specific reps at exact goal race pace." },
    { value: "kick",            label: "Kick development",   desc: "Threshold runs with a final fast burst." },
  ],
  endurance: [
    { value: "tempo",     label: "Tempo",           desc: "Sustained comfortably hard effort." },
    { value: "intervals", label: "Track intervals", desc: "Repeated efforts with jog recovery." },
    { value: "long_run",  label: "Long run",        desc: "Easy aerobic base building." },
    { value: "easy",      label: "Easy run",        desc: "Recovery or aerobic base." },
  ],
};

const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: "u11",     label: "Under 11" },
  { value: "u13",     label: "Under 13" },
  { value: "u15",     label: "Under 15" },
  { value: "u17",     label: "Under 17" },
  { value: "u20",     label: "Under 20" },
  { value: "senior",  label: "Senior" },
  { value: "masters", label: "Masters" },
];

const ABILITIES: { value: Ability; label: string; desc: string }[] = [
  { value: "development", label: "Development", desc: "New to structured training. Volume and intensity reduced." },
  { value: "club",        label: "Club",        desc: "Regular club training, some competitive experience." },
  { value: "performance", label: "Performance", desc: "Competing seriously. Full training volumes." },
];

const VENUES: { value: Venue; label: string }[] = [
  { value: "outdoor_track", label: "Outdoor track" },
  { value: "indoor_track",  label: "Indoor track" },
  { value: "road",          label: "Road" },
  { value: "grass",         label: "Grass" },
];

const GROUP_SIZES: { value: GroupSize; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "small",      label: "Small group (2-6)" },
  { value: "squad",      label: "Full squad (7+)" },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const label: React.CSSProperties = {
  fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "var(--text-muted)", marginBottom: "12px", display: "block",
};

const grid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "8px", marginBottom: "24px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "var(--text-muted)", marginBottom: "10px", display: "block",
};

// ─── OptionCard ───────────────────────────────────────────────────────────────

function OptionCard({ selected, onClick, label: lbl, desc }: {
  selected: boolean; onClick: () => void; label: string; desc?: string;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px", borderRadius: "8px", cursor: "pointer",
        background: selected ? "transparent" : "var(--surface)",
        border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        transition: "all 0.15s",
      }}
    >
      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600,
        color: selected ? "var(--accent)" : "var(--text)" }}>{lbl}</p>
      {desc && <p style={{ margin: "4px 0 0", fontSize: "12px",
        color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>}
    </div>
  );
}

// ─── Plan section ─────────────────────────────────────────────────────────────

function PlanSection({ title, children, warning }: {
  title: string; children: React.ReactNode; warning?: boolean;
}) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <p style={{
        fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
        color: warning ? "#ff6b6b" : "var(--text-muted)",
        fontWeight: warning ? 700 : 400, marginBottom: "10px",
      }}>{title}</p>
      {children}
    </div>
  );
}

function Bullet({ text, dim }: { text: string; dim?: boolean }) {
  return (
    <p style={{ margin: "0 0 6px", fontSize: "13px", lineHeight: 1.5,
      color: dim ? "var(--text-muted)" : "var(--text)",
      paddingLeft: "14px", position: "relative" }}>
      <span style={{ position: "absolute", left: 0, color: "var(--accent)" }}>·</span>
      {text}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEPS = ["Discipline", "Event", "Group", "Venue", "Session", "Review"];

export default function CoachPage() {
  const [step, setStep] = useState(0);
  const [discipline, setDiscipline] = useState<Discipline | null>(null);
  const [event, setEvent] = useState<AthleticsEvent | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [ability, setAbility] = useState<Ability | null>(null);
  const [groupSize, setGroupSize] = useState<GroupSize | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [plan, setPlan] = useState<CoachSessionPlan | null>(null);

  function canContinue(): boolean {
    if (step === 0) return discipline !== null;
    if (step === 1) return event !== null;
    if (step === 2) return ageGroup !== null && ability !== null && groupSize !== null;
    if (step === 3) return venue !== null;
    if (step === 4) return sessionType !== null;
    return true;
  }

  function handleGenerate() {
    if (!discipline || !event || !ageGroup || !ability || !groupSize || !venue || !sessionType) return;
    const result = generateCoachSession({
      discipline, event, age_group: ageGroup, ability,
      venue, session_type: sessionType, group_size: groupSize,
    });
    setPlan(result);
  }

  function handleBack() {
    if (step === 0) return;
    setStep(s => s - 1);
  }

  function handleNext() {
    if (step === STEPS.length - 1) { handleGenerate(); return; }
    setStep(s => s + 1);
  }

  // When discipline changes, clear event and session type
  function selectDiscipline(d: Discipline) {
    setDiscipline(d);
    setEvent(null);
    setSessionType(null);
  }

  // ── Plan output ─────────────────────────────────────────────────────────────

  if (plan) {
    const hasWarning = !!plan.footwear.warning;
    return (
      <div className="cf-page-narrow">
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px",
            letterSpacing: "-0.02em" }}>{plan.overview.title}</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {plan.overview.age_group} · {plan.overview.venue} · ~{plan.overview.duration_min} min · {plan.overview.intensity}
          </p>
          {plan.overview.ea_note && (
            <p style={{ fontSize: "12px", color: "var(--accent)", margin: "6px 0 0" }}>
              {plan.overview.ea_note}
            </p>
          )}
        </div>

        {/* Footwear — warning prominent for juniors */}
        <div style={{
          padding: "14px 16px", borderRadius: "8px", marginBottom: "28px",
          background: hasWarning ? "rgba(255,107,107,0.08)" : "var(--surface)",
          border: `1px solid ${hasWarning ? "#ff6b6b" : "var(--border)"}`,
        }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
            color: hasWarning ? "#ff6b6b" : "var(--text-muted)", fontWeight: 700, margin: "0 0 6px" }}>
            {hasWarning ? "Footwear — important" : "Footwear"}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
            {plan.footwear.recommendation}
          </p>
          {plan.footwear.warning && (
            <p style={{ margin: "6px 0", fontSize: "13px", color: "#ff6b6b", fontWeight: 500, lineHeight: 1.5 }}>
              {plan.footwear.warning}
            </p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {plan.footwear.rationale}
          </p>
        </div>

        {/* Warm-up */}
        <PlanSection title="Warm-up">
          {plan.warmup.map((phase, i) => (
            <div key={i} style={{ marginBottom: "14px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                {phase.name} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {phase.duration}</span>
              </p>
              {phase.activities.map((a, j) => <Bullet key={j} text={a} />)}
              {phase.note && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0",
                fontStyle: "italic", lineHeight: 1.5 }}>{phase.note}</p>}
            </div>
          ))}
        </PlanSection>

        {/* Drills */}
        <PlanSection title="Drills">
          {plan.drills.map((d, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "var(--surface)",
              borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                {d.name} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {d.volume}</span>
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>
                Cue: <span style={{ color: "var(--text-muted)" }}>{d.cue}</span>
              </p>
              {d.error && (
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Common error: {d.error}
                </p>
              )}
            </div>
          ))}
        </PlanSection>

        {/* Main set */}
        <PlanSection title="Main set">
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
            {plan.main_set.overview}
          </p>
          {plan.main_set.reps.map((r, i) => (
            <div key={i} style={{ padding: "12px 14px", background: "var(--surface)",
              borderRadius: "8px", marginBottom: "8px", border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600 }}>
                {r.label} <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>· {r.volume}</span>
              </p>
              {r.target && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--accent)" }}>
                {r.target}
              </p>}
            </div>
          ))}
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 12px",
            fontStyle: "italic" }}>Recovery: {plan.main_set.recovery}</p>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
            margin: "0 0 6px", letterSpacing: "0.05em" }}>COACHING CUES</p>
          {plan.main_set.cues.map((c, i) => <Bullet key={i} text={c} />)}
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)",
            margin: "12px 0 6px", letterSpacing: "0.05em" }}>COMMON ERRORS</p>
          {plan.main_set.errors.map((e, i) => <Bullet key={i} text={e} dim />)}
          {plan.main_set.modifications && (
            <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--accent)",
              lineHeight: 1.5, borderLeft: "2px solid var(--accent)", paddingLeft: "10px" }}>
              {plan.main_set.modifications}
            </p>
          )}
        </PlanSection>

        {/* Cool-down */}
        <PlanSection title={`Cool-down · ${plan.cooldown.duration_min} min`}>
          {plan.cooldown.activities.map((a, i) => <Bullet key={i} text={a} />)}
          {plan.cooldown.reflection_prompt && (
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--text-muted)",
              fontStyle: "italic", lineHeight: 1.5 }}>
              {plan.cooldown.reflection_prompt}
            </p>
          )}
        </PlanSection>

        {/* Coaching notes */}
        <PlanSection title="Coaching notes">
          {plan.coaching_notes.map((n, i) => <Bullet key={i} text={n} />)}
        </PlanSection>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={() => setPlan(null)}
            style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "13px",
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", cursor: "pointer" }}>
            New session
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "13px",
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", cursor: "pointer" }}>
            Print
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────

  return (
    <div className="cf-page-narrow">
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px",
          letterSpacing: "-0.02em" }}>Session planner</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          Full session plan with warm-up, drills, coaching cues and footwear guidance. EA age category guidelines built in.
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "28px", flexWrap: "wrap" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{
            padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
            background: i === step ? "var(--accent)" : i < step ? "var(--surface)" : "transparent",
            color: i === step ? "var(--bg)" : i < step ? "var(--text-muted)" : "var(--text-muted)",
            border: i < step ? "1px solid var(--border)" : i === step ? "none" : "1px solid transparent",
          }}>{s}</div>
        ))}
      </div>

      {/* Step 0: Discipline */}
      {step === 0 && (
        <div>
          <span style={label}>Choose discipline</span>
          <div style={{ ...grid, gridTemplateColumns: "1fr 1fr" }}>
            {DISCIPLINES.map(d => (
              <OptionCard key={d.value} selected={discipline === d.value}
                onClick={() => selectDiscipline(d.value)} label={d.label} desc={d.desc} />
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Event */}
      {step === 1 && discipline && (
        <div>
          <span style={label}>Choose event</span>
          <div style={grid}>
            {EVENTS_BY_DISCIPLINE[discipline].map(e => (
              <OptionCard key={e.value} selected={event === e.value}
                onClick={() => setEvent(e.value)} label={e.label} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Group */}
      {step === 2 && (
        <div>
          <span style={label}>Age group</span>
          <div style={grid}>
            {AGE_GROUPS.map(a => (
              <OptionCard key={a.value} selected={ageGroup === a.value}
                onClick={() => setAgeGroup(a.value)} label={a.label} />
            ))}
          </div>
          <span style={label}>Ability level</span>
          <div style={{ ...grid, gridTemplateColumns: "1fr 1fr 1fr" }}>
            {ABILITIES.map(a => (
              <OptionCard key={a.value} selected={ability === a.value}
                onClick={() => setAbility(a.value)} label={a.label} desc={a.desc} />
            ))}
          </div>
          <span style={label}>Group size</span>
          <div style={grid}>
            {GROUP_SIZES.map(g => (
              <OptionCard key={g.value} selected={groupSize === g.value}
                onClick={() => setGroupSize(g.value)} label={g.label} />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Venue */}
      {step === 3 && (
        <div>
          <span style={label}>Venue</span>
          <div style={grid}>
            {VENUES.map(v => (
              <OptionCard key={v.value} selected={venue === v.value}
                onClick={() => setVenue(v.value)} label={v.label} />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Session type */}
      {step === 4 && discipline && (
        <div>
          <span style={label}>Session type</span>
          <div style={{ ...grid, gridTemplateColumns: "1fr" }}>
            {SESSION_TYPES_BY_DISCIPLINE[discipline].map(s => (
              <OptionCard key={s.value} selected={sessionType === s.value}
                onClick={() => setSessionType(s.value)} label={s.label} desc={s.desc} />
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div>
          <span style={label}>Ready to generate</span>
          {[
            ["Discipline", DISCIPLINES.find(d => d.value === discipline)?.label],
            ["Event", EVENTS_BY_DISCIPLINE[discipline!]?.find(e => e.value === event)?.label],
            ["Age group", AGE_GROUPS.find(a => a.value === ageGroup)?.label],
            ["Ability", ABILITIES.find(a => a.value === ability)?.label],
            ["Group size", GROUP_SIZES.find(g => g.value === groupSize)?.label],
            ["Venue", VENUES.find(v => v.value === venue)?.label],
            ["Session", SESSION_TYPES_BY_DISCIPLINE[discipline!]?.find(s => s.value === sessionType)?.label],
          ].map(([k, v]) => (
            <div key={k as string} style={{ display: "flex", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: "13px" }}>
              <span style={{ color: "var(--text-muted)" }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
        <button
          onClick={handleBack}
          disabled={step === 0}
          style={{ padding: "10px 20px", borderRadius: "8px", fontSize: "13px",
            background: "var(--surface)", border: "1px solid var(--border)",
            color: step === 0 ? "var(--text-muted)" : "var(--text)",
            cursor: step === 0 ? "default" : "pointer", opacity: step === 0 ? 0.4 : 1 }}>
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canContinue()}
          style={{ padding: "10px 24px", borderRadius: "8px", fontSize: "13px",
            fontWeight: 600, background: canContinue() ? "var(--accent)" : "var(--surface)",
            border: "none", color: canContinue() ? "var(--bg)" : "var(--text-muted)",
            cursor: canContinue() ? "pointer" : "default", transition: "all 0.15s" }}>
          {step === STEPS.length - 1 ? "Generate session" : "Continue"}
        </button>
      </div>
    </div>
  );
}
