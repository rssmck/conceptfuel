"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Season = {
  id: string; name: string; season_type: string;
  start_date: string | null; end_date: string | null;
  goal: string | null; target_event: string | null;
  target_performance: string | null; target_date: string | null;
  status: string; notes: string | null;
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

// ─── Constants ────────────────────────────────────────────────────────────────

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

const PRIORITY_COLOR: Record<string, string> = {
  prep: "var(--text-muted)", gate: "#4a9eff", key: "#f0a500", A: "var(--accent)",
};

const PHASE_COLORS = ["#4a9eff", "#f0a500", "#22c55e", "#a855f7", "#ef4444", "#06b6d4", "#fb923c"];

const COMP_DOT: Record<string, string> = {
  prep: "#888888", gate: "#4a9eff", key: "#f0a500", A: "#22c55e",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
        <FI label="Events" value={v.events_str} onChange={val => set("events_str", val)} placeholder="Comma-separated" />
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
      <FI label="Purpose / notes" value={v.purpose ?? ""} onChange={val => set("purpose", val)} placeholder="Race objective and approach" />
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

// ─── Season calendar ──────────────────────────────────────────────────────────

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
          {comps.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f0a500", flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Competition</span>
            </div>
          )}
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
                            <span style={{ position: "absolute", bottom: "1px", right: "1px", width: "3px", height: "3px", borderRadius: "50%", background: COMP_DOT[cell.comp.priority] ?? "#888" }} />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function phaseLen(s: string, e: string) {
  const days = Math.round((new Date(e + "T12:00:00").getTime() - new Date(s + "T12:00:00").getTime()) / 86400000) + 1;
  return days >= 14 ? `${Math.round(days / 7)} weeks` : `${days} days`;
}

const blankComp = { events_str: "", priority: "prep", status: "upcoming" } as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeasonPage() {
  const { id: athleteId, seasonId } = useParams<{ id: string; seasonId: string }>();
  const { user, loading } = useAuth();

  const [season,       setSeason]       = useState<Season | null>(null);
  const [athleteName,  setAthleteName]  = useState("");
  const [phases,       setPhases]       = useState<Phase[]>([]);
  const [comps,        setComps]        = useState<Comp[]>([]);
  const [fetching,     setFetching]     = useState(true);
  const [saving,       setSaving]       = useState(false);

  const [editSeason,   setEditSeason]   = useState(false);
  const [sf,           setSf]           = useState<Partial<Season>>({});

  const [editPhaseId,  setEditPhaseId]  = useState<string | null>(null);
  const [phaseF,       setPhaseF]       = useState<Partial<Phase>>({});
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhase,     setNewPhase]     = useState<Partial<Phase>>({});

  const [editCompId,   setEditCompId]   = useState<string | null>(null);
  const [compF,        setCompF]        = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });
  const [showAddComp,  setShowAddComp]  = useState(false);
  const [newComp,      setNewComp]      = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });

  const fetchData = useCallback(async () => {
    if (!user || !athleteId || !seasonId) return;
    const sb = createClient();
    const [{ data: s }, { data: pa }, { data: ph }, { data: co }] = await Promise.all([
      sb.from("seasons").select("*").eq("id", seasonId).single(),
      sb.from("provisional_athletes").select("name").eq("id", athleteId).single(),
      sb.from("season_phases")
        .select("id, name, start_date, end_date, focus, training_focus, competition_notes, key_cue, coach_notes, order")
        .eq("season_id", seasonId).order("order"),
      sb.from("competitions")
        .select("id, date, end_date, venue, meeting, events, priority, purpose, status")
        .eq("season_id", seasonId).order("date"),
    ]);
    setSeason(s);
    setAthleteName(pa?.name ?? "");
    setPhases(ph ?? []);
    setComps(co ?? []);
    setFetching(false);
  }, [user, athleteId, seasonId]);

  useEffect(() => { if (!loading) fetchData(); }, [user, loading, fetchData]);

  // ── Season edit ──────────────────────────────────────────────────────────────

  async function saveSeason() {
    if (!season) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("seasons").update({
      name:               sf.name,
      season_type:        sf.season_type,
      start_date:         sf.start_date         || null,
      end_date:           sf.end_date           || null,
      goal:               sf.goal               || null,
      target_event:       sf.target_event       || null,
      target_performance: sf.target_performance || null,
      target_date:        sf.target_date        || null,
      status:             sf.status,
      notes:              sf.notes              || null,
    }).eq("id", seasonId);
    if (!error) { setSeason(s => s ? { ...s, ...sf } : s); setEditSeason(false); }
    setSaving(false);
  }

  // ── Phase CRUD ───────────────────────────────────────────────────────────────

  async function savePhase(phaseId: string) {
    setSaving(true);
    const sb = createClient();
    await sb.from("season_phases").update({
      name: phaseF.name, start_date: phaseF.start_date, end_date: phaseF.end_date,
      order: phaseF.order,
      focus:             phaseF.focus             || null,
      training_focus:    phaseF.training_focus    || null,
      competition_notes: phaseF.competition_notes || null,
      key_cue:           phaseF.key_cue           || null,
      coach_notes:       phaseF.coach_notes       || null,
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
      provisional_athlete_id: athleteId,
      season_id:              seasonId,
      name, start_date, end_date,
      order:             maxOrder + 1,
      focus:             newPhase.focus             || null,
      training_focus:    newPhase.training_focus    || null,
      competition_notes: newPhase.competition_notes || null,
      key_cue:           newPhase.key_cue           || null,
      coach_notes:       newPhase.coach_notes       || null,
    });
    setNewPhase({});
    setShowAddPhase(false);
    await fetchData();
    setSaving(false);
  }

  async function deletePhase(phaseId: string) {
    if (!confirm("Delete this phase?")) return;
    await createClient().from("season_phases").delete().eq("id", phaseId);
    fetchData();
  }

  // ── Competition CRUD ─────────────────────────────────────────────────────────

  function parseEvents(str: string) {
    return str.split(",").map(e => e.trim()).filter(Boolean);
  }

  async function saveComp(compId: string) {
    setSaving(true);
    const { date, end_date, venue, meeting, priority, purpose, status, events_str } = compF;
    await createClient().from("competitions").update({
      date, end_date: end_date || null, venue: venue || null,
      meeting: meeting || null, priority, purpose: purpose || null,
      status, events: parseEvents(events_str),
    }).eq("id", compId);
    setEditCompId(null);
    await fetchData();
    setSaving(false);
  }

  async function addComp() {
    if (!newComp.date) return;
    setSaving(true);
    await createClient().from("competitions").insert({
      provisional_athlete_id: athleteId,
      season_id:              seasonId,
      date:     newComp.date,
      end_date: newComp.end_date  || null,
      venue:    newComp.venue     || null,
      meeting:  newComp.meeting   || null,
      priority: newComp.priority  ?? "prep",
      purpose:  newComp.purpose   || null,
      status:   newComp.status    ?? "upcoming",
      events:   parseEvents(newComp.events_str ?? ""),
    });
    setNewComp({ ...blankComp });
    setShowAddComp(false);
    await fetchData();
    setSaving(false);
  }

  async function deleteComp(compId: string) {
    if (!confirm("Delete this competition?")) return;
    await createClient().from("competitions").delete().eq("id", compId);
    fetchData();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading || fetching) {
    return (
      <div className="cf-page-narrow">
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!season) {
    return (
      <div className="cf-page-narrow">
        <Link href={`/coach/provisional/${athleteId}`} style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>← Back to athlete</Link>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "24px" }}>Season not found.</p>
      </div>
    );
  }

  return (
    <div className="cf-page-narrow">

      {/* Breadcrumb */}
      <Link href={`/coach/provisional/${athleteId}`} style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
        ← {athleteName || "Back to athlete"}
      </Link>

      {/* Season header */}
      <div style={{ margin: "16px 0 32px" }}>
        {editSeason ? (
          <div style={{ padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
            <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Edit season</p>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <FI label="Season name *" value={sf.name ?? ""} onChange={v => setSf(s => ({ ...s, name: v }))} />
                <div>
                  <label style={L}>Type</label>
                  <select value={sf.season_type ?? "outdoor_track"} onChange={e => setSf(s => ({ ...s, season_type: e.target.value }))} style={I}>
                    {SEASON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Start date" value={sf.start_date ?? ""} onChange={v => setSf(s => ({ ...s, start_date: v }))} type="date" />
                <FI label="End date" value={sf.end_date ?? ""} onChange={v => setSf(s => ({ ...s, end_date: v }))} type="date" />
              </div>
              <FI label="Season goal" value={sf.goal ?? ""} onChange={v => setSf(s => ({ ...s, goal: v }))} placeholder="What this season is working toward" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Target event" value={sf.target_event ?? ""} onChange={v => setSf(s => ({ ...s, target_event: v }))} />
                <FI label="Target performance" value={sf.target_performance ?? ""} onChange={v => setSf(s => ({ ...s, target_performance: v }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FI label="Target date" value={sf.target_date ?? ""} onChange={v => setSf(s => ({ ...s, target_date: v }))} type="date" />
                <div>
                  <label style={L}>Status</label>
                  <select value={sf.status ?? "planning"} onChange={e => setSf(s => ({ ...s, status: e.target.value }))} style={I}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="complete">Complete</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <FTA label="Notes" value={sf.notes ?? ""} onChange={v => setSf(s => ({ ...s, notes: v }))} placeholder="Additional season context" />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <button onClick={saveSeason} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditSeason(false)} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--border)", color: "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 700 }}>
                {SEASON_TYPE_LABEL[season.season_type] ?? season.season_type}
              </span>
              <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>{season.name}</h1>
              {(season.start_date || season.end_date) && (
                <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--text-muted)" }}>
                  {fmtDate(season.start_date)}{season.end_date ? ` – ${fmtDate(season.end_date)}` : ""}
                </p>
              )}
              {season.goal && (
                <p style={{ margin: "0 0 3px", fontSize: "14px", color: "var(--text)", fontStyle: "italic" }}>{season.goal}</p>
              )}
              {(season.target_event || season.target_performance) && (
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                  {[season.target_event, season.target_performance, season.target_date ? fmtDate(season.target_date) : null].filter(Boolean).join(" · ")}
                </p>
              )}
              {season.notes && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>{season.notes}</p>
              )}
            </div>
            <button onClick={() => { setSf({ ...season }); setEditSeason(true); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
          </div>
        )}
      </div>

      {/* Calendar */}
      <SeasonCalendar phases={phases} comps={comps} />

      {/* Phases */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>Phases</p>
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
                      <FI label="Name *" value={phaseF.name ?? ""} onChange={v => setPhaseF(f => ({ ...f, name: v }))} placeholder="e.g. Base, Build, Peak" />
                      <FI label="Start date *" value={phaseF.start_date ?? ""} onChange={v => setPhaseF(f => ({ ...f, start_date: v }))} type="date" />
                      <FI label="End date *" value={phaseF.end_date ?? ""} onChange={v => setPhaseF(f => ({ ...f, end_date: v }))} type="date" />
                      <FI label="Phase no." value={String(phaseF.order ?? idx + 1)} onChange={v => setPhaseF(f => ({ ...f, order: Number(v) }))} type="number" />
                    </div>
                    <FI label="Theme" value={phaseF.focus ?? ""} onChange={v => setPhaseF(f => ({ ...f, focus: v }))} placeholder="e.g. Base, Build, Peak, Taper" />
                    <FTA label="Training focus" value={phaseF.training_focus ?? ""} onChange={v => setPhaseF(f => ({ ...f, training_focus: v }))} placeholder="Key training objectives and load emphasis" />
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
                        <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: PHASE_COLORS[idx % PHASE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>PHASE {ph.order}</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{ph.name}</span>
                        {ph.focus && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>{ph.focus}</span>}
                      </div>
                      <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {fmtDate(ph.start_date)} – {fmtDate(ph.end_date)}
                        {ph.start_date && ph.end_date ? ` · ${phaseLen(ph.start_date, ph.end_date)}` : ""}
                      </p>
                      {ph.key_cue && <p style={{ margin: "0 0 8px", fontSize: "13px", fontStyle: "italic", color: "var(--accent)" }}>{ph.key_cue}</p>}
                      {ph.training_focus && <p style={{ margin: "0 0 5px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>{ph.training_focus}</p>}
                      {ph.competition_notes && (
                        <p style={{ margin: "0 0 5px", fontSize: "12px", color: "var(--text-muted)" }}>
                          <span style={{ fontWeight: 600 }}>Competitions: </span>{ph.competition_notes}
                        </p>
                      )}
                      {ph.coach_notes && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)", opacity: 0.75, lineHeight: 1.5 }}>{ph.coach_notes}</p>}
                    </div>
                    <button onClick={() => { setEditPhaseId(ph.id); setPhaseF({ ...ph }); }} style={{ fontSize: "12px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {showAddPhase && (
            <div style={{ padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
              <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>New phase</p>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                  <FI label="Name *" value={newPhase.name ?? ""} onChange={v => setNewPhase(f => ({ ...f, name: v }))} placeholder="e.g. Base, Build, Peak" />
                  <FI label="Start date *" value={newPhase.start_date ?? ""} onChange={v => setNewPhase(f => ({ ...f, start_date: v }))} type="date" />
                  <FI label="End date *" value={newPhase.end_date ?? ""} onChange={v => setNewPhase(f => ({ ...f, end_date: v }))} type="date" />
                </div>
                <FI label="Theme" value={newPhase.focus ?? ""} onChange={v => setNewPhase(f => ({ ...f, focus: v }))} placeholder="e.g. Base, Build, Peak, Taper" />
                <FTA label="Training focus" value={newPhase.training_focus ?? ""} onChange={v => setNewPhase(f => ({ ...f, training_focus: v }))} placeholder="Key training objectives and load emphasis" />
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
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0", opacity: 0.6 }}>No phases yet. Add phases to build the training structure for this season.</p>
          )}
        </div>
      </div>

      {/* Competition calendar */}
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

          {showAddComp && (
            <div style={{ padding: "16px 18px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
              <p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>New competition</p>
              <CompForm v={newComp} onChange={setNewComp} onSave={addComp} onCancel={() => { setShowAddComp(false); setNewComp({ ...blankComp }); }} saving={saving} />
            </div>
          )}

          {comps.length === 0 && !showAddComp && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0", opacity: 0.6 }}>No competitions scheduled for this season.</p>
          )}
        </div>
      </div>

    </div>
  );
}
