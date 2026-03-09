"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Metadata } from "next";

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
