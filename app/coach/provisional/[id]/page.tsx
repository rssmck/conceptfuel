"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type PA = {
  id: string; name: string; classification: string | null; club: string | null;
  county: string | null; nation: string | null; event_group: string | null;
  date_of_birth: string | null;
  athlete_type: string | null; training_model: string | null;
  competition_strategy: string | null; technical_priority: string | null;
  pacing_model: string | null; session_structure: string | null;
  talent_hub: boolean; talent_hub_notes: string | null; coach_notes: string | null;
  merged_into: string | null;
};

type Season = {
  id: string; name: string; season_type: string;
  start_date: string | null; end_date: string | null;
  goal: string | null; target_event: string | null;
  target_performance: string | null; status: string;
};

type Invite = { id: string; token: string; expires_at: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_GROUPS = [
  "sprints", "hurdles", "middle_distance", "long_distance",
  "jumps", "throws", "combined",
];

const SEASON_TYPES = [
  { value: "outdoor_track", label: "Outdoor Track" },
  { value: "indoor_track",  label: "Indoor Track"  },
  { value: "cross_country", label: "Cross Country" },
  { value: "road",          label: "Road"          },
  { value: "marathon",      label: "Marathon"      },
  { value: "trail",         label: "Trail"         },
  { value: "other",         label: "Other"         },
];

const SEASON_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SEASON_TYPES.map(t => [t.value, t.label])
);

const SEASON_STATUS_COLOR: Record<string, string> = {
  planning: "var(--text-muted)",
  active:   "var(--accent)",
  complete: "#22c55e",
  archived: "var(--text-muted)",
};

const blankSeason = {
  name: "", season_type: "outdoor_track",
  start_date: "", end_date: "",
  goal: "", target_event: "", target_performance: "", target_date: "",
  status: "planning",
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const L: React.CSSProperties = {
  fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px",
};
const I: React.CSSProperties = {
  width: "100%", padding: "8px 10px", background: "var(--bg)",
  border: "1px solid var(--border)", borderRadius: "4px",
  color: "var(--text)", fontSize: "14px", boxSizing: "border-box",
};
const TA: React.CSSProperties = {
  ...I, resize: "vertical" as const, minHeight: "76px",
};

// ─── Helper components ────────────────────────────────────────────────────────

function FI({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={L}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={I} placeholder={placeholder} />
    </div>
  );
}

function FTA({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label style={L}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        style={TA} placeholder={placeholder} />
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
      <p style={{ fontSize: "14px", color: "var(--text)", margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap", opacity: value ? 1 : 0.35 }}>
        {value || "—"}
      </p>
    </div>
  );
}

function Section({ title, onEdit, editing, onCancel, onSave, saving, children }: {
  title: string; onEdit: () => void; editing: boolean;
  onCancel: () => void; onSave: () => void; saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>{title}</p>
        {!editing && (
          <button onClick={onEdit} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer" }}>Edit</button>
        )}
      </div>
      <div style={{ padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
        {children}
        {editing && (
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button onClick={onSave} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onCancel} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProvisionalAthletePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [athlete,      setAthlete]      = useState<PA | null>(null);
  const [seasons,      setSeasons]      = useState<Season[]>([]);
  const [invite,       setInvite]       = useState<Invite | null>(null);
  const [fetching,     setFetching]     = useState(true);
  const [copied,       setCopied]       = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [savingSeason, setSavingSeason] = useState(false);

  const [editSection, setEditSection] = useState<"profile" | "principles" | null>(null);
  const [pf, setPf] = useState<Partial<PA>>({});
  const [qf, setQf] = useState<Partial<PA>>({});

  const [showAddSeason, setShowAddSeason] = useState(false);
  const [newSeason,     setNewSeason]     = useState({ ...blankSeason });

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    const sb = createClient();
    const [{ data: pa }, { data: inv }, { data: seas }] = await Promise.all([
      sb.from("provisional_athletes").select("*").eq("id", id).single(),
      sb.from("athlete_invites")
        .select("id, token, expires_at")
        .eq("provisional_athlete_id", id).is("claimed_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("seasons")
        .select("id, name, season_type, start_date, end_date, goal, target_event, target_performance, status")
        .eq("provisional_athlete_id", id)
        .order("start_date", { ascending: false }),
    ]);
    setAthlete(pa);
    setInvite(inv ?? null);
    setSeasons(seas ?? []);
    setFetching(false);
  }, [user, id]);

  useEffect(() => { if (!loading) fetchData(); }, [user, loading, fetchData]);

  async function saveSection(updates: Partial<PA>) {
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("provisional_athletes").update(updates).eq("id", id);
    if (!error) { setAthlete(a => a ? { ...a, ...updates } : a); setEditSection(null); }
    setSaving(false);
  }

  async function handleGenerateInvite() {
    if (!user) return;
    const sb = createClient();
    const { data } = await sb.from("athlete_invites")
      .insert({ coach_id: user.id, provisional_athlete_id: id })
      .select("id, token, expires_at").single();
    if (data) { setInvite(data); doCopy(data.token); }
  }

  function doCopy(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/join?code=${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function addSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newSeason.name.trim()) return;
    setSavingSeason(true);
    const sb = createClient();
    const { error } = await sb.from("seasons").insert({
      provisional_athlete_id: id,
      coach_id:               user.id,
      name:                   newSeason.name.trim(),
      season_type:            newSeason.season_type,
      start_date:             newSeason.start_date    || null,
      end_date:               newSeason.end_date      || null,
      goal:                   newSeason.goal          || null,
      target_event:           newSeason.target_event  || null,
      target_performance:     newSeason.target_performance || null,
      target_date:            newSeason.target_date   || null,
      status:                 newSeason.status,
    });
    setSavingSeason(false);
    if (!error) { setNewSeason({ ...blankSeason }); setShowAddSeason(false); fetchData(); }
  }

  if (loading || fetching) {
    return (
      <div className="cf-page-narrow">
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="cf-page-narrow">
        <Link href="/coach" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Back to roster</Link>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "24px" }}>Athlete not found.</p>
      </div>
    );
  }

  const inviteUrl = invite
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${invite.token}`
    : null;

  return (
    <div className="cf-page-narrow">

      <Link href="/coach" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Back to roster</Link>

      {/* Header */}
      <div style={{ margin: "16px 0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--border)", color: "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 700 }}>PENDING</span>
          {athlete.talent_hub && (
            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--accent)", color: "var(--bg)", letterSpacing: "0.08em", fontWeight: 700 }}>TALENT HUB</span>
          )}
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{athlete.name}</h1>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-muted)" }}>
          {[athlete.classification, athlete.club, athlete.event_group?.replace(/_/g, " ")].filter(Boolean).join(" · ")}
        </p>

        {inviteUrl ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <code style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--surface)", padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--border)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {inviteUrl}
            </code>
            <button onClick={() => doCopy(invite!.token)} style={{ fontSize: "12px", padding: "6px 14px", background: copied ? "var(--accent)" : "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: copied ? "var(--bg)" : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}>
              {copied ? "Copied" : "Copy invite link"}
            </button>
          </div>
        ) : (
          <button onClick={handleGenerateInvite} style={{ padding: "8px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
            Generate invite link
          </button>
        )}
      </div>

      {/* Profile */}
      <Section title="Profile"
        onEdit={() => { setPf({ name: athlete.name, classification: athlete.classification, club: athlete.club, county: athlete.county, nation: athlete.nation, event_group: athlete.event_group, date_of_birth: athlete.date_of_birth }); setEditSection("profile"); }}
        editing={editSection === "profile"} onCancel={() => setEditSection(null)}
        onSave={() => saveSection(pf)} saving={saving}
      >
        {editSection === "profile" ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <FI label="Name *" value={pf.name ?? ""} onChange={v => setPf(f => ({ ...f, name: v }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FI label="Classification" value={pf.classification ?? ""} onChange={v => setPf(f => ({ ...f, classification: v }))} placeholder="If applicable" />
              <FI label="Club" value={pf.club ?? ""} onChange={v => setPf(f => ({ ...f, club: v }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <FI label="County" value={pf.county ?? ""} onChange={v => setPf(f => ({ ...f, county: v }))} />
              <FI label="Nation" value={pf.nation ?? ""} onChange={v => setPf(f => ({ ...f, nation: v }))} />
            </div>
            <div>
              <label style={L}>Event group</label>
              <select value={pf.event_group ?? ""} onChange={e => setPf(f => ({ ...f, event_group: e.target.value }))} style={I}>
                <option value="">Select</option>
                {EVENT_GROUPS.map(g => <option key={g} value={g}>{g.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <FI label="Date of birth" value={pf.date_of_birth ?? ""} onChange={v => setPf(f => ({ ...f, date_of_birth: v }))} type="date" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            <div style={{ gridColumn: "1 / -1" }}><ReadField label="Name" value={athlete.name} /></div>
            <ReadField label="Classification" value={athlete.classification} />
            <ReadField label="Club" value={athlete.club} />
            <ReadField label="County" value={athlete.county} />
            <ReadField label="Nation" value={athlete.nation} />
            <ReadField label="Event group" value={athlete.event_group?.replace(/_/g, " ") ?? null} />
            <ReadField label="Date of birth" value={fmtDate(athlete.date_of_birth) || null} />
          </div>
        )}
      </Section>

      {/* Coaching principles */}
      <Section title="Coaching principles"
        onEdit={() => { setQf({ athlete_type: athlete.athlete_type, training_model: athlete.training_model, competition_strategy: athlete.competition_strategy, technical_priority: athlete.technical_priority, pacing_model: athlete.pacing_model, session_structure: athlete.session_structure, talent_hub: athlete.talent_hub, talent_hub_notes: athlete.talent_hub_notes, coach_notes: athlete.coach_notes }); setEditSection("principles"); }}
        editing={editSection === "principles"} onCancel={() => setEditSection(null)}
        onSave={() => saveSection(qf)} saving={saving}
      >
        {editSection === "principles" ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <FTA label="Athlete type" value={qf.athlete_type ?? ""} onChange={v => setQf(f => ({ ...f, athlete_type: v }))} placeholder="How this athlete responds to training load, pressure and environment" />
            <FTA label="Training model" value={qf.training_model ?? ""} onChange={v => setQf(f => ({ ...f, training_model: v }))} placeholder="Overall training methodology and weekly structure" />
            <FTA label="Competition strategy" value={qf.competition_strategy ?? ""} onChange={v => setQf(f => ({ ...f, competition_strategy: v }))} placeholder="Race selection approach and competition exposure goals" />
            <FTA label="Technical priority" value={qf.technical_priority ?? ""} onChange={v => setQf(f => ({ ...f, technical_priority: v }))} placeholder="Primary technical focus area this season" />
            <FTA label="Pacing model" value={qf.pacing_model ?? ""} onChange={v => setQf(f => ({ ...f, pacing_model: v }))} placeholder="How this athlete distributes effort across a race or event" />
            <FTA label="Session structure" value={qf.session_structure ?? ""} onChange={v => setQf(f => ({ ...f, session_structure: v }))} placeholder="Intensity pattern, key session types, volume and recovery notes" />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={qf.talent_hub ?? false} onChange={e => setQf(f => ({ ...f, talent_hub: e.target.checked }))} />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Talent Hub athlete</span>
            </label>
            {qf.talent_hub && (
              <FTA label="Talent Hub notes" value={qf.talent_hub_notes ?? ""} onChange={v => setQf(f => ({ ...f, talent_hub_notes: v }))} />
            )}
            <FTA label="Coach notes" value={qf.coach_notes ?? ""} onChange={v => setQf(f => ({ ...f, coach_notes: v }))} placeholder="Anything else relevant to working with this athlete" />
          </div>
        ) : (
          <div>
            <ReadField label="Athlete type" value={athlete.athlete_type} />
            <ReadField label="Training model" value={athlete.training_model} />
            <ReadField label="Competition strategy" value={athlete.competition_strategy} />
            <ReadField label="Technical priority" value={athlete.technical_priority} />
            <ReadField label="Pacing model" value={athlete.pacing_model} />
            <ReadField label="Session structure" value={athlete.session_structure} />
            {athlete.talent_hub && <ReadField label="Talent Hub" value={athlete.talent_hub_notes || "Yes"} />}
            <ReadField label="Coach notes" value={athlete.coach_notes} />
          </div>
        )}
      </Section>

      {/* Seasons */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>Seasons</p>
          <button
            onClick={() => setShowAddSeason(s => !s)}
            style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer" }}
          >
            {showAddSeason ? "Cancel" : "+ Add season"}
          </button>
        </div>

        {showAddSeason && (
          <form onSubmit={addSeason} style={{ marginBottom: "16px", padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
            <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>New season</p>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <FI label="Season name *" value={newSeason.name} onChange={v => setNewSeason(s => ({ ...s, name: v }))} placeholder="e.g. Outdoor Track 2026" />
                <div>
                  <label style={L}>Type</label>
                  <select value={newSeason.season_type} onChange={e => setNewSeason(s => ({ ...s, season_type: e.target.value }))} style={I}>
                    {SEASON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Start date" value={newSeason.start_date} onChange={v => setNewSeason(s => ({ ...s, start_date: v }))} type="date" />
                <FI label="End date" value={newSeason.end_date} onChange={v => setNewSeason(s => ({ ...s, end_date: v }))} type="date" />
              </div>
              <FI label="Season goal" value={newSeason.goal} onChange={v => setNewSeason(s => ({ ...s, goal: v }))} placeholder="What this season is working toward" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Target event" value={newSeason.target_event} onChange={v => setNewSeason(s => ({ ...s, target_event: v }))} placeholder="e.g. 1500m, marathon" />
                <FI label="Target performance" value={newSeason.target_performance} onChange={v => setNewSeason(s => ({ ...s, target_performance: v }))} placeholder="e.g. sub-4:00, top 10" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Target date" value={newSeason.target_date} onChange={v => setNewSeason(s => ({ ...s, target_date: v }))} type="date" />
                <div>
                  <label style={L}>Status</label>
                  <select value={newSeason.status} onChange={e => setNewSeason(s => ({ ...s, status: e.target.value }))} style={I}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="complete">Complete</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "14px" }}>
              <button type="submit" disabled={savingSeason} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: savingSeason ? "not-allowed" : "pointer", opacity: savingSeason ? 0.7 : 1 }}>
                {savingSeason ? "Saving..." : "Create season"}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {seasons.map(s => (
            <Link key={s.id} href={`/coach/provisional/${id}/season/${s.id}`} style={{ display: "block", padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--border)", color: "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 700 }}>
                      {SEASON_TYPE_LABEL[s.season_type] ?? s.season_type}
                    </span>
                    <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", border: `1px solid ${SEASON_STATUS_COLOR[s.status] ?? "var(--border)"}`, color: SEASON_STATUS_COLOR[s.status] ?? "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 700 }}>
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 3px", fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{s.name}</p>
                  {(s.start_date || s.end_date) && (
                    <p style={{ margin: "0 0 3px", fontSize: "12px", color: "var(--text-muted)" }}>
                      {fmtDate(s.start_date)}{s.end_date ? ` – ${fmtDate(s.end_date)}` : ""}
                    </p>
                  )}
                  {(s.target_event || s.target_performance) && (
                    <p style={{ margin: "0 0 3px", fontSize: "12px", color: "var(--text-muted)" }}>
                      {[s.target_event, s.target_performance].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {s.goal && (
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>{s.goal}</p>
                  )}
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>→</span>
              </div>
            </Link>
          ))}
          {seasons.length === 0 && !showAddSeason && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0", opacity: 0.6 }}>
              No seasons yet. Add a season to start building the training plan.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
