"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PlanSession } from "@/lib/weeklyPlanEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profile {
  id:                   string;
  name:                 string | null;
  avatar_url:           string | null;
  weight_kg:            number | null;
  height_cm:            number | null;
  date_of_birth:        string | null;
  sex:                  string | null;
  default_goal:         string | null;
  default_style:        string | null;
}

interface SavedWorkout {
  id:               string;
  created_at:       string;
  label:            string | null;
  session_type:     string[];
  goal:             string | null;
  duration_minutes: number | null;
}

interface SavedFuelPlan {
  id:         string;
  created_at: string;
  event_name: string | null;
}

interface TrainingPlan {
  id:              string;
  name:            string;
  goal:            string;
  training_style:  string;
  days_per_week:   number;
  block_weeks:     number;
  starts_on:       string;
  active:          boolean;
  sessions:        WeekPhaseRow[];
  preferred_days?: string[];
}

interface WeekPhaseRow {
  week_number: number;
  phase_name:  string;
  phase_note:  string;
  sessions:    PlanSession[];
}

interface PlanCompletion {
  week_number:   number;
  session_index: number;
  completed_at:  string;
}

interface AllPlan {
  id:         string;
  name:       string;
  goal:       string;
  block_weeks: number;
  starts_on:  string;
  active:     boolean;
  created_at: string;
}

interface RunPlan {
  id:              string;
  name:            string;
  tier:            number;
  goal_race:       string;
  race_date:       string | null;
  plan_weeks:      number;
  starts_on:       string;
  training_zones:  { easy: string; tempo: string; threshold: string; interval: string; rep: string } | null;
  weeks:           import("@/lib/runEngine").RunWeek[];
  status:          string;
}

interface RunCompletion {
  week_number:   number;
  session_index: number;
  completed_at:  string;
}

// ── Goal labels ───────────────────────────────────────────────────────────────

const GOAL_LABELS: Record<string, string> = {
  strength:    "Strength",
  hypertrophy: "Build muscle",
  power:       "Power",
  endurance_sc: "Endurance S&C",
  plyo:        "Plyometrics",
  aesthetic:   "Aesthetic & strong",
  mobility:    "Mobility & yoga",
  general:     "General fitness",
};

const FUEL_NOTES: Record<string, { preSession: string; inSession: string; postSession: string; raceDay?: string; notes?: string }> = {
  strength:    { preSession: "2–3 hrs before: 40–60g carbs + 25–35g protein.", inSession: "Water only under 75 min. Longer: 20–30g carbs/hr.", postSession: "Within 30 min: 30–40g protein + 40–60g fast carbs." },
  hypertrophy: { preSession: "2 hrs before: 40–70g carbs + 20–30g protein.", inSession: "Sip water. Over 90 min: 20–30g carbs/hr.", postSession: "Within 30 min: 40g protein + 60–80g carbs." },
  endurance_sc: { preSession: "2–3 hrs before: 60–80g carbs, moderate protein.", inSession: "60g carbs/hr over 60 min. Every 20 min: 1 gel or 500ml sports drink.", postSession: "Within 30 min: 30–40g protein + 60–80g carbs + electrolytes.", raceDay: "3 hrs pre-race: 80–120g carbs, low fibre. 30 min pre: 25g fast carbs. On course: 60–90g carbs/hr every 20 min." },
  power:       { preSession: "2 hrs before: 50–60g carbs, low fibre.", inSession: "Water + electrolytes. Over 60 min: 20–30g carbs.", postSession: "Within 30 min: 35–50g protein + 40–60g fast carbs." },
  plyo:        { preSession: "2–3 hrs before: 50–70g carbs, low fibre, well hydrated.", inSession: "Water only — sessions are typically short.", postSession: "Within 30 min: 30–40g protein + 50g carbs." },
  aesthetic:   { preSession: "1.5–2 hrs before: 30–50g carbs + 20–25g protein.", inSession: "Water. No in-session fuel needed under 75 min.", postSession: "Immediately: 30–40g protein. Carbs based on deficit." },
  general:     { preSession: "1.5–2 hrs before: 30–50g carbs + 20g protein.", inSession: "Water. Over 60 min: 20–30g carbs optional.", postSession: "Within 60 min: 25–35g protein + 40–60g carbs." },
  mobility:    { preSession: "1–2 hrs before: light snack, 20–30g carbs. Avoid training on full stomach.", inSession: "Water throughout. No additional fuel needed.", postSession: "20–30g protein after to support tissue repair." },
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase",
  color: "var(--text-muted)", marginBottom: "14px",
};
const inputStyle: React.CSSProperties = { width: "100%", fontSize: "13px" };
const fieldLabel: React.CSSProperties = {
  fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "5px",
  letterSpacing: "0.1em", textTransform: "uppercase",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [workouts,     setWorkouts]     = useState<SavedWorkout[]>([]);
  const [fuelPlans,    setFuelPlans]    = useState<SavedFuelPlan[]>([]);
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null);
  const [draft,        setDraft]        = useState<Partial<Profile>>({});
  const [activePlan,     setActivePlan]     = useState<TrainingPlan | null>(null);
  const [completions,    setCompletions]    = useState<PlanCompletion[]>([]);
  const [allPlans,       setAllPlans]       = useState<AllPlan[]>([]);
  const [expandedWeek,   setExpandedWeek]   = useState<number>(0);
  const [activeRunPlan,  setActiveRunPlan]  = useState<RunPlan | null>(null);
  const [runCompletions, setRunCompletions] = useState<RunCompletion[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // Load profile
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) { setProfile(data); setDraft(data); }
      });

    // Load saved workouts
    supabase.from("saved_workouts")
      .select("id, created_at, label, session_type, goal, duration_minutes")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setWorkouts(data); });

    // Load saved fuel plans
    supabase.from("saved_fuel_plans")
      .select("id, created_at, event_name")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setFuelPlans(data); });

    // Load active training plan
    supabase.from("training_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setActivePlan(data as TrainingPlan);
          supabase.from("plan_completions")
            .select("week_number, session_index, completed_at")
            .eq("plan_id", data.id)
            .then(({ data: completionData }) => {
              if (completionData) setCompletions(completionData);
            });
        }
      });

    // Load active run plan
    supabase.from("run_plans")
      .select("id, name, tier, goal_race, race_date, plan_weeks, starts_on, training_zones, weeks, status")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setActiveRunPlan(data as RunPlan);
          supabase.from("run_completions")
            .select("week_number, session_index, completed_at")
            .eq("plan_id", data.id)
            .then(({ data: rc }) => { if (rc) setRunCompletions(rc); });
        }
      });

    // Load all training plans
    supabase.from("training_plans")
      .select("id, name, goal, block_weeks, starts_on, active, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setAllPlans(data as AllPlan[]); });
  }, [user]);

  // ── Avatar upload ────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`; // cache-bust
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      setProfile(p => p ? { ...p, avatar_url: url } : p);
    }
    setUploading(false);
  };

  // ── Save profile ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const updates = {
      name:           draft.name ?? null,
      weight_kg:      draft.weight_kg ?? null,
      height_cm:      draft.height_cm ?? null,
      date_of_birth:  draft.date_of_birth ?? null,
      sex:            draft.sex ?? null,
      default_goal:   draft.default_goal ?? null,
      default_style:  draft.default_style ?? null,
      updated_at:     new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) {
      setProfile(p => p ? { ...p, ...updates } : p);
      // Keep localStorage name in sync
      if (draft.name) localStorage.setItem("cf_name", draft.name);
      setEditing(false);
      setSaveMsg("Saved.");
      setTimeout(() => setSaveMsg(null), 2000);
    }
    setSaving(false);
  };

  // ── Delete saved item ────────────────────────────────────────────────────────

  const deleteWorkout = async (id: string) => {
    const supabase = createClient();
    await supabase.from("saved_workouts").delete().eq("id", id);
    setWorkouts(w => w.filter(x => x.id !== id));
  };

  const deleteFuelPlan = async (id: string) => {
    const supabase = createClient();
    await supabase.from("saved_fuel_plans").delete().eq("id", id);
    setFuelPlans(f => f.filter(x => x.id !== id));
  };

  // ── Training plan helpers ────────────────────────────────────────────────────

  function getCurrentWeek(startsOn: string): number {
    const start = new Date(startsOn);
    const today = new Date();
    const diffMs = today.getTime() - start.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(diffWeeks + 1, 1), activePlan?.block_weeks ?? 1);
  }

  const handleCompleteSession = async (weekNumber: number, sessionIndex: number) => {
    if (!activePlan || !user) return;
    const supabase = createClient();
    const isComplete = completions.some(
      c => c.week_number === weekNumber && c.session_index === sessionIndex
    );
    if (isComplete) {
      await supabase.from("plan_completions")
        .delete()
        .eq("plan_id", activePlan.id)
        .eq("week_number", weekNumber)
        .eq("session_index", sessionIndex);
      setCompletions(prev =>
        prev.filter(c => !(c.week_number === weekNumber && c.session_index === sessionIndex))
      );
    } else {
      await supabase.from("plan_completions")
        .upsert({
          plan_id: activePlan.id,
          user_id: user.id,
          week_number: weekNumber,
          session_index: sessionIndex,
        });
      setCompletions(prev => [...prev, { week_number: weekNumber, session_index: sessionIndex, completed_at: new Date().toISOString() }]);
    }
  };

  const handleCompleteRunSession = async (weekNumber: number, sessionIndex: number) => {
    if (!activeRunPlan || !user) return;
    const supabase = createClient();
    const isDone = runCompletions.some(c => c.week_number === weekNumber && c.session_index === sessionIndex);
    if (isDone) {
      await supabase.from("run_completions").delete()
        .eq("plan_id", activeRunPlan.id).eq("week_number", weekNumber).eq("session_index", sessionIndex);
      setRunCompletions(prev => prev.filter(c => !(c.week_number === weekNumber && c.session_index === sessionIndex)));
    } else {
      await supabase.from("run_completions").upsert({ plan_id: activeRunPlan.id, user_id: user.id, week_number: weekNumber, session_index: sessionIndex });
      setRunCompletions(prev => [...prev, { week_number: weekNumber, session_index: sessionIndex, completed_at: new Date().toISOString() }]);
    }
  };

  // ── Streak + stats ───────────────────────────────────────────────────────────

  function calcStats(plan: TrainingPlan, comps: PlanCompletion[]) {
    const startDate = new Date(plan.starts_on + "T00:00:00");

    // Build a set of weeks that had at least one session completed
    const weeksWithActivity = new Set(comps.map(c => c.week_number));

    // Week streak: count backwards from the current week
    const currentWeek = getCurrentWeek(plan.starts_on);
    let streak = 0;
    for (let w = currentWeek; w >= 1; w--) {
      if (weeksWithActivity.has(w)) {
        streak++;
      } else {
        break;
      }
    }

    // This week's completions
    const thisWeekDone  = comps.filter(c => c.week_number === currentWeek).length;
    const thisWeekTotal = plan.days_per_week;

    // Overall block progress
    const totalSessions    = plan.days_per_week * plan.block_weeks;
    const completedSessions = comps.length;
    const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Days trained this week (unique days from completed_at)
    const thisWeekDates = new Set(
      comps
        .filter(c => c.week_number === currentWeek)
        .map(c => c.completed_at.slice(0, 10))
    );

    return { streak, thisWeekDone, thisWeekTotal, completedSessions, totalSessions, progressPct, currentWeek };
  }

  // ── Render: not signed in ────────────────────────────────────────────────────

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="cf-page" style={{ textAlign: "center", paddingTop: "80px" }}>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>
          concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · profile
        </p>
        <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "12px" }}>Your profile</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "28px" }}>
          Sign in to save workouts, fuel plans and track your training history.
        </p>
        <button
          onClick={() => openAuth("signin")}
          style={{
            padding: "12px 28px", background: "var(--accent)", color: "var(--bg)",
            border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Sign in →
        </button>
        <p style={{ marginTop: "14px", fontSize: "12px", color: "var(--text-muted)" }}>
          No account?{" "}
          <button onClick={() => openAuth("signup")} style={{ background: "none", border: "none", color: "var(--text-muted)", textDecoration: "underline", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
            Create one
          </button>
        </p>
      </div>
    );
  }

  // ── Render: signed in ────────────────────────────────────────────────────────

  const displayName = profile?.name || user.email?.split("@")[0] || "Member";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="cf-page" style={{ maxWidth: "680px" }}>

      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <p style={sectionLabel}>
          concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · profile
        </p>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "8px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url} alt="Avatar"
                style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }}
              />
            ) : (
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "var(--accent)", color: "var(--bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: 700,
              }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                position: "absolute", bottom: -2, right: -2,
                width: "22px", height: "22px", borderRadius: "50%",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                cursor: "pointer", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="Change avatar"
            >
              {uploading ? "…" : "+"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>

          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "2px" }}>
              {displayName}
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── Profile details ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <p style={sectionLabel}>Profile details</p>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setEditing(false); setDraft(profile ?? {}); }} style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{ fontSize: "12px", fontWeight: 600, color: "var(--bg)", background: "var(--accent)", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
        {saveMsg && <p style={{ fontSize: "12px", color: "var(--success, #44cc88)", marginBottom: "12px" }}>{saveMsg}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Name */}
          <div>
            <label style={fieldLabel}>Name</label>
            {editing ? (
              <input style={inputStyle} type="text" value={draft.name ?? ""} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            ) : (
              <p style={{ fontSize: "13px", color: profile?.name ? "var(--text)" : "var(--text-muted)" }}>{profile?.name || "—"}</p>
            )}
          </div>

          {/* Sex */}
          <div>
            <label style={fieldLabel}>Sex</label>
            {editing ? (
              <select style={{ ...inputStyle }} value={draft.sex ?? ""} onChange={e => setDraft(d => ({ ...d, sex: e.target.value }))}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / prefer not to say</option>
              </select>
            ) : (
              <p style={{ fontSize: "13px", color: profile?.sex ? "var(--text)" : "var(--text-muted)" }}>{profile?.sex || "—"}</p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label style={fieldLabel}>Weight (kg)</label>
            {editing ? (
              <input style={inputStyle} type="number" min={30} max={250} step={0.1} value={draft.weight_kg ?? ""} onChange={e => setDraft(d => ({ ...d, weight_kg: e.target.value ? parseFloat(e.target.value) : null }))} />
            ) : (
              <p style={{ fontSize: "13px", color: profile?.weight_kg ? "var(--text)" : "var(--text-muted)" }}>{profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</p>
            )}
          </div>

          {/* Height */}
          <div>
            <label style={fieldLabel}>Height (cm)</label>
            {editing ? (
              <input style={inputStyle} type="number" min={100} max={250} step={1} value={draft.height_cm ?? ""} onChange={e => setDraft(d => ({ ...d, height_cm: e.target.value ? parseFloat(e.target.value) : null }))} />
            ) : (
              <p style={{ fontSize: "13px", color: profile?.height_cm ? "var(--text)" : "var(--text-muted)" }}>{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</p>
            )}
          </div>

          {/* DOB */}
          <div>
            <label style={fieldLabel}>Date of birth</label>
            {editing ? (
              <input style={inputStyle} type="date" value={draft.date_of_birth ?? ""} onChange={e => setDraft(d => ({ ...d, date_of_birth: e.target.value || null }))} />
            ) : (
              <p style={{ fontSize: "13px", color: profile?.date_of_birth ? "var(--text)" : "var(--text-muted)" }}>{profile?.date_of_birth || "—"}</p>
            )}
          </div>

          {/* Default goal */}
          <div>
            <label style={fieldLabel}>Default goal</label>
            {editing ? (
              <select style={inputStyle} value={draft.default_goal ?? ""} onChange={e => setDraft(d => ({ ...d, default_goal: e.target.value || null }))}>
                <option value="">—</option>
                <option value="strength">Strength</option>
                <option value="hypertrophy">Hypertrophy</option>
                <option value="athletic">Athletic</option>
                <option value="aesthetic">Aesthetic</option>
                <option value="general">General</option>
              </select>
            ) : (
              <p style={{ fontSize: "13px", color: profile?.default_goal ? "var(--text)" : "var(--text-muted)" }}>{profile?.default_goal || "—"}</p>
            )}
          </div>

          {/* Default style */}
          <div>
            <label style={fieldLabel}>Default training style</label>
            {editing ? (
              <select style={inputStyle} value={draft.default_style ?? ""} onChange={e => setDraft(d => ({ ...d, default_style: e.target.value || null }))}>
                <option value="">—</option>
                <option value="free_weights">Free weights</option>
                <option value="machines">Machines</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="mixed">Mixed</option>
              </select>
            ) : (
              <p style={{ fontSize: "13px", color: profile?.default_style ? "var(--text)" : "var(--text-muted)" }}>{profile?.default_style?.replace("_", " ") || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── This week ───────────────────────────────────────────────────────── */}
      {(activeRunPlan || activePlan) && (() => {
        const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const today = new Date();
        const todayDay = today.getDay(); // 0=Sun
        const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);

        // Combined sessions: { source, label, desc, dayIndex, planKey, sessionIndex, weekNum }
        type WeekItem = { source: "run" | "gym"; label: string; desc: string; duration?: number; dayIndex: number; sessionIndex: number; weekNum: number; done: boolean };
        const items: WeekItem[] = [];

        // ── Run plan sessions for this week ──────────────────────────────────
        if (activeRunPlan) {
          const runStart = new Date(activeRunPlan.starts_on + "T00:00:00");
          const diffW = Math.floor((today.getTime() - runStart.getTime()) / (7 * 24 * 3600 * 1000));
          const runWeekNum = Math.min(Math.max(diffW + 1, 1), activeRunPlan.plan_weeks);
          const runWeekData = activeRunPlan.weeks.find(w => w.week_number === runWeekNum);
          if (runWeekData) {
            // available_days is not in RunPlan interface yet — distribute evenly Mon-Sun
            runWeekData.sessions.forEach((s, i) => {
              const dayIndex = Math.min(i * Math.floor(7 / runWeekData.sessions.length), 6);
              items.push({
                source: "run", label: s.label,
                desc: s.description,
                duration: s.duration_min,
                dayIndex, sessionIndex: i, weekNum: runWeekNum,
                done: runCompletions.some(c => c.week_number === runWeekNum && c.session_index === i),
              });
            });
          }
        }

        // ── Gym plan sessions for this week ──────────────────────────────────
        if (activePlan) {
          const gymStart = new Date(activePlan.starts_on + "T00:00:00");
          const diffW = Math.floor((today.getTime() - gymStart.getTime()) / (7 * 24 * 3600 * 1000));
          const gymWeekNum = Math.min(Math.max(diffW + 1, 1), activePlan.block_weeks);
          const gymWeekData = activePlan.sessions.find(w => w.week_number === gymWeekNum);
          const preferredDays = activePlan.preferred_days ?? [];
          if (gymWeekData) {
            gymWeekData.sessions.forEach((s, i) => {
              let dayIndex: number;
              if (preferredDays.length > i) {
                const d = DAYS_OF_WEEK.indexOf(preferredDays[i]);
                dayIndex = d >= 0 ? d : Math.min(i * Math.floor(7 / gymWeekData.sessions.length), 6);
              } else {
                dayIndex = Math.min(i * Math.floor(7 / gymWeekData.sessions.length) + 1, 6);
              }
              items.push({
                source: "gym", label: s.label,
                desc: `${s.duration_minutes} min`,
                duration: s.duration_minutes,
                dayIndex, sessionIndex: i, weekNum: gymWeekNum,
                done: completions.some(c => c.week_number === gymWeekNum && c.session_index === i),
              });
            });
          }
        }

        if (items.length === 0) return null;

        // Sort by dayIndex
        items.sort((a, b) => a.dayIndex - b.dayIndex);
        const doneCount = items.filter(i => i.done).length;

        return (
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <p style={sectionLabel}>This week</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{doneCount}/{items.length} done</p>
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "12px" }}>
              {DAYS_OF_WEEK.map((day, di) => {
                const dayItems = items.filter(i => i.dayIndex === di);
                const isToday = di === (todayDay === 0 ? 6 : todayDay - 1);
                return (
                  <div
                    key={day}
                    style={{
                      padding: "8px 6px",
                      background: isToday ? "var(--surface)" : "transparent",
                      border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "4px",
                      minHeight: "60px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: isToday ? "var(--accent)" : "var(--text-muted)" }}>
                      {day.slice(0, 3)}
                    </p>
                    {dayItems.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "9px", color: "var(--border)" }}>—</p>
                    ) : (
                      dayItems.map((item, k) => (
                        <div
                          key={k}
                          style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            marginBottom: k < dayItems.length - 1 ? "4px" : 0,
                          }}
                        >
                          <div style={{
                            width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                            background: item.done
                              ? "var(--text-muted)"
                              : item.source === "run" ? "var(--accent)" : "#5bc8a8",
                          }} />
                          <p style={{
                            margin: 0, fontSize: "9px", lineHeight: 1.3,
                            color: item.done ? "var(--text-muted)" : "var(--text)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {item.label}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            {/* Session list */}
            <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
              {items.map((item, k) => (
                <div
                  key={k}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "12px 16px", background: "var(--surface)",
                    borderBottom: k < items.length - 1 ? "1px solid var(--border)" : undefined,
                    opacity: item.done ? 0.55 : 1,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => item.source === "run"
                      ? handleCompleteRunSession(item.weekNum, item.sessionIndex)
                      : handleCompleteSession(item.weekNum, item.sessionIndex)
                    }
                    style={{
                      width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
                      border: item.done ? "none" : `1.5px solid ${item.source === "run" ? "var(--accent)" : "#5bc8a8"}`,
                      background: item.done ? "var(--text-muted)" : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {item.done && <span style={{ color: "var(--bg)", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{
                        fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
                        color: item.source === "run" ? "var(--accent)" : "#5bc8a8",
                        textTransform: "uppercase",
                      }}>
                        {item.source === "run" ? "run" : "gym"}
                      </span>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)", textDecoration: item.done ? "line-through" : undefined }}>
                        {item.label}
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", flexShrink: 0, marginTop: "1px" }}>
                    {DAYS_OF_WEEK[item.dayIndex].slice(0, 3)}
                  </p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              {activeRunPlan && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>concept//run</p>
                </div>
              )}
              {activePlan && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#5bc8a8" }} />
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>concept//form</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Training plan ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <p style={sectionLabel}>Training plan</p>
        {!activePlan ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            No active plan.{" "}
            <Link href="/form/plan" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Build a plan →
            </Link>
          </p>
        ) : (() => {
          const currentWeek = getCurrentWeek(activePlan.starts_on);
          const weekData = activePlan.sessions.find(w => w.week_number === currentWeek);
          const fuel = FUEL_NOTES[activePlan.goal];
          const { streak, thisWeekDone, thisWeekTotal, completedSessions, totalSessions, progressPct } = calcStats(activePlan, completions);
          return (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px", letterSpacing: "-0.02em" }}>
                  {activePlan.name}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
                  {GOAL_LABELS[activePlan.goal] ?? activePlan.goal} · Week {currentWeek} of {activePlan.block_weeks}
                </p>

                {/* Streak + stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Week streak", value: streak > 0 ? `${streak}w` : "—", highlight: streak >= 2 },
                    { label: "This week",   value: `${thisWeekDone}/${thisWeekTotal}`, highlight: thisWeekDone === thisWeekTotal && thisWeekTotal > 0 },
                    { label: "Block",       value: `${progressPct}%`, highlight: false },
                  ].map(stat => (
                    <div
                      key={stat.label}
                      style={{
                        padding: "12px 14px",
                        background: "var(--surface)",
                        border: `1px solid ${stat.highlight ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "6px",
                      }}
                    >
                      <p style={{ margin: "0 0 4px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        {stat.label}
                      </p>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: stat.highlight ? "var(--accent)" : "var(--text)", letterSpacing: "-0.02em" }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Block progress bar */}
                <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", marginBottom: "4px" }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent)", borderRadius: "2px", transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{completedSessions} of {totalSessions} sessions complete</p>
              </div>

              {/* Current week sessions */}
              {weekData && (
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                    Week {currentWeek} · {weekData.phase_name}
                  </p>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                    {weekData.sessions.map((s, i) => {
                      const done = completions.some(c => c.week_number === currentWeek && c.session_index === i);
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "11px 16px", background: "var(--surface)",
                            borderBottom: i < weekData.sessions.length - 1 ? "1px solid var(--border)" : undefined,
                            opacity: done ? 0.6 : 1,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button
                              type="button"
                              onClick={() => handleCompleteSession(currentWeek, i)}
                              style={{
                                width: "18px", height: "18px", borderRadius: "50%",
                                border: done ? "none" : "1.5px solid var(--border)",
                                background: done ? "var(--accent)" : "transparent",
                                cursor: "pointer", flexShrink: 0, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                color: "var(--bg)", fontSize: "10px", fontWeight: 700,
                              }}
                              title={done ? "Mark incomplete" : "Mark complete"}
                            >
                              {done ? "✓" : ""}
                            </button>
                            <div>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)", textDecoration: done ? "line-through" : "none" }}>
                                {s.label}
                              </p>
                              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{s.duration_minutes} min</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px", lineHeight: 1.5 }}>
                    {weekData.phase_note}
                  </p>
                </div>
              )}

              {/* All weeks accordion */}
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Full programme
                </p>
                <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                  {activePlan.sessions.map((week) => {
                    const isOpen = expandedWeek === week.week_number;
                    return (
                      <div key={week.week_number} style={{ borderBottom: "1px solid var(--border)" }}>
                        <button
                          type="button"
                          onClick={() => setExpandedWeek(isOpen ? 0 : week.week_number)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "11px 16px", background: "var(--surface)", border: "none",
                            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                              Week {week.week_number}
                            </p>
                            {week.week_number === currentWeek && (
                              <span style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>current</span>
                            )}
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{week.phase_name}</span>
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{isOpen ? "▲" : "▼"}</span>
                        </button>
                        {isOpen && (
                          <div style={{ borderTop: "1px solid var(--border)" }}>
                            {week.sessions.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "9px 16px", background: "var(--bg)",
                                  borderBottom: i < week.sessions.length - 1 ? "1px solid var(--border)" : undefined,
                                }}
                              >
                                <p style={{ margin: 0, fontSize: "12px", color: "var(--text)" }}>{s.label}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{s.duration_minutes} min</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fuel notes */}
              {fuel && (
                <div>
                  <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                    Fuel protocol
                  </p>
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
                          padding: "12px 16px", background: "var(--surface)",
                          borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined,
                        }}
                      >
                        <p style={{ margin: "0 0 3px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                          {row.label}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text)", lineHeight: 1.6 }}>
                          {row.text}
                        </p>
                      </div>
                    ))}
                    {fuel.notes && (
                      <div style={{ padding: "10px 16px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic" }}>
                          {fuel.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Running plan ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <p style={sectionLabel}>Running plan</p>
        {!activeRunPlan ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            No active run plan.{" "}
            <Link href="/run" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Build a run plan →
            </Link>
          </p>
        ) : (() => {
          const start = new Date(activeRunPlan.starts_on + "T00:00:00");
          const diffWeeks = Math.floor((Date.now() - start.getTime()) / (7 * 24 * 3600 * 1000));
          const currentWeek = Math.min(Math.max(diffWeeks + 1, 1), activeRunPlan.plan_weeks);
          const weekData = activeRunPlan.weeks.find(w => w.week_number === currentWeek);
          const TIER_NAMES: Record<number, string> = { 1: "start", 2: "build", 3: "club", 4: "performance" };
          const RACE_LABELS: Record<string, string> = { weekly5k: "Weekly 5k", "5k": "5k", "10k": "10k", half: "Half marathon", marathon: "Marathon", ultra: "Ultra", hyrox: "Hyrox", fitness: "Fitness" };

          // Streak
          const weeksWithActivity = new Set(runCompletions.map(c => c.week_number));
          let runStreak = 0;
          for (let w = currentWeek; w >= 1; w--) {
            if (weeksWithActivity.has(w)) runStreak++; else break;
          }
          const thisWeekDone  = runCompletions.filter(c => c.week_number === currentWeek).length;
          const thisWeekTotal = weekData?.sessions.length ?? 0;
          const totalDone     = runCompletions.length;
          const totalSessions = activeRunPlan.weeks.reduce((acc, w) => acc + w.sessions.length, 0);
          const blockPct      = totalSessions > 0 ? Math.round((totalDone / totalSessions) * 100) : 0;

          return (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>{activeRunPlan.name}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
                  {RACE_LABELS[activeRunPlan.goal_race] ?? activeRunPlan.goal_race} · {TIER_NAMES[activeRunPlan.tier]} · Week {currentWeek} of {activeRunPlan.plan_weeks}
                  {activeRunPlan.race_date && ` · Race ${new Date(activeRunPlan.race_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                </p>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                  {[
                    { label: "Week streak", value: runStreak > 0 ? `${runStreak}w` : "—", highlight: runStreak >= 2 },
                    { label: "This week",   value: `${thisWeekDone}/${thisWeekTotal}`, highlight: thisWeekDone === thisWeekTotal && thisWeekTotal > 0 },
                    { label: "Block",       value: `${blockPct}%`, highlight: false },
                  ].map(stat => (
                    <div key={stat.label} style={{ padding: "12px 14px", background: "var(--surface)", border: `1px solid ${stat.highlight ? "var(--accent)" : "var(--border)"}`, borderRadius: "6px" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>{stat.label}</p>
                      <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: stat.highlight ? "var(--accent)" : "var(--text)", letterSpacing: "-0.02em" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", marginBottom: "4px" }}>
                  <div style={{ height: "100%", width: `${blockPct}%`, background: "var(--accent)", borderRadius: "2px", transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{totalDone} of {totalSessions} sessions complete</p>
              </div>

              {/* Training zones */}
              {activeRunPlan.training_zones && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "20px" }}>
                  <div style={{ padding: "10px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Training zones · /km</p>
                  </div>
                  {Object.entries(activeRunPlan.training_zones).map(([k, v], i, arr) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 16px", background: "var(--surface)", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : undefined }}>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", textTransform: "capitalize" }}>{k}</p>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* This week's sessions */}
              {weekData && (
                <div>
                  <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                    Week {currentWeek} · {weekData.phase} · {weekData.total_km} km
                  </p>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                    {weekData.sessions.map((s, i) => {
                      const done = runCompletions.some(c => c.week_number === currentWeek && c.session_index === i);
                      return (
                        <div key={i} style={{ padding: "12px 16px", background: "var(--surface)", borderBottom: i < weekData.sessions.length - 1 ? "1px solid var(--border)" : undefined, opacity: done ? 0.6 : 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <button
                              type="button"
                              onClick={() => handleCompleteRunSession(currentWeek, i)}
                              style={{ width: "18px", height: "18px", borderRadius: "50%", border: done ? "none" : "1.5px solid var(--border)", background: done ? "var(--accent)" : "transparent", cursor: "pointer", flexShrink: 0, marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              {done && <span style={{ color: "var(--bg)", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                            </button>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: done ? "var(--text-muted)" : "var(--text)", textDecoration: done ? "line-through" : undefined }}>{s.label}</p>
                              {(s.structure || s.target_pace) && (
                                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                                  {s.structure ?? ""}{s.target_pace ? ` · ${s.target_pace}/km` : ""}
                                </p>
                              )}
                              {s.is_club_session && s.club_alternative && (
                                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", borderLeft: "2px solid var(--border)", paddingLeft: "8px", lineHeight: 1.5 }}>
                                  Can&apos;t make club? {s.club_alternative}
                                </p>
                              )}
                            </div>
                            {s.target_km && <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", flexShrink: 0 }}>{s.target_km} km</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── All training plans ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <p style={sectionLabel}>Training plans ({allPlans.length})</p>
          <Link href="/form/plan" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            + New plan
          </Link>
        </div>
        {allPlans.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No training plans yet.</p>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
            {allPlans.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", background: "var(--surface)",
                  borderBottom: i < allPlans.length - 1 ? "1px solid var(--border)" : undefined,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{p.name}</p>
                    {p.active && (
                      <span style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>active</span>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                    {GOAL_LABELS[p.goal] ?? p.goal} · {p.block_weeks} weeks · {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Saved workouts ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <p style={sectionLabel}>Saved workouts ({workouts.length})</p>
        {workouts.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No saved workouts yet. Hit &ldquo;Save workout&rdquo; after generating a session plan.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
            {workouts.map((w) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                    {w.label || (w.session_type?.join(" & ") ?? "Workout")}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {w.goal} · {w.duration_minutes} min · {new Date(w.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => deleteWorkout(w.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", padding: "4px 8px", fontFamily: "inherit" }} title="Remove">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Saved fuel plans ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "40px" }}>
        <p style={sectionLabel}>Saved fuel plans ({fuelPlans.length})</p>
        {fuelPlans.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No saved fuel plans yet. Hit &ldquo;Save plan&rdquo; after generating a fuel plan.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
            {fuelPlans.map((f) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
                    {f.event_name || "Fuel plan"}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => deleteFuelPlan(f.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", padding: "4px 8px", fontFamily: "inherit" }} title="Remove">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
