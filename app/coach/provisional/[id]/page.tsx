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
  date_of_birth: string | null; season_goal: string | null;
  target_event: string | null; target_performance: string | null; target_date: string | null;
  athlete_type: string | null; training_model: string | null;
  competition_strategy: string | null; technical_priority: string | null;
  pacing_model: string | null; session_structure: string | null;
  talent_hub: boolean; talent_hub_notes: string | null; coach_notes: string | null;
  merged_into: string | null;
};

type Phase = {
  id: string; name: string; start_date: string; end_date: string;
  focus: string | null; training_focus: string | null;
  competition_notes: string | null; key_cue: string | null;
  coach_notes: string | null; order: number;
};

type Comp = {
  id: string; date: string; end_date: string | null; venue: string | null;
  meeting: string | null; events: string[]; priority: string;
  purpose: string | null; status: string;
};

type Invite = { id: string; token: string; expires_at: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_GROUPS = [
  "sprints", "hurdles", "middle_distance", "long_distance",
  "jumps", "throws", "combined",
];

const PHASE_COLORS = ["#4a9eff", "#f0a500", "#22c55e", "#a855f7", "#ef4444", "#06b6d4", "#fb923c"];

const PRIORITY_COLOR: Record<string, string> = {
  prep: "var(--text-muted)", gate: "#4a9eff", key: "#f0a500", A: "var(--accent)",
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

function CompForm({ v, onChange, onSave, onCancel, onDelete, saving }: {
  v: Partial<Comp> & { events_str: string };
  onChange: (u: Partial<Comp> & { events_str: string }) => void;
  onSave: () => void; onCancel: () => void;
  onDelete?: () => void; saving: boolean;
}) {
  const set = (k: string, val: unknown) => onChange({ ...v, [k]: val });
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FI label="Date *" value={v.date ?? ""} onChange={val => set("date", val)} type="date" />
        <FI label="End date" value={v.end_date ?? ""} onChange={val => set("end_date", val)} type="date" />
      </div>
      <FI label="Meeting" value={v.meeting ?? ""} onChange={val => set("meeting", val)} placeholder="e.g. County Championships, National Series" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FI label="Venue" value={v.venue ?? ""} onChange={val => set("venue", val)} placeholder="e.g. Manchester, Gateshead" />
        <FI label="Events (comma-separated)" value={v.events_str} onChange={val => set("events_str", val)} placeholder="400m" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <label style={L}>Priority</label>
          <select value={v.priority ?? "prep"} onChange={e => set("priority", e.target.value)} style={I}>
            <option value="prep">Prep</option>
            <option value="gate">Gate</option>
            <option value="key">Key</option>
            <option value="A">A race</option>
          </select>
        </div>
        <div>
          <label style={L}>Status</label>
          <select value={v.status ?? "upcoming"} onChange={e => set("status", e.target.value)} style={I}>
            <option value="upcoming">Upcoming</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>
      <FI label="Purpose / notes" value={v.purpose ?? ""} onChange={val => set("purpose", val)} />
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button onClick={onSave} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={onCancel} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        {onDelete && (
          <button onClick={onDelete} style={{ marginLeft: "auto", padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Delete</button>
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

function phaseLen(s: string, e: string) {
  const days = Math.round((new Date(e + "T12:00:00").getTime() - new Date(s + "T12:00:00").getTime()) / 86400000) + 1;
  if (days >= 14) return `${Math.round(days / 7)} weeks`;
  return `${days} days`;
}

const blankComp = { events_str: "", priority: "prep", status: "upcoming" } as const;

const COMP_DOT_COLORS: Record<string, string> = {
  prep: "#888888", gate: "#4a9eff", key: "#f0a500", A: "#22c55e",
};

function SeasonCalendar({ phases, comps }: { phases: Phase[]; comps: Comp[] }) {
  const allDates = [
    ...phases.flatMap(p => [p.start_date, p.end_date]),
    ...comps.flatMap(c => [c.date, c.end_date].filter((d): d is string => !!d)),
  ];
  if (allDates.length === 0) return null;

  const minD = allDates.reduce((a, b) => (a < b ? a : b));
  const maxD = allDates.reduce((a, b) => (a > b ? a : b));

  const months: Date[] = [];
  const cur = new Date(new Date(minD + "T12:00:00").getFullYear(), new Date(minD + "T12:00:00").getMonth(), 1);
  const endM = new Date(new Date(maxD + "T12:00:00").getFullYear(), new Date(maxD + "T12:00:00").getMonth(), 1);
  while (cur <= endM) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

  function pIdx(dateStr: string) {
    return phases.findIndex(p => dateStr >= p.start_date && dateStr <= p.end_date);
  }
  function compOn(dateStr: string) {
    return comps.find(c => c.date === dateStr || (c.end_date && c.date <= dateStr && c.end_date >= dateStr));
  }

  return (
    <div style={{ marginBottom: "32px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>Season overview</p>
      {phases.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          {phases.map((ph, i) => (
            <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: PHASE_COLORS[i % PHASE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Phase {ph.order}: {ph.name}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f0a500", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Competition</span>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" }}>
        {months.map(month => {
          const y = month.getFullYear();
          const mo = month.getMonth();
          const daysInMonth = new Date(y, mo + 1, 0).getDate();
          const startOffset = (new Date(y, mo, 1).getDay() + 6) % 7;
          const cells: (null | { d: number; dateStr: string; pi: number; comp: Comp | undefined })[] = [];
          for (let i = 0; i < startOffset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ d, dateStr, pi: pIdx(dateStr), comp: compOn(dateStr) });
          }
          return (
            <div key={`${y}-${mo}`}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", margin: "0 0 5px" }}>
                {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px" }}>
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <div key={i} style={{ fontSize: "8px", color: "var(--text-muted)", textAlign: "center", paddingBottom: "3px", opacity: 0.5 }}>{d}</div>
                ))}
                {cells.map((cell, i) => {
                  const col = cell?.pi !== undefined && cell.pi >= 0 ? PHASE_COLORS[cell.pi % PHASE_COLORS.length] : null;
                  return (
                    <div key={i} style={{ aspectRatio: "1", borderRadius: "2px", background: col ? col + "30" : "transparent", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {cell && (
                        <>
                          <span style={{ fontSize: "8px", color: col ?? "var(--text-muted)", opacity: col ? 0.85 : 0.35 }}>{cell.d}</span>
                          {cell.comp && (
                            <span style={{ position: "absolute", bottom: "1px", right: "1px", width: "3px", height: "3px", borderRadius: "50%", background: COMP_DOT_COLORS[cell.comp.priority] ?? "#888" }} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProvisionalAthletePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  const [athlete,  setAthlete]  = useState<PA | null>(null);
  const [phases,   setPhases]   = useState<Phase[]>([]);
  const [comps,    setComps]    = useState<Comp[]>([]);
  const [invite,   setInvite]   = useState<Invite | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied,   setCopied]   = useState(false);
  const [saving,   setSaving]   = useState(false);

  const [editSection, setEditSection] = useState<"profile" | "target" | "principles" | null>(null);
  const [pf, setPf] = useState<Partial<PA>>({});
  const [tf, setTf] = useState<Partial<PA>>({});
  const [qf, setQf] = useState<Partial<PA>>({});

  const [editPhaseId,  setEditPhaseId]  = useState<string | null>(null);
  const [phaseF,       setPhaseF]       = useState<Partial<Phase>>({});
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhase,     setNewPhase]     = useState<Partial<Phase>>({});

  const [editCompId,  setEditCompId]  = useState<string | null>(null);
  const [compF,       setCompF]       = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });
  const [showAddComp, setShowAddComp] = useState(false);
  const [newComp,     setNewComp]     = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    const sb = createClient();
    const [{ data: pa }, { data: ph }, { data: co }, { data: inv }] = await Promise.all([
      sb.from("provisional_athletes").select("*").eq("id", id).single(),
      sb.from("season_phases")
        .select("id, name, start_date, end_date, focus, training_focus, competition_notes, key_cue, coach_notes, order")
        .eq("provisional_athlete_id", id).order("order"),
      sb.from("competitions")
        .select("id, date, end_date, venue, meeting, events, priority, purpose, status")
        .eq("provisional_athlete_id", id).order("date"),
      sb.from("athlete_invites")
        .select("id, token, expires_at")
        .eq("provisional_athlete_id", id).is("claimed_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setAthlete(pa);
    setPhases(ph ?? []);
    setComps(co ?? []);
    setInvite(inv ?? null);
    setFetching(false);
  }, [user, id]);

  useEffect(() => { if (!loading) fetchData(); }, [user, loading, fetchData]);

  // ── Section save ────────────────────────────────────────────────────────────

  async function saveSection(updates: Partial<PA>) {
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("provisional_athletes").update(updates).eq("id", id);
    if (!error) { setAthlete(a => a ? { ...a, ...updates } : a); setEditSection(null); }
    setSaving(false);
  }

  // ── Invite ──────────────────────────────────────────────────────────────────

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

  // ── Phase CRUD ──────────────────────────────────────────────────────────────

  async function savePhase(phaseId: string) {
    setSaving(true);
    const sb = createClient();
    const { name, start_date, end_date, focus, training_focus, competition_notes, key_cue, coach_notes, order } = phaseF;
    await sb.from("season_phases").update({
      name, start_date, end_date, order,
      focus: focus || null, training_focus: training_focus || null,
      competition_notes: competition_notes || null, key_cue: key_cue || null,
      coach_notes: coach_notes || null,
    }).eq("id", phaseId);
    setEditPhaseId(null);
    await fetchData();
    setSaving(false);
  }

  async function addPhase() {
    const { name, start_date, end_date } = newPhase;
    if (!name || !start_date || !end_date) return;
    setSaving(true);
    const sb = createClient();
    const maxOrder = phases.reduce((m, p) => Math.max(m, p.order), 0);
    await sb.from("season_phases").insert({
      provisional_athlete_id: id, name, start_date, end_date,
      order: maxOrder + 1,
      focus: newPhase.focus || null,
      training_focus: newPhase.training_focus || null,
      competition_notes: newPhase.competition_notes || null,
      key_cue: newPhase.key_cue || null,
      coach_notes: newPhase.coach_notes || null,
    });
    setNewPhase({});
    setShowAddPhase(false);
    await fetchData();
    setSaving(false);
  }

  async function deletePhase(phaseId: string) {
    if (!confirm("Delete this phase?")) return;
    const sb = createClient();
    await sb.from("season_phases").delete().eq("id", phaseId);
    fetchData();
  }

  // ── Competition CRUD ────────────────────────────────────────────────────────

  function parseEvents(str: string) {
    return str.split(",").map(e => e.trim()).filter(Boolean);
  }

  async function saveComp(compId: string) {
    setSaving(true);
    const sb = createClient();
    const { date, end_date, venue, meeting, priority, purpose, status, events_str } = compF;
    await sb.from("competitions").update({
      date, end_date: end_date || null, venue: venue || null, meeting: meeting || null,
      priority, purpose: purpose || null, status, events: parseEvents(events_str),
    }).eq("id", compId);
    setEditCompId(null);
    await fetchData();
    setSaving(false);
  }

  async function addComp() {
    if (!newComp.date) return;
    setSaving(true);
    const sb = createClient();
    await sb.from("competitions").insert({
      provisional_athlete_id: id,
      date: newComp.date,
      end_date: newComp.end_date || null,
      venue: newComp.venue || null,
      meeting: newComp.meeting || null,
      priority: newComp.priority ?? "prep",
      purpose: newComp.purpose || null,
      status: newComp.status ?? "upcoming",
      events: parseEvents(newComp.events_str ?? ""),
    });
    setNewComp({ ...blankComp });
    setShowAddComp(false);
    await fetchData();
    setSaving(false);
  }

  async function deleteComp(compId: string) {
    if (!confirm("Delete this competition?")) return;
    const sb = createClient();
    await sb.from("competitions").delete().eq("id", compId);
    fetchData();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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

  const inviteUrl = invite ? `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${invite.token}` : null;

  return (
    <div className="cf-page-narrow">

      {/* Back */}
      <Link href="/coach" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Back to roster</Link>

      {/* Header ────────────────────────────────────────────────────────────── */}
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

      {/* Profile ────────────────────────────────────────────────────────────── */}
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

      {/* Season target ──────────────────────────────────────────────────────── */}
      <Section title="Season target"
        onEdit={() => { setTf({ season_goal: athlete.season_goal, target_event: athlete.target_event, target_performance: athlete.target_performance, target_date: athlete.target_date }); setEditSection("target"); }}
        editing={editSection === "target"} onCancel={() => setEditSection(null)}
        onSave={() => saveSection(tf)} saving={saving}
      >
        {editSection === "target" ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <FI label="Season goal" value={tf.season_goal ?? ""} onChange={v => setTf(f => ({ ...f, season_goal: v }))} placeholder="e.g. National final, PB by 2%, top 3 ranking" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <FI label="Target event" value={tf.target_event ?? ""} onChange={v => setTf(f => ({ ...f, target_event: v }))} placeholder="e.g. 100m, high jump" />
              <FI label="Target performance" value={tf.target_performance ?? ""} onChange={v => setTf(f => ({ ...f, target_performance: v }))} placeholder="e.g. 10.80, 6.50m" />
              <FI label="Target date" value={tf.target_date ?? ""} onChange={v => setTf(f => ({ ...f, target_date: v }))} type="date" />
            </div>
          </div>
        ) : (
          <div>
            <ReadField label="Goal" value={athlete.season_goal} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 24px" }}>
              <ReadField label="Target event" value={athlete.target_event} />
              <ReadField label="Target performance" value={athlete.target_performance} />
              <ReadField label="Target date" value={fmtDate(athlete.target_date) || null} />
            </div>
          </div>
        )}
      </Section>

      {/* Coaching principles ────────────────────────────────────────────────── */}
      <Section title="Coaching principles"
        onEdit={() => { setQf({ athlete_type: athlete.athlete_type, training_model: athlete.training_model, competition_strategy: athlete.competition_strategy, technical_priority: athlete.technical_priority, pacing_model: athlete.pacing_model, session_structure: athlete.session_structure, talent_hub: athlete.talent_hub, talent_hub_notes: athlete.talent_hub_notes, coach_notes: athlete.coach_notes }); setEditSection("principles"); }}
        editing={editSection === "principles"} onCancel={() => setEditSection(null)}
        onSave={() => saveSection(qf)} saving={saving}
      >
        {editSection === "principles" ? (
          <div style={{ display: "grid", gap: "12px" }}>
            <FTA label="Athlete type" value={qf.athlete_type ?? ""} onChange={v => setQf(f => ({ ...f, athlete_type: v }))} placeholder="How this athlete responds to training load, pressure and environment" />
            <FTA label="Training model" value={qf.training_model ?? ""} onChange={v => setQf(f => ({ ...f, training_model: v }))} placeholder="Overall training methodology and weekly structure" />
            <FTA label="Competition strategy" value={qf.competition_strategy ?? ""} onChange={v => setQf(f => ({ ...f, competition_strategy: v }))} placeholder="Race selection approach, competitors to target, exposure goals" />
            <FTA label="Technical priority" value={qf.technical_priority ?? ""} onChange={v => setQf(f => ({ ...f, technical_priority: v }))} placeholder="Primary technical focus area this season" />
            <FTA label="Pacing model" value={qf.pacing_model ?? ""} onChange={v => setQf(f => ({ ...f, pacing_model: v }))} placeholder="How this athlete distributes effort across a race or event" />
            <FTA label="Session structure" value={qf.session_structure ?? ""} onChange={v => setQf(f => ({ ...f, session_structure: v }))} placeholder="Intensity pattern, key session types, volume and recovery notes" />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input type="checkbox" checked={qf.talent_hub ?? false} onChange={e => setQf(f => ({ ...f, talent_hub: e.target.checked }))} />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Talent Hub athlete</span>
            </label>
            {qf.talent_hub && (
              <FTA label="Talent Hub notes" value={qf.talent_hub_notes ?? ""} onChange={v => setQf(f => ({ ...f, talent_hub_notes: v }))} placeholder="Evidence requirements, communication protocols" />
            )}
            <FTA label="Coach notes" value={qf.coach_notes ?? ""} onChange={v => setQf(f => ({ ...f, coach_notes: v }))} />
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

      {/* Season overview calendar */}
      <SeasonCalendar phases={phases} comps={comps} />

      {/* Season plan ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>Season plan</p>
          <button onClick={() => { setShowAddPhase(s => !s); setNewPhase({}); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer" }}>
            {showAddPhase ? "Cancel" : "+ Add phase"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {phases.map((ph, idx) => (
            <div key={ph.id} style={{ border: `1px solid ${editPhaseId === ph.id ? "var(--accent)" : "var(--border)"}`, borderRadius: "8px", background: "var(--surface)", overflow: "hidden" }}>
              {editPhaseId === ph.id ? (
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Edit phase {ph.order}</p>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px", gap: "10px" }}>
                      <FI label="Name *" value={phaseF.name ?? ""} onChange={v => setPhaseF(f => ({ ...f, name: v }))} placeholder="e.g. Reconditioning" />
                      <FI label="Start date *" value={phaseF.start_date ?? ""} onChange={v => setPhaseF(f => ({ ...f, start_date: v }))} type="date" />
                      <FI label="End date *" value={phaseF.end_date ?? ""} onChange={v => setPhaseF(f => ({ ...f, end_date: v }))} type="date" />
                      <FI label="Phase no." value={String(phaseF.order ?? idx + 1)} onChange={v => setPhaseF(f => ({ ...f, order: Number(v) }))} type="number" />
                    </div>
                    <FI label="Theme" value={phaseF.focus ?? ""} onChange={v => setPhaseF(f => ({ ...f, focus: v }))} placeholder="e.g. Base, Build, Peak, Taper" />
                    <FTA label="Training focus" value={phaseF.training_focus ?? ""} onChange={v => setPhaseF(f => ({ ...f, training_focus: v }))} />
                    <FTA label="Competitions" value={phaseF.competition_notes ?? ""} onChange={v => setPhaseF(f => ({ ...f, competition_notes: v }))} placeholder="Planned competitions, or None" />
                    <FI label="Key cue" value={phaseF.key_cue ?? ""} onChange={v => setPhaseF(f => ({ ...f, key_cue: v }))} placeholder="A short, memorable coaching cue for this phase" />
                    <FTA label="Notes" value={phaseF.coach_notes ?? ""} onChange={v => setPhaseF(f => ({ ...f, coach_notes: v }))} />
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                    <button onClick={() => savePhase(ph.id)} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer" }}>Save</button>
                    <button onClick={() => setEditPhaseId(null)} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                    <button onClick={() => deletePhase(ph.id)} style={{ marginLeft: "auto", padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>PHASE {ph.order}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{ph.name}</span>
                        {ph.focus && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>{ph.focus}</span>}
                      </div>
                      <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {fmtDate(ph.start_date)} – {fmtDate(ph.end_date)}
                        {ph.start_date && ph.end_date ? ` · ${phaseLen(ph.start_date, ph.end_date)}` : ""}
                      </p>
                      {ph.key_cue && (
                        <p style={{ margin: "0 0 8px", fontSize: "13px", fontStyle: "italic", color: "var(--accent)" }}>{ph.key_cue}</p>
                      )}
                      {ph.training_focus && (
                        <p style={{ margin: "0 0 5px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>{ph.training_focus}</p>
                      )}
                      {ph.competition_notes && (
                        <p style={{ margin: "0 0 5px", fontSize: "12px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 600 }}>Competitions: </span>{ph.competition_notes}
                        </p>
                      )}
                      {ph.coach_notes && (
                        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)", opacity: 0.75, lineHeight: 1.5 }}>{ph.coach_notes}</p>
                      )}
                    </div>
                    <button onClick={() => { setEditPhaseId(ph.id); setPhaseF({ ...ph }); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add phase form */}
          {showAddPhase && (
            <div style={{ padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
              <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>New phase</p>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                  <FI label="Name *" value={newPhase.name ?? ""} onChange={v => setNewPhase(f => ({ ...f, name: v }))} placeholder="e.g. Reconditioning" />
                  <FI label="Start date *" value={newPhase.start_date ?? ""} onChange={v => setNewPhase(f => ({ ...f, start_date: v }))} type="date" />
                  <FI label="End date *" value={newPhase.end_date ?? ""} onChange={v => setNewPhase(f => ({ ...f, end_date: v }))} type="date" />
                </div>
                <FI label="Theme" value={newPhase.focus ?? ""} onChange={v => setNewPhase(f => ({ ...f, focus: v }))} placeholder="e.g. Base, Build, Peak, Taper" />
                <FTA label="Training focus" value={newPhase.training_focus ?? ""} onChange={v => setNewPhase(f => ({ ...f, training_focus: v }))} placeholder="Key training objectives and load emphasis for this phase" />
                <FTA label="Competitions" value={newPhase.competition_notes ?? ""} onChange={v => setNewPhase(f => ({ ...f, competition_notes: v }))} placeholder="Planned competitions, or None" />
                <FI label="Key cue" value={newPhase.key_cue ?? ""} onChange={v => setNewPhase(f => ({ ...f, key_cue: v }))} placeholder="A short, memorable coaching cue for this phase" />
                <FTA label="Notes" value={newPhase.coach_notes ?? ""} onChange={v => setNewPhase(f => ({ ...f, coach_notes: v }))} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                <button onClick={addPhase} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer" }}>Add phase</button>
                <button onClick={() => { setShowAddPhase(false); setNewPhase({}); }} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {phases.length === 0 && !showAddPhase && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0" }}>No phases yet. Click + Add phase to build the season plan.</p>
          )}
        </div>
      </div>

      {/* Competition calendar ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>Competition calendar</p>
          <button onClick={() => { setShowAddComp(s => !s); setNewComp({ ...blankComp }); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer" }}>
            {showAddComp ? "Cancel" : "+ Add competition"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

          {comps.map(c => (
            <div key={c.id} style={{ border: `1px solid ${editCompId === c.id ? "var(--accent)" : "var(--border)"}`, borderRadius: "8px", background: "var(--surface)", overflow: "hidden" }}>
              {editCompId === c.id ? (
                <div style={{ padding: "16px 18px" }}>
                  <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Edit competition</p>
                  <CompForm v={compF} onChange={setCompF} onSave={() => saveComp(c.id)} onCancel={() => setEditCompId(null)} onDelete={() => deleteComp(c.id)} saving={saving} />
                </div>
              ) : (
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: PRIORITY_COLOR[c.priority] ?? "var(--text-muted)", flexShrink: 0, display: "inline-block" }} />
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{c.meeting || "Competition"}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{c.priority}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                      {fmtDate(c.date)}{c.end_date ? ` – ${fmtDate(c.end_date)}` : ""}
                      {c.venue ? ` · ${c.venue}` : ""}
                      {c.events?.length > 0 ? ` · ${c.events.join(", ")}` : ""}
                    </p>
                    {c.purpose && <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)", opacity: 0.75 }}>{c.purpose}</p>}
                  </div>
                  <button onClick={() => { setEditCompId(c.id); setCompF({ ...c, events_str: c.events?.join(", ") ?? "" }); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                </div>
              )}
            </div>
          ))}

          {/* Add competition form */}
          {showAddComp && (
            <div style={{ padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
              <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>New competition</p>
              <CompForm v={newComp} onChange={setNewComp} onSave={addComp} onCancel={() => { setShowAddComp(false); setNewComp({ ...blankComp }); }} saving={saving} />
            </div>
          )}

          {comps.length === 0 && !showAddComp && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0" }}>No competitions yet.</p>
          )}

        </div>
      </div>

    </div>
  );
}
