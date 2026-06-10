"use client";

import { useMemo, useState } from "react";
import {
  parseTimeToSeconds,
  vdotFromPerformance,
  predictTime,
  fmtTime,
  type RaceDistance,
  type RaceInput,
  type Struggle,
  type SplitUnit,
  type ExperienceLevel,
  type AgeBand,
  type FitnessSource,
} from "@/lib/raceEngine";

// ─── OPTION MAPS ──────────────────────────────────────────────────────────────

const DIST_KM: Record<RaceDistance, number> = {
  "5k": 5, "10k": 10, half: 21.0975, marathon: 42.195,
};

const DISTANCES: { value: RaceDistance; label: string; desc: string }[] = [
  { value: "5k",       label: "5K",            desc: "Per-km or mile splits for both goals, pacing shape for your exact time, and a race morning protocol." },
  { value: "10k",      label: "10K",           desc: "Two full split tables with a marked decision point, pacing strategy, and fuelling notes." },
  { value: "half",     label: "Half marathon", desc: "Two split tables, a timed fuelling schedule, race week structure, and morning timeline." },
  { value: "marathon", label: "Marathon",      desc: "Full splits for both goals, km-by-km fuelling, race week day-by-day, and a morning timeline from wake-up to gun." },
];

const EXPERIENCE: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: "first_time", label: "First time", desc: "Never raced this distance before." },
  { value: "done_before", label: "Done it before", desc: "Raced it once or a few times." },
  { value: "racing_often", label: "Race it often", desc: "This distance is familiar territory." },
];

const AGE_BANDS: { value: AgeBand; label: string }[] = [
  { value: "under35", label: "Under 35" },
  { value: "35_44", label: "35 to 44" },
  { value: "45_54", label: "45 to 54" },
  { value: "55_plus", label: "55 and over" },
];

const STRUGGLES: { value: Struggle; label: string; desc: string }[] = [
  { value: "starts_too_fast", label: "I go out too fast", desc: "The first kilometre always feels free. The last ones pay for it." },
  { value: "fades_late", label: "I fade late", desc: "Strong through the middle, then the wheels loosen near the end." },
  { value: "fuelling", label: "Fuelling", desc: "Gels, timing, what to take and when. It is a bit of a guess." },
  { value: "long_run_motivation", label: "Long run motivation", desc: "Getting out the door for the big ones is the hardest session." },
  { value: "recovery", label: "Recovery", desc: "Backing up sessions is harder than the sessions themselves." },
  { value: "race_nerves", label: "Race day nerves", desc: "The morning gets to me before the race does." },
  { value: "pacing_blind", label: "Judging pace", desc: "Without the watch I genuinely could not tell you what pace I am running." },
];

const STEPS = [
  "the race",
  "where you are",
  "the goal",
  "your training",
  "the honest bit",
  "fuelling",
  "your plan",
] as const;

// ─── SMALL UI PIECES ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px",
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {children}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ color: "var(--danger)", fontSize: "12px", marginTop: "6px" }}>{msg}</p>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", fontSize: "15px",
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "6px", color: "var(--text)",
  fontFamily: "inherit", outline: "none",
};

function Card({
  selected, onClick, title, desc,
}: {
  selected: boolean; onClick: () => void; title: string; desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left", width: "100%", padding: "16px",
        background: selected ? "var(--surface-2)" : "var(--surface)",
        border: selected ? "1px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "6px", cursor: "pointer", color: "var(--text)",
        fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <span style={{ display: "block", fontSize: "14px", fontWeight: 700, letterSpacing: "-0.01em" }}>
        {title}
      </span>
      {desc && (
        <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.55 }}>
          {desc}
        </span>
      )}
    </button>
  );
}

// ─── LIVE COVER PREVIEW ───────────────────────────────────────────────────────
// The plan's cover page typesets itself as answers come in.

function CoverPreview({
  firstName, raceName, distance, raceDate, goalA, goalB,
}: {
  firstName: string; raceName: string; distance: RaceDistance | null;
  raceDate: string; goalA: string; goalB: string;
}) {
  const Rule = ({ w }: { w: string }) => (
    <span style={{
      display: "inline-block", width: w, height: "1px",
      background: "var(--border)", verticalAlign: "middle",
    }} />
  );
  const dateStr = raceDate
    ? new Date(raceDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const distLabel = distance ? DISTANCES.find((d) => d.value === distance)?.label : null;

  return (
    <div
      aria-hidden
      style={{
        border: "1px solid var(--border)", borderRadius: "6px",
        padding: "20px 22px", background: "var(--surface)",
        marginBottom: "28px",
      }}
    >
      <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
        concept//race · race plan
      </p>
      <p style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.25, color: "var(--text)", margin: 0 }}>
        {firstName ? firstName : <Rule w="90px" />}
        <span style={{ color: "var(--text-muted)" }}> · </span>
        {raceName ? raceName : distLabel ? distLabel : <Rule w="130px" />}
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", marginBottom: 0 }}>
        {dateStr ? dateStr : <Rule w="110px" />}
        <span style={{ margin: "0 8px" }}>·</span>
        A goal {goalA ? <strong style={{ color: "var(--text)" }}>{goalA}</strong> : <Rule w="50px" />}
        <span style={{ margin: "0 8px" }}>·</span>
        B goal {goalB ? <strong style={{ color: "var(--text)" }}>{goalB}</strong> : <Rule w="50px" />}
      </p>
    </div>
  );
}

// ─── WIZARD ───────────────────────────────────────────────────────────────────

export default function RaceWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Step 1: the race
  const [distance, setDistance] = useState<RaceDistance | null>(null);
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");

  // Step 2: fitness
  const [fitnessSource, setFitnessSource] = useState<FitnessSource>("recent_race");
  const [markerDistance, setMarkerDistance] = useState<RaceDistance>("5k");
  const [markerTime, setMarkerTime] = useState("");

  // Step 3: goals
  const [goalA, setGoalA] = useState("");
  const [goalB, setGoalB] = useState("");

  // Step 4: context
  const [runsPerWeek, setRunsPerWeek] = useState<number>(4);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [longestRecent, setLongestRecent] = useState("");

  // Step 5: struggles
  const [struggles, setStruggles] = useState<Struggle[]>([]);

  // Step 6: fuelling
  const [fuelIntent, setFuelIntent] = useState<RaceInput["fuelling_in_race"] | null>(null);

  // Step 7: identity
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [splitUnit, setSplitUnit] = useState<SplitUnit>("km");

  // Live fitness read, shown on the goals step. This is the moment the
  // product proves it has been listening.
  const fitnessRead = useMemo(() => {
    const t = parseTimeToSeconds(markerTime);
    if (!t || !distance) return null;
    let vdot = vdotFromPerformance(DIST_KM[markerDistance], t);
    if (fitnessSource === "estimate") vdot *= 0.985;
    const predicted = predictTime(DIST_KM[distance], vdot);
    return { vdot, predicted };
  }, [markerTime, markerDistance, distance, fitnessSource]);

  const weeksOut = useMemo(() => {
    if (!raceDate) return 0;
    const ms = new Date(raceDate + "T12:00:00").getTime() - Date.now();
    return Math.max(0, Math.round(ms / (7 * 24 * 3600 * 1000)));
  }, [raceDate]);

  // ── validation per step ──
  function validate(): string | undefined {
    if (step === 0) {
      if (!distance) return "Pick your distance.";
      if (!raceDate) return "Pick your race date.";
      if (new Date(raceDate + "T12:00:00").getTime() < Date.now()) return "That date is in the past.";
    }
    if (step === 1) {
      const t = parseTimeToSeconds(markerTime);
      if (!t) return "Enter a time as MM:SS or H:MM:SS.";
      const km = DIST_KM[markerDistance];
      const pace = t / km;
      if (pace < 150 || pace > 720) return "That pace looks off. Double check the time and distance.";
    }
    if (step === 2) {
      const a = parseTimeToSeconds(goalA);
      const b = parseTimeToSeconds(goalB);
      if (!a) return "Enter your A goal as MM:SS or H:MM:SS.";
      if (!b) return "Enter your B goal as MM:SS or H:MM:SS.";
      if (b < a) return "Your B goal should be the slower of the two.";
      if (distance) {
        const pace = a / DIST_KM[distance];
        if (pace < 150 || pace > 720) return "That goal pace looks off for this distance.";
      }
    }
    if (step === 3) {
      if (!experience) return "Pick your experience level.";
      if (!ageBand) return "Pick your age band.";
      if ((distance === "marathon" || distance === "half") && longestRecent) {
        const v = parseFloat(longestRecent);
        if (isNaN(v) || v < 0 || v > 60) return "Longest recent run looks off.";
      }
    }
    if (step === 5) {
      if (!fuelIntent) return "Pick one. There is no wrong answer.";
    }
    if (step === 6) {
      if (!firstName.trim()) return "Your first name goes on the cover.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Enter a valid email. Your plan link is sent there.";
    }
    return undefined;
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(undefined);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(undefined);
    setStep((s) => Math.max(s - 1, 0));
  }

  function toggleStruggle(s: Struggle) {
    setStruggles((curr) =>
      curr.includes(s) ? curr.filter((x) => x !== s) : curr.length >= 3 ? curr : [...curr, s]
    );
  }

  async function checkout() {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError(undefined);

    const input: RaceInput = {
      distance: distance!,
      race_name: raceName.trim() || undefined,
      race_date: raceDate,
      fitness_source: fitnessSource,
      marker_distance: markerDistance,
      marker_time_s: parseTimeToSeconds(markerTime)!,
      goal_a_s: parseTimeToSeconds(goalA)!,
      goal_b_s: parseTimeToSeconds(goalB)!,
      weeks_out: weeksOut,
      runs_per_week: runsPerWeek,
      experience: experience!,
      age_band: ageBand!,
      longest_recent_km: longestRecent ? parseFloat(longestRecent) : undefined,
      struggles,
      fuelling_in_race: fuelIntent!,
      split_unit: splitUnit,
      first_name: firstName.trim(),
    };

    try {
      const res = await fetch("/api/race/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, email }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Checkout could not start. Try again in a moment.");
        setSubmitting(false);
      }
    } catch {
      setError("Checkout could not start. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  // ── render ──
  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Progress */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>
          {STEPS[step]}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
          {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
        </p>
      </div>
      <div style={{ height: "2px", background: "var(--border)", borderRadius: "1px", marginBottom: "24px" }}>
        <div style={{
          height: "100%", borderRadius: "1px", background: "var(--accent)",
          width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.3s ease",
        }} />
      </div>

      <CoverPreview
        firstName={firstName}
        raceName={raceName}
        distance={distance}
        raceDate={raceDate}
        goalA={parseTimeToSeconds(goalA) ? fmtTime(parseTimeToSeconds(goalA)!) : ""}
        goalB={parseTimeToSeconds(goalB) ? fmtTime(parseTimeToSeconds(goalB)!) : ""}
      />

      {/* ── STEP 1: THE RACE ── */}
      {step === 0 && (
        <div>
          <Label>Distance</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            {DISTANCES.map((d) => (
              <Card key={d.value} selected={distance === d.value} onClick={() => setDistance(d.value)} title={d.label} desc={d.desc} />
            ))}
          </div>
          <Label>Race date</Label>
          <input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} style={inputStyle} />
          {weeksOut > 0 && <Hint>{weeksOut} {weeksOut === 1 ? "week" : "weeks"} from today. Noted.</Hint>}
          <div style={{ marginTop: "20px" }}>
            <Label>Race name <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional, goes on your cover)</span></Label>
            <input
              type="text" value={raceName} onChange={(e) => setRaceName(e.target.value)}
              placeholder="e.g. Chester Marathon" style={inputStyle} maxLength={60}
            />
          </div>
        </div>
      )}

      {/* ── STEP 2: FITNESS ── */}
      {step === 1 && (
        <div>
          <Label>Your fitness marker</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            <Card
              selected={fitnessSource === "recent_race"}
              onClick={() => setFitnessSource("recent_race")}
              title="A recent race"
              desc="A race or parkrun in the last 12 weeks. The most honest marker there is."
            />
            <Card
              selected={fitnessSource === "estimate"}
              onClick={() => setFitnessSource("estimate")}
              title="An honest estimate"
              desc="What you could run right now for an all-out effort. Be honest, the plan depends on it."
            />
          </div>
          <Label>Distance</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {DISTANCES.map((d) => (
              <button
                key={d.value} type="button" onClick={() => setMarkerDistance(d.value)}
                style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer",
                  fontFamily: "inherit",
                  background: markerDistance === d.value ? "var(--accent)" : "var(--surface)",
                  color: markerDistance === d.value ? "var(--bg)" : "var(--text)",
                  border: markerDistance === d.value ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <Label>{fitnessSource === "recent_race" ? "Your time" : "Your honest all-out time"}</Label>
          <input
            type="text" inputMode="numeric" value={markerTime}
            onChange={(e) => setMarkerTime(e.target.value)}
            placeholder={markerDistance === "marathon" ? "e.g. 3:45:00" : markerDistance === "half" ? "e.g. 1:52:30" : "e.g. 24:30"}
            style={inputStyle}
          />
          <Hint>This single number calibrates everything that follows. No template gets used. Your splits, your race read, and your pacing shape all come from it.</Hint>
        </div>
      )}

      {/* ── STEP 3: GOALS ── */}
      {step === 2 && (
        <div>
          {fitnessRead && (
            <div style={{
              padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "6px",
              background: "var(--surface)", marginBottom: "20px",
            }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                Based on your marker, your current fitness points to roughly{" "}
                <strong style={{ color: "var(--text)", fontSize: "14px" }}>{fmtTime(fitnessRead.predicted)}</strong>{" "}
                for this distance on a good day. Set your goals with that in mind, or against it. Your call. The plan will give you an honest read either way.
              </p>
            </div>
          )}
          <Label>A goal: the perfect day</Label>
          <input
            type="text" inputMode="numeric" value={goalA} onChange={(e) => setGoalA(e.target.value)}
            placeholder={distance === "marathon" ? "e.g. 3:29:59" : distance === "half" ? "e.g. 1:44:59" : "e.g. 22:30"}
            style={inputStyle}
          />
          <div style={{ marginTop: "20px" }}>
            <Label>B goal: the tough day</Label>
            <input
              type="text" inputMode="numeric" value={goalB} onChange={(e) => setGoalB(e.target.value)}
              placeholder={distance === "marathon" ? "e.g. 3:39:59" : distance === "half" ? "e.g. 1:49:59" : "e.g. 23:30"}
              style={inputStyle}
            />
          </div>
          <Hint>Both get a full split table. You race the B splits until the decision point, then upgrade if you have earned it. That structure is how you protect the A goal instead of gambling it.</Hint>
        </div>
      )}

      {/* ── STEP 4: CONTEXT ── */}
      {step === 3 && (
        <div>
          <Label>Runs per week right now</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n} type="button" onClick={() => setRunsPerWeek(n)}
                style={{
                  width: "44px", height: "44px", borderRadius: "6px", fontSize: "14px",
                  cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                  background: runsPerWeek === n ? "var(--accent)" : "var(--surface)",
                  color: runsPerWeek === n ? "var(--bg)" : "var(--text)",
                  border: runsPerWeek === n ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <Label>This distance and you</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {EXPERIENCE.map((e) => (
              <Card key={e.value} selected={experience === e.value} onClick={() => setExperience(e.value)} title={e.label} desc={e.desc} />
            ))}
          </div>
          <Label>Age band</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: (distance === "half" || distance === "marathon") ? "20px" : 0, flexWrap: "wrap" }}>
            {AGE_BANDS.map((a) => (
              <button
                key={a.value} type="button" onClick={() => setAgeBand(a.value)}
                style={{
                  padding: "8px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
                  background: ageBand === a.value ? "var(--accent)" : "var(--surface)",
                  color: ageBand === a.value ? "var(--bg)" : "var(--text)",
                  border: ageBand === a.value ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
          {(distance === "half" || distance === "marathon") && (
            <div>
              <Label>Longest run in the last 6 weeks, in km <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></Label>
              <input
                type="text" inputMode="decimal" value={longestRecent}
                onChange={(e) => setLongestRecent(e.target.value)}
                placeholder="e.g. 18" style={inputStyle}
              />
              <Hint>This changes the advice in your plan, especially the late-race sections. Honest answers make better plans.</Hint>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 5: STRUGGLES ── */}
      {step === 4 && (
        <div>
          <Label>What actually goes wrong</Label>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "16px" }}>
            Pick up to three. Each one you select gets its own section in your plan: why it happens, and the exact decisions to make in advance so it does not happen this time. Skip this step if nothing fits.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {STRUGGLES.map((s) => (
              <Card
                key={s.value}
                selected={struggles.includes(s.value)}
                onClick={() => toggleStruggle(s.value)}
                title={s.label}
                desc={s.desc}
              />
            ))}
          </div>
          {struggles.length >= 3 && <Hint>Three is the limit. Focus beats coverage.</Hint>}
        </div>
      )}

      {/* ── STEP 6: FUELLING ── */}
      {step === 5 && (
        <div>
          <Label>Do you currently fuel during races?</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Card selected={fuelIntent === "yes"} onClick={() => setFuelIntent("yes")} title="Yes" desc="Gels or carbs on a schedule, more or less." />
            <Card selected={fuelIntent === "no"} onClick={() => setFuelIntent("no")} title="No" desc="Water if anything. Never really fuelled in a race." />
            <Card selected={fuelIntent === "not_sure"} onClick={() => setFuelIntent("not_sure")} title="Not sure what I should be doing" desc="There is a lot of noise out there. Honest answer." />
          </div>
          {(distance === "half" || distance === "marathon") && (fuelIntent === "no" || fuelIntent === "not_sure") && (
            <Hint>
              Noted. For your distance this is probably the biggest free improvement available to you, and your plan will treat it that way.
            </Hint>
          )}
        </div>
      )}

      {/* ── STEP 7: REVIEW + DETAILS ── */}
      {step === 6 && (
        <div>
          <Label>Splits in</Label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {(["km", "mi"] as SplitUnit[]).map((u) => (
              <button
                key={u} type="button" onClick={() => setSplitUnit(u)}
                style={{
                  padding: "8px 24px", borderRadius: "20px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
                  background: splitUnit === u ? "var(--accent)" : "var(--surface)",
                  color: splitUnit === u ? "var(--bg)" : "var(--text)",
                  border: splitUnit === u ? "1px solid var(--accent)" : "1px solid var(--border)",
                }}
              >
                {u === "km" ? "Kilometres" : "Miles"}
              </button>
            ))}
          </div>
          <Label>First name</Label>
          <input
            type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
            placeholder="Goes on the cover" style={inputStyle} maxLength={40}
          />
          <div style={{ marginTop: "20px", marginBottom: "24px" }}>
            <Label>Email</Label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your plan link is sent here" style={inputStyle}
            />
          </div>

          <div style={{
            padding: "18px 20px", border: "1px solid var(--border)", borderRadius: "6px",
            background: "var(--surface)", marginBottom: "8px",
          }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 10px 0", lineHeight: 1.65 }}>
              What you get after payment:
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--text)", lineHeight: 1.9 }}>
              <li>An honest read on your goal against your current fitness</li>
              <li>Full split tables for both goals, with a marked decision point</li>
              <li>Your race week, day by day</li>
              <li>A race morning timeline from wake-up to the gun</li>
              <li>Fuelling guidance built for your distance and goal time</li>
              {struggles.length > 0 && (
                <li>{struggles.length === 1 ? "A protocol" : `${struggles.length} protocols`} for what you told us goes wrong</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <ErrorText msg={error} />

      {/* Navigation */}
      <div style={{ display: "flex", gap: "12px", marginTop: "28px", alignItems: "center" }}>
        {step > 0 && (
          <button
            type="button" onClick={back}
            style={{
              padding: "12px 20px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
              fontFamily: "inherit", background: "transparent",
              border: "1px solid var(--border)", color: "var(--text-muted)",
            }}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button" onClick={next}
            style={{
              padding: "12px 28px", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              background: "var(--accent)", color: "var(--bg)", border: "1px solid var(--accent)",
            }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button" onClick={checkout} disabled={submitting}
            style={{
              padding: "14px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 700,
              cursor: submitting ? "wait" : "pointer", fontFamily: "inherit",
              background: "var(--accent)", color: "var(--bg)", border: "1px solid var(--accent)",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Opening checkout" : "Get my plan · £10"}
          </button>
        )}
        {step === STEPS.length - 1 && !submitting && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            Early access price. Secure payment by Stripe.
          </p>
        )}
      </div>
    </div>
  );
}
