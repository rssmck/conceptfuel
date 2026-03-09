"use client";
import { useState, useEffect } from "react";
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

const DURATIONS = [30, 45, 60, 75, 90];

function formatSessionType(st: SessionType | SessionType[]): string {
  if (Array.isArray(st)) return st.map(t => t.replace(/_/g, " ")).join(" & ")
  return st.replace(/_/g, " ")
}

// ─── Exercise glossary ────────────────────────────────────────────────────────
// Brief description of each lift for display in the main workout section.

const EXERCISE_GLOSSARY: Record<string, { muscles: string; desc: string }> = {
  // Legs
  "Barbell back squat":             { muscles: "Quads · Glutes · Hamstrings", desc: "King of lower-body compounds. Bar on traps, squat to depth, drive through the floor." },
  "Romanian deadlift":              { muscles: "Hamstrings · Glutes · Lower back", desc: "Hip-hinge movement keeping a long spine. Lower the bar by pushing your hips back, not bending the knees." },
  "Bulgarian split squat":          { muscles: "Quads · Glutes · Hip flexors", desc: "Rear foot elevated single-leg squat. High quad and glute demand, great for fixing imbalances." },
  "Bulgarian split squat (bodyweight)": { muscles: "Quads · Glutes · Hip flexors", desc: "Bodyweight version of the split squat — rear foot elevated on a bench." },
  "Barbell hip thrust":             { muscles: "Glutes · Hamstrings", desc: "Bar across your hips, upper back on a bench. Drive through your heels until your hips lock out fully." },
  "Good morning":                   { muscles: "Hamstrings · Glutes · Lower back", desc: "Bar on traps, hinge forward at the hips. A demanding posterior chain movement — keep the spine neutral." },
  "Leg press":                      { muscles: "Quads · Glutes · Hamstrings", desc: "Machine compound push. Foot position affects muscle emphasis — higher = more glute, lower = more quad." },
  "Hack squat":                     { muscles: "Quads · Glutes", desc: "Machine squat with an upright torso. Heavy quad emphasis — great for building mass." },
  "Lying leg curl":                 { muscles: "Hamstrings", desc: "Isolation for the hamstrings lying face down. Control the lowering phase for maximum effect." },
  "Leg extension":                  { muscles: "Quadriceps", desc: "Seated knee-extension machine isolating the quad. Useful for adding volume without spinal load." },
  "Seated calf raise":              { muscles: "Soleus (lower calf)", desc: "Performed seated, this targets the soleus — the deeper calf muscle beneath the gastrocnemius." },
  "Squat":                          { muscles: "Quads · Glutes · Core", desc: "Foundational bodyweight squat. Feet hip-width apart, chest up, sit back and down, drive through the whole foot." },
  "Walking lunges":                 { muscles: "Quads · Glutes · Balance", desc: "Step forward into a lunge, driving the back knee close to the floor. Great for unilateral leg development." },
  "Nordic hamstring curl":          { muscles: "Hamstrings (eccentric)", desc: "Kneel with feet anchored, lower your torso slowly under control. One of the best injury-prevention tools for runners." },
  "Jump squat":                     { muscles: "Quads · Glutes · Power", desc: "Squat down then explode into a jump. Develops lower body power and rate of force development." },
  "Dumbbell goblet squat":          { muscles: "Quads · Glutes · Core", desc: "Hold a dumbbell at chest height and squat. Keeps the torso upright — excellent technique builder." },
  "Dumbbell Romanian deadlift":     { muscles: "Hamstrings · Glutes", desc: "Same movement as the barbell RDL but with dumbbells — often easier on the lower back." },
  // Glutes
  "Sumo deadlift":                  { muscles: "Inner thighs · Glutes · Hamstrings", desc: "Wide-stance deadlift with toes flared out. Greater adductor and glute involvement than conventional." },
  "Single-leg RDL":                 { muscles: "Hamstrings · Glutes · Balance", desc: "Single-leg hip hinge — the non-working leg floats behind. Demands stability and posterior chain control." },
  "Goblet squat":                   { muscles: "Quads · Glutes · Core", desc: "Hold a dumbbell or kettlebell at chest, squat with an upright torso. Beginner-friendly and very effective." },
  "Hip thrust machine":             { muscles: "Glutes", desc: "Machine version of the hip thrust — isolates the glutes with guided resistance." },
  "Cable kickback":                 { muscles: "Glute max", desc: "Cable attached to ankle, kick the leg back and up. Good for building the mind-muscle connection with your glutes." },
  "Hip abduction machine":          { muscles: "Glute medius · Outer hip", desc: "Seated machine pushing the legs apart. Targets the glute medius — important for knee tracking and hip stability." },
  "Leg press (feet high, wide)":    { muscles: "Glutes · Hamstrings", desc: "High, wide foot placement shifts the emphasis away from quads and onto the glutes and hamstrings." },
  "Seated leg curl":                { muscles: "Hamstrings", desc: "Hamstring isolation in a seated position — slightly different feel to the lying version." },
  "Hip thrust (bodyweight)":        { muscles: "Glutes", desc: "Bodyweight hip thrust with upper back on a bench. Great activation exercise before adding load." },
  "Glute bridge":                   { muscles: "Glutes · Hamstrings", desc: "Floor-based glute activation — lie on your back, drive your hips to the ceiling. A good warm-up or finisher." },
  "Single-leg glute bridge":        { muscles: "Glutes · Core", desc: "Same as the glute bridge but one leg raised — adds a stability challenge and increases load per side." },
  "Sumo squat":                     { muscles: "Inner thighs · Glutes · Quads", desc: "Wide-stance squat with toes flared. Targets the inner thighs more than a standard squat." },
  "Step-up":                        { muscles: "Quads · Glutes", desc: "Step onto a box or bench with one foot and drive the body up. Excellent unilateral strength builder." },
  "Dumbbell sumo deadlift":         { muscles: "Inner thighs · Glutes · Hamstrings", desc: "Wide-stance deadlift holding dumbbells. More accessible than the barbell version." },
  // Back
  "Deadlift":                       { muscles: "Full posterior chain · Traps · Core", desc: "The fundamental pull. Lift a barbell from the floor to lockout — builds total body strength and posterior chain mass." },
  "Bent-over barbell row":          { muscles: "Lats · Rhomboids · Rear delts", desc: "Barbell held at hip height, torso hinged forward. Pull the bar to your lower sternum. A cornerstone back builder." },
  "Single-arm dumbbell row":        { muscles: "Lats · Rhomboids", desc: "One knee and hand braced on a bench. Pull the dumbbell to your hip. Focus on driving the elbow back." },
  "Pull-up / chin-up":              { muscles: "Lats · Biceps · Upper back", desc: "Hang from a bar and pull your chin over it. Pull-up = overhand (lats), chin-up = underhand (more bicep)." },
  "Meadows row":                    { muscles: "Lats · Mid-back", desc: "One end of a barbell in a landmine, row from a staggered stance. Excellent for lat thickness." },
  "Lat pulldown":                   { muscles: "Lats · Biceps", desc: "Cable vertical pull with a wide bar. Pull to the top of your chest — a great substitute or complement to pull-ups." },
  "Seated cable row":               { muscles: "Mid-back · Lats · Rhomboids", desc: "Horizontal cable pull with a close grip. Retract the shoulder blades at the top of each rep." },
  "Machine chest-supported row":    { muscles: "Mid-back · Rear delts", desc: "Chest resting on a pad removes lower-back stress. Lets you focus purely on the pulling muscles." },
  "Assisted pull-up":               { muscles: "Lats · Biceps", desc: "Machine-assisted version — counterweight reduces the load. Great for building pull-up strength progressively." },
  "Face pull":                      { muscles: "Rear delts · External rotators", desc: "Cable pulled to the face with a rope attachment. Essential for shoulder health and posture." },
  "Pull-up":                        { muscles: "Lats · Biceps · Upper back", desc: "Overhand grip pull from a dead hang to chin over bar. One of the best upper-body strength tests." },
  "Chin-up":                        { muscles: "Lats · Biceps", desc: "Underhand grip — slightly more bicep involvement than a pull-up. Easier for most people to start with." },
  "Inverted row":                   { muscles: "Lats · Rhomboids · Biceps", desc: "Hang below a fixed bar and pull your chest up to it. A horizontal bodyweight pull — scalable by foot position." },
  "Dead hang":                      { muscles: "Grip · Shoulders · Decompression", desc: "Simply hang from a bar with straight arms. Decompresses the spine and builds grip and shoulder health." },
  "Superman hold":                  { muscles: "Lower back · Glutes", desc: "Lie face down, raise arms and legs off the floor simultaneously. Activates the lower back and posterior chain." },
  "Dumbbell single-arm row":        { muscles: "Lats · Rhomboids", desc: "Unilateral horizontal pull using a dumbbell. Focus on keeping your torso square and driving the elbow straight back." },
  "Cable row":                      { muscles: "Mid-back · Lats", desc: "Seated cable pull with a variety of grips. Consistent tension throughout the range of motion." },
  // Chest
  "Barbell bench press":            { muscles: "Pectorals · Anterior delts · Triceps", desc: "The standard horizontal push. Flat back, feet on the floor, bar touches the lower chest and drives back to lockout." },
  "Dumbbell bench press":           { muscles: "Pectorals · Anterior delts · Triceps", desc: "Greater range of motion than barbell. Each arm works independently, which can expose and correct imbalances." },
  "Incline bench press":            { muscles: "Upper pectorals · Anterior delts", desc: "Bench set to 30–45°. Shifts emphasis to the upper chest and front deltoid." },
  "Cable flye":                     { muscles: "Pectorals", desc: "Cable set at mid-height, arms arc inward like a hug. Excellent chest isolation with tension at full stretch." },
  "Press-up":                       { muscles: "Pectorals · Triceps · Anterior delts", desc: "Classic bodyweight horizontal push. Keep your body in a straight line from head to heel." },
  "Diamond press-up":               { muscles: "Triceps · Inner chest", desc: "Narrow hand placement under the chest forms a diamond shape. Tricep-dominant push-up variation." },
  "Dumbbell flye":                  { muscles: "Pectorals", desc: "Lying on a bench, arc dumbbells out and down then squeeze back together. A chest isolation movement with a good stretch." },
  "Chest press machine":            { muscles: "Pectorals · Triceps", desc: "Guided horizontal push — good for learning the movement pattern or training to failure safely." },
  "Cable crossover":                { muscles: "Pectorals", desc: "Cables set high, pull handles down and across in front of you. Maintains tension on the pecs at full contraction." },
  // Shoulders
  "Overhead press":                 { muscles: "Anterior & medial delts · Triceps · Upper traps", desc: "Press a barbell or dumbbells overhead to lockout. One of the key indicators of upper body strength." },
  "Arnold press":                   { muscles: "All three delt heads", desc: "Start with palms facing you, rotate as you press. Named after Arnold Schwarzenegger — hits all deltoid heads." },
  "Lateral raise":                  { muscles: "Medial delts", desc: "Raise dumbbells out to the side to shoulder height. Isolation for the side deltoid — the muscle that creates shoulder width." },
  "Dumbbell overhead press":        { muscles: "Anterior & medial delts · Triceps", desc: "Same pattern as the barbell OHP but with dumbbells — greater range of motion and shoulder stability demand." },
  "Seated machine press":           { muscles: "Anterior & medial delts · Triceps", desc: "Guided overhead press on a machine. Lower back is supported — good option for volume or when fatigued." },
  "Cable lateral raise":            { muscles: "Medial delts", desc: "Cable provides constant tension unlike dumbbells — the resistance doesn't drop off at the bottom." },
  "EZ-bar upright row":             { muscles: "Lateral delts · Upper traps", desc: "Pull the bar up to chin height with a narrow grip. Builds upper traps and side delts." },
  "Pike press-up":                  { muscles: "Anterior delts · Triceps", desc: "Bodyweight vertical push with hips raised high. A progression towards the handstand press-up." },
  "Handstand press-up":             { muscles: "Anterior delts · Triceps · Core", desc: "Advanced inverted press against a wall. Exceptional shoulder strength and body control required." },
  "Band pull-apart":                { muscles: "Rear delts · External rotators", desc: "Hold a resistance band with straight arms and pull it apart at chest height. Excellent shoulder health and posture." },
  "Machine lateral raise":          { muscles: "Medial delts", desc: "Lateral raise on a machine — isolates the side delt with guided resistance." },
  // Arms
  "Barbell curl":                   { muscles: "Biceps", desc: "Standard barbell bicep curl. Elbows stay at your sides — curl the bar to shoulder height then lower slowly." },
  "Hammer curl":                    { muscles: "Brachialis · Brachioradialis · Biceps", desc: "Neutral grip dumbbell curl. Builds the muscle beneath the bicep (brachialis) for arm thickness." },
  "Tricep pushdown":                { muscles: "Triceps", desc: "Cable pushdown with a bar or rope. Keep elbows pinned to your sides and extend to lockout." },
  "Overhead tricep extension":      { muscles: "Triceps (long head)", desc: "Arms overhead, lower a weight behind your head. Stretches and works the long head of the tricep." },
  "Close-grip bench press":         { muscles: "Triceps · Pectorals", desc: "Barbell press with hands shoulder-width apart. Shifts emphasis from the chest to the triceps." },
  "Preacher curl":                  { muscles: "Biceps (short head)", desc: "Arms resting on an angled pad — removes momentum. Isolates the bicep, especially the short head." },
  "Dumbbell curl":                  { muscles: "Biceps", desc: "Alternating or simultaneous dumbbell curls. Classic bicep isolation movement." },
  "Concentration curl":             { muscles: "Biceps (peak)", desc: "Seated, elbow braced against inner thigh. Fully isolates the bicep — good for building the peak." },
  "Machine bicep curl":             { muscles: "Biceps", desc: "Guided bicep isolation on a machine. Good for consistent form and training to failure." },
  "Cable bicep curl":               { muscles: "Biceps", desc: "Curl with a cable for constant tension throughout the full range of motion." },
  "Rope pushdown":                  { muscles: "Triceps (lateral & medial heads)", desc: "Rope attachment spreads at the bottom allowing the wrists to pronate — better lateral head activation." },
  "Skull crushers":                 { muscles: "Triceps (long head)", desc: "Lower a barbell or EZ-bar to your forehead then extend. A classic tricep mass builder." },
  "Machine tricep extension":       { muscles: "Triceps", desc: "Guided tricep isolation. Useful for adding volume safely." },
  "Chair dip (tricep)":             { muscles: "Triceps · Anterior delts", desc: "Hands on a chair, lower your body and press back up. Beginner-friendly bodyweight tricep exercise." },
  // Core
  "Plank":                          { muscles: "Core · Anterior chain", desc: "Forearms on the floor, body rigid and straight. An isometric hold for core stability — quality over duration." },
  "Dead bug":                       { muscles: "Core (anti-extension)", desc: "Lie on your back, lower opposite arm and leg simultaneously. Teaches the core to resist extension — safe and effective." },
  "Ab wheel rollout":               { muscles: "Core · Lats · Shoulders", desc: "Roll out from kneeling until your arms are extended, then pull back. High-demand core stability exercise." },
  "Hollow hold":                    { muscles: "Core (compression)", desc: "Lie on your back and hollow out your midline — lower back pressed flat. A gymnastics staple for core control." },
  "Hanging leg raise":              { muscles: "Lower abs · Hip flexors", desc: "Hang from a bar and raise your legs. Keep them straight for maximum challenge, bent for an easier start." },
  "Cable crunch":                   { muscles: "Rectus abdominis", desc: "Kneel at a cable, pull the rope to crunch your spine. Weighted ab exercise allowing progressive overload." },
  "Russian twist":                  { muscles: "Obliques · Core", desc: "Seated with feet off the floor, rotate side to side. A rotational core exercise — add a weight for more challenge." },
  "Side plank":                     { muscles: "Obliques · Lateral core", desc: "Lie on one forearm and hold the body in a rigid lateral line. Targets the obliques and quadratus lumborum." },
  // Full body / hybrid
  "KB swing":                       { muscles: "Posterior chain · Glutes · Power", desc: "Hip hinge to drive a kettlebell forward explosively. A fantastic conditioning and posterior chain movement." },
  "Farmer's carry":                 { muscles: "Grip · Core · Traps · Total body", desc: "Pick up heavy weights and walk. Builds total body stability, grip strength, and core stiffness." },
  "Push press":                     { muscles: "Delts · Triceps · Legs (drive)", desc: "Dip and drive with the legs to press a barbell overhead. More weight than a strict press — develops power." },
  "Assault bike sprint":            { muscles: "Total body conditioning", desc: "Arms and legs drive the fan bike. Maximum effort for short intervals — brutal and highly effective." },
  "Battle ropes":                   { muscles: "Upper body · Conditioning", desc: "Slam, wave, or alternate heavy ropes. Upper body power endurance and a significant cardiovascular challenge." },
};

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

  useEffect(() => {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("cf_name") : null;
    if (saved) setName(saved);
  }, []);
  const [sessionTypes, setSessionTypes]     = useState<SessionType[]>([]);
  const [trainingStyle, setTrainingStyle]   = useState<TrainingStyle | null>(null);
  const [cardio, setCardio]                 = useState<CardioLevel>("none");
  const [goal, setGoal]                     = useState<TrainingGoal | null>(null);
  const [duration, setDuration]             = useState<number>(60);
  const [weight, setWeight]                 = useState<string>("");
  const [error, setError]                   = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionTypes.length === 0) { setError("Select at least one session type"); return; }
    if (!trainingStyle) { setError("Select a training style"); return; }
    if (!goal) { setError("Select your training goal"); return; }
    setError(null);
    const weightNum = weight ? parseFloat(weight) : undefined;
    const sessionType = sessionTypes.length === 1 ? sessionTypes[0] : sessionTypes;
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

        {/* Session type — multi-select */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
            <span style={labelStyle}>Session type</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>select up to 3</span>
          </div>
          <div style={cardGridStyle}>
            {SESSION_TYPES.map((s) => (
              <OptionCard
                key={s.value}
                selected={sessionTypes.includes(s.value)}
                onClick={() => {
                  setSessionTypes(prev =>
                    prev.includes(s.value)
                      ? prev.filter(t => t !== s.value)
                      : prev.length < 3 ? [...prev, s.value] : prev
                  );
                }}
                label={s.label}
              />
            ))}
          </div>
          {sessionTypes.length > 1 && (
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
              Combined: {sessionTypes.map(t => t.replace(/_/g, " ")).join(" + ")}
            </p>
          )}
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

      {/* Main workout — primary lifts extracted from session_structure */}
      {(() => {
        const primaryBlock = plan.session_structure.find((b) => b.phase === "Primary lifts");
        if (!primaryBlock) return null;
        return (
          <div>
            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 4px" }}>
                Main workout · {primaryBlock.duration_min} min
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                The primary lifts for today&apos;s session. These are the heaviest, most demanding exercises — do them first when you&apos;re freshest.
              </p>
            </div>

            {/* Rep scheme note */}
            {primaryBlock.note && (
              <div style={{ padding: "10px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "6px 6px 0 0", marginBottom: "1px" }}>
                <p style={{ fontSize: "11px", color: "var(--accent-dim)", margin: 0, fontWeight: 600 }}>
                  {primaryBlock.note}
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: primaryBlock.note ? "0 0 6px 6px" : "6px", overflow: "hidden" }}>
              {primaryBlock.items.map((exercise, idx) => {
                const info = EXERCISE_GLOSSARY[exercise];
                return (
                  <div
                    key={exercise}
                    style={{
                      padding: "14px 18px",
                      background: idx % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: info ? "6px" : 0 }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" }}>
                        {idx + 1}. {exercise}
                      </p>
                      {info && (
                        <span style={{ fontSize: "10px", color: "var(--accent-dim)", whiteSpace: "nowrap", fontWeight: 600, letterSpacing: "0.04em", paddingTop: "2px" }}>
                          {info.muscles}
                        </span>
                      )}
                    </div>
                    {info && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                        {info.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 6px 6px" }}>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                Not sure about a movement? Search the exercise name on YouTube for a demo. Focus on controlled form over load — technique first.
              </p>
            </div>
          </div>
        );
      })()}

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
  const W = 1080;
  const H = 1920;
  const M = 90;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const FONT = "'ui-monospace', 'Cascadia Code', 'Fira Mono', monospace";
  const T = getFormCanvasTheme();

  // ── helpers ──────────────────────────────────────────────────────────────────

  const rule = (y: number) => {
    ctx.strokeStyle = T.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  };

  const igIcon = (x: number, y: number, size: number) => {
    const r = size * 0.22;
    ctx.fillStyle = T.muted;
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + size - r, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + r);
    ctx.lineTo(x + size, y + size - r);
    ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
    ctx.lineTo(x + r, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = T.bg;
    ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * 0.27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = T.muted;
    ctx.beginPath(); ctx.arc(x + size - size * 0.22, y + size * 0.22, size * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = T.bg;
    ctx.lineWidth = size * 0.09;
    ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * 0.27 + size * 0.06, 0, Math.PI * 2); ctx.stroke();
  };

  // ── background ───────────────────────────────────────────────────────────────

  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = T.grid;
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 90) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (let gy = 0; gy < H; gy += 90) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // ── brand header ─────────────────────────────────────────────────────────────

  let y = 82;
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = T.text;
  ctx.fillText("concept", M, y);
  ctx.fillStyle = T.muted;
  ctx.fillText("//", M + ctx.measureText("concept").width, y);
  ctx.fillStyle = T.text;
  ctx.fillText("form", M + ctx.measureText("concept//").width, y);

  if (input) {
    const tag = [formatSessionType(input.session_type), input.goal, `${input.duration_minutes} min`].join(" · ");
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.textAlign = "right";
    ctx.fillText(tag, W - M, y);
    ctx.textAlign = "left";
  }

  y = 110; rule(y);

  // ── name label ───────────────────────────────────────────────────────────────

  y = 165;
  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText(name ? `${name.toUpperCase()}'S SESSION` : "SESSION PLAN", M, y);

  // ── protocol name (HERO) ─────────────────────────────────────────────────────

  y = 240;
  ctx.font = `bold 68px ${FONT}`;
  ctx.fillStyle = T.text;
  const heroWords = plan.protocol_name.split(" ");
  let heroLine = "";
  for (const word of heroWords) {
    const test = heroLine ? heroLine + " " + word : word;
    if (ctx.measureText(test).width > W - M * 2) {
      ctx.fillText(heroLine, M, y);
      y += 80;
      heroLine = word;
    } else {
      heroLine = test;
    }
  }
  if (heroLine) { ctx.fillText(heroLine, M, y); y += 80; }

  // protocol desc
  ctx.font = `20px ${FONT}`;
  ctx.fillStyle = T.muted;
  const descWords = plan.protocol_desc.split(" ");
  let descLine = "";
  let descLines = 0;
  for (const word of descWords) {
    const test = descLine ? descLine + " " + word : word;
    if (ctx.measureText(test).width > W - M * 2) {
      ctx.fillText(descLine, M, y);
      y += 30; descLine = word; descLines++;
      if (descLines >= 2) break;
    } else {
      descLine = test;
    }
  }
  if (descLine && descLines < 2) { ctx.fillText(descLine, M, y); y += 30; }

  y += 30; rule(y);

  // ── main workout ─────────────────────────────────────────────────────────────

  const primaryBlock = plan.session_structure.find(b => b.phase === "Primary lifts");

  y += 42;
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("MAIN WORKOUT", M, y);
  if (primaryBlock) {
    ctx.textAlign = "right";
    ctx.fillText(`${primaryBlock.duration_min} min`, W - M, y);
    ctx.textAlign = "left";
  }

  y += 16; rule(y); y += 32;

  const muscleHints: Record<string, string> = {
    squat: "Quads · Glutes", deadlift: "Posterior chain", press: "Chest · Triceps",
    row: "Back · Biceps", curl: "Biceps", lunge: "Quads · Glutes",
    thrust: "Glutes", pull: "Lats · Biceps", pushdown: "Triceps",
    "hip thrust": "Glutes", "lat pulldown": "Lats", "leg press": "Quads",
    "leg curl": "Hamstrings", "leg extension": "Quads", "calf": "Calves",
    "shoulder": "Shoulders", "lateral raise": "Side delts", "fly": "Chest",
    "dip": "Triceps · Chest", "crunch": "Abs", "plank": "Core",
  };

  const lifts = primaryBlock?.items ?? [];
  const liftRowH = 80;
  lifts.slice(0, 5).forEach((lift, i) => {
    const ly = y + i * liftRowH;
    // row bg
    ctx.fillStyle = T.surface;
    ctx.fillRect(M, ly - 2, W - M * 2, liftRowH - 8);
    // lift number
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText(String(i + 1).padStart(2, "0"), M + 16, ly + 24);
    // lift name
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = T.text;
    ctx.fillText(lift, M + 52, ly + 24);
    // muscle hint
    const hint = Object.entries(muscleHints).find(([k]) => lift.toLowerCase().includes(k))?.[1] ?? "";
    if (hint) {
      ctx.font = `14px ${FONT}`;
      ctx.fillStyle = T.muted;
      ctx.fillText(hint, M + 52, ly + 46);
    }
  });

  y += lifts.slice(0, 5).length * liftRowH + 8;

  // rep scheme note
  if (primaryBlock?.note) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText(primaryBlock.note, M, y);
    y += 26;
  }

  y += 20; rule(y);

  // ── session structure ─────────────────────────────────────────────────────────

  y += 42;
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("STRUCTURE", M, y);
  y += 16; rule(y); y += 28;

  plan.session_structure.slice(0, 5).forEach((block) => {
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = T.text;
    ctx.fillText(block.phase, M, y);
    ctx.font = `14px ${FONT}`;
    ctx.fillStyle = T.muted;
    ctx.textAlign = "right";
    ctx.fillText(`${block.duration_min} min`, W - M, y);
    ctx.textAlign = "left";
    y += 30;
  });

  y += 12; rule(y);

  // ── nutrition ─────────────────────────────────────────────────────────────────

  y += 42;
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("NUTRITION", M, y);
  y += 16; rule(y); y += 32;

  const nutItems: { label: string; value: string }[] = [];
  if (plan.macros.protein_range) nutItems.push({ label: "PROTEIN", value: plan.macros.protein_range });
  nutItems.push({ label: "PRE-SESSION", value: plan.macros.pre_session_timing });
  nutItems.push({ label: "POST-SESSION", value: plan.macros.post_session_timing });

  nutItems.slice(0, 3).forEach((item) => {
    ctx.fillStyle = T.surface;
    ctx.fillRect(M, y - 4, W - M * 2, 60);
    ctx.font = `10px ${FONT}`;
    ctx.fillStyle = T.dimmed;
    ctx.fillText(item.label, M + 16, y + 14);
    ctx.font = `bold 16px ${FONT}`;
    ctx.fillStyle = T.text;
    ctx.fillText(item.value, M + 16, y + 36);
    y += 70;
  });

  // ── footer ────────────────────────────────────────────────────────────────────

  const footerY = H - 90;
  rule(footerY);

  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = T.dimmed;
  ctx.fillText("conceptclub.co.uk/form", M, H - 48);

  const igLabel = "@conceptathletic";
  const igSize = 22;
  const igGap = 8;
  ctx.font = `14px ${FONT}`;
  const igLabelW = ctx.measureText(igLabel).width;
  const igX = W - M - igLabelW - igGap - igSize;
  igIcon(igX, H - 48 - igSize + 4, igSize);
  ctx.fillStyle = T.muted;
  ctx.fillText(igLabel, igX + igSize + igGap, H - 48);

  return canvas;
}

// ─── Workout save card ────────────────────────────────────────────────────────

function buildWorkoutCardCanvas(
  plan: FormPlanOutput,
  input: FormInput | null,
  name?: string
): HTMLCanvasElement {
  const W = 1080;
  const M = 72;
  const CONTENT_W = W - M * 2;
  const FONT = "'ui-monospace', 'Cascadia Code', 'Fira Mono', monospace";
  const T = getFormCanvasTheme();
  const MAX_H = 5000;

  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = MAX_H;
  const ctx = offscreen.getContext("2d")!;

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

  const rule = (y: number) => {
    ctx.strokeStyle = T.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(W - M, y); ctx.stroke();
  };

  const sectionLabel = (text: string, y: number) => {
    ctx.font = `bold 11px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.fillText(text, M, y);
  };

  // ── background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, MAX_H);
  ctx.strokeStyle = T.grid; ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 90) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, MAX_H); ctx.stroke(); }
  for (let gy = 0; gy < MAX_H; gy += 90) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  let y = 82;

  // ── brand ───────────────────────────────────────────────────────────────────
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillStyle = T.text; ctx.fillText("concept", M, y);
  ctx.fillStyle = T.muted; ctx.fillText("//", M + ctx.measureText("concept").width, y);
  ctx.fillStyle = T.text; ctx.fillText("form", M + ctx.measureText("concept//").width, y);

  if (input) {
    const tag = `${formatSessionType(input.session_type)} · ${input.duration_minutes} min`;
    ctx.font = `14px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.textAlign = "right"; ctx.fillText(tag, W - M, y); ctx.textAlign = "left";
  }

  y = 110; rule(y); y += 52;

  // ── identity ─────────────────────────────────────────────────────────────────
  ctx.font = `13px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.fillText(name ? `${name.toUpperCase()}'S WORKOUT` : "WORKOUT PLAN", M, y);
  y += 52;

  ctx.fillStyle = T.text;
  const heroLines = wrapLines(plan.protocol_name, `bold 52px ${FONT}`, CONTENT_W);
  ctx.font = `bold 52px ${FONT}`;
  for (const line of heroLines) { ctx.fillText(line, M, y); y += 64; }
  y += 4;

  const descLines = wrapLines(plan.protocol_desc, `18px ${FONT}`, CONTENT_W);
  ctx.font = `18px ${FONT}`; ctx.fillStyle = T.muted;
  for (const line of descLines) { ctx.fillText(line, M, y); y += 28; }

  y += 44; rule(y); y += 48;

  // ── session structure ─────────────────────────────────────────────────────────
  sectionLabel("SESSION STRUCTURE", y);
  y += 18; rule(y); y += 20;

  plan.session_structure.forEach((block) => {
    ctx.fillStyle = T.surface2;
    ctx.fillRect(M, y, CONTENT_W, 46);
    ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = T.text;
    ctx.fillText(block.phase.toUpperCase(), M + 16, y + 29);
    ctx.font = `13px ${FONT}`; ctx.fillStyle = T.muted;
    ctx.textAlign = "right"; ctx.fillText(`${block.duration_min} min`, W - M - 16, y + 29);
    ctx.textAlign = "left";
    y += 52;

    block.items.forEach((item) => {
      const itemLines = wrapLines(`· ${item}`, `14px ${FONT}`, CONTENT_W - 24);
      ctx.font = `14px ${FONT}`; ctx.fillStyle = T.text;
      itemLines.forEach((l, i) => { ctx.fillText(i === 0 ? l : `  ${l.slice(2)}`, M + 20, y); y += 32; });
    });

    if (block.note) {
      const noteLines = wrapLines(block.note, `12px ${FONT}`, CONTENT_W - 24);
      ctx.font = `12px ${FONT}`; ctx.fillStyle = T.muted;
      noteLines.forEach((l) => { ctx.fillText(l, M + 20, y); y += 22; });
    }
    y += 20;
  });

  y += 16; rule(y); y += 48;

  // ── warm-up mobility detail ───────────────────────────────────────────────────
  sectionLabel("WARM-UP MOBILITY", y);
  y += 18; rule(y); y += 12;

  plan.warm_up_mobility.forEach((item, i) => {
    const rowH = 70;
    ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
    ctx.fillRect(M, y, CONTENT_W, rowH);
    ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = T.text;
    ctx.fillText(item.name, M + 16, y + 22);
    ctx.font = `12px ${FONT}`; ctx.fillStyle = T.muted;
    ctx.fillText(item.cue, M + 16, y + 44);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.textAlign = "right"; ctx.fillText(item.hold, W - M - 16, y + 38); ctx.textAlign = "left";
    y += rowH + 2;
  });

  y += 32; rule(y); y += 48;

  // ── cool-down mobility detail ─────────────────────────────────────────────────
  sectionLabel("COOL-DOWN MOBILITY", y);
  y += 18; rule(y); y += 12;

  plan.cool_down_mobility.forEach((item, i) => {
    const rowH = 70;
    ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
    ctx.fillRect(M, y, CONTENT_W, rowH);
    ctx.font = `bold 15px ${FONT}`; ctx.fillStyle = T.text;
    ctx.fillText(item.name, M + 16, y + 22);
    ctx.font = `12px ${FONT}`; ctx.fillStyle = T.muted;
    ctx.fillText(item.cue, M + 16, y + 44);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.textAlign = "right"; ctx.fillText(item.hold, W - M - 16, y + 38); ctx.textAlign = "left";
    y += rowH + 2;
  });

  y += 32; rule(y); y += 48;

  // ── nutrition ─────────────────────────────────────────────────────────────────
  sectionLabel("NUTRITION", y);
  y += 18; rule(y); y += 20;

  type NutSection = { label: string; timing: string; detail: string };
  const nutSections: NutSection[] = [];
  if (plan.macros.protein_range) {
    nutSections.push({ label: "PROTEIN TARGET", timing: plan.macros.protein_range, detail: plan.macros.protein_note });
  }
  nutSections.push({ label: "PRE-SESSION", timing: plan.macros.pre_session_timing, detail: plan.macros.pre_session_foods });
  nutSections.push({ label: "POST-SESSION", timing: plan.macros.post_session_timing, detail: plan.macros.post_session_foods });
  nutSections.push({ label: "CARBOHYDRATE PRIORITY", timing: plan.macros.carb_level.toUpperCase(), detail: plan.macros.carb_guidance });

  nutSections.forEach((item, i) => {
    const detailLines = wrapLines(item.detail, `12px ${FONT}`, CONTENT_W - 32);
    const rowH = 20 + 26 + detailLines.length * 20 + 24;
    ctx.fillStyle = i % 2 === 0 ? T.surface : "transparent";
    ctx.fillRect(M, y, CONTENT_W, rowH);
    ctx.font = `10px ${FONT}`; ctx.fillStyle = T.dimmed;
    ctx.fillText(item.label, M + 16, y + 18);
    ctx.font = `bold 17px ${FONT}`; ctx.fillStyle = T.text;
    ctx.fillText(item.timing, M + 16, y + 38);
    ctx.font = `12px ${FONT}`; ctx.fillStyle = T.muted;
    let dy = y + 58;
    detailLines.forEach((l) => { ctx.fillText(l, M + 16, dy); dy += 20; });
    y += rowH + 4;
  });

  y += 36;

  // ── footer ────────────────────────────────────────────────────────────────────
  rule(y); y += 36;
  ctx.font = `13px ${FONT}`; ctx.fillStyle = T.dimmed;
  ctx.fillText("conceptclub.co.uk/form", M, y);
  ctx.textAlign = "right"; ctx.fillText("concept//form", W - M, y);
  ctx.textAlign = "left";
  y += 56;

  // crop to content
  const finalH = y;
  const out = document.createElement("canvas");
  out.width = W; out.height = finalH;
  out.getContext("2d")!.drawImage(offscreen, 0, 0);
  return out;
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
  const [copied, setCopied]           = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [canShare]                    = useState(() => typeof navigator !== "undefined" && !!navigator.share);

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

  const handleSaveWorkout = async () => {
    setSavingWorkout(true);
    try {
      const canvas = buildWorkoutCardCanvas(plan, input, name);
      const link = document.createElement("a");
      link.download = "concept-form-workout.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSavingWorkout(false);
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
      {/* Save workout to device */}
      <div style={{ marginBottom: "20px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Gym reference
        </p>
        <button
          onClick={handleSaveWorkout}
          disabled={savingWorkout}
          style={{
            ...btnStyle(true),
            width: "100%",
            justifyContent: "center",
            padding: "13px 18px",
            fontSize: "14px",
          }}
        >
          {savingWorkout ? "Building…" : "↓ Save full workout to device"}
        </button>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.6 }}>
          Full workout card — structure, exercises, mobility, nutrition. Save to your camera roll and open in the gym.
        </p>
      </div>

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
                {input?.session_type ? formatSessionType(input.session_type) : ""} · {input?.goal} · {input?.duration_minutes} min
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
