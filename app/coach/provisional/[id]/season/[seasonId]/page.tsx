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
  intensity_days: string[] | null;
};

type Comp = {
  id: string; date: string; end_date: string | null; venue: string | null;
  meeting: string | null; events: string[]; priority: string;
  purpose: string | null; status: string;
  result_time: string | null; result_position: number | null; result_summary: string | null;
};

type TrainingSession = {
  id: string; date: string; session_type: string;
  title: string; description: string | null;
  duration_minutes: number | null; session_rpe: number | null;
};

type DayNote = {
  id: string; date: string; author_id: string; content: string; created_at: string;
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

const SESSION_TYPES = [
  { value: "track",          label: "Track"          },
  { value: "gym",            label: "Gym / Strength"  },
  { value: "mobility",       label: "Mobility"        },
  { value: "cross_training", label: "Cross-training"  },
  { value: "recovery",       label: "Recovery"        },
  { value: "competition",    label: "Competition"     },
  { value: "psych",          label: "Psych / Mental"  },
  { value: "note",           label: "Note"            },
];

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
        <FI label="Events" value={v.events_str} onChange={val => set("events_str", val)} placeholder="Comma-separated, e.g. 100m, 200m" />
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
      {v.status === "completed" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "10px", paddingTop: "6px", borderTop: "1px solid var(--border)" }}>
          <FI label="Result time" value={v.result_time ?? ""} onChange={val => set("result_time", val)} placeholder="e.g. 11.42" />
          <FI label="Position" value={String(v.result_position ?? "")} onChange={val => set("result_position", val ? Number(val) : null)} type="number" />
          <FI label="Result notes" value={v.result_summary ?? ""} onChange={val => set("result_summary", val)} placeholder="Brief result context" />
        </div>
      )}
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

// ─── Season calendar (macro, month-by-month) ─────────────────────────────────

const DAY_NAMES_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SeasonCalendar({ phases, comps, onDayClick }: {
  phases: Phase[]; comps: Comp[];
  onDayClick?: (dateStr: string) => void;
}) {
  const allDates = [
    ...phases.flatMap(p => [p.start_date, p.end_date]),
    ...comps.flatMap(c => [c.date, c.end_date].filter((d): d is string => !!d)),
  ];
  if (allDates.length === 0) return null;

  const minD = allDates.reduce((a, b) => (a < b ? a : b));
  const maxD = allDates.reduce((a, b) => (a > b ? a : b));

  const months: Date[] = [];
  const start = new Date(minD + "T12:00:00");
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const end = new Date(maxD + "T12:00:00");
  const endM = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= endM) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

  function pIdx(dateStr: string) {
    return phases.findIndex(p => dateStr >= p.start_date && dateStr <= p.end_date);
  }
  function compOn(dateStr: string): Comp | undefined {
    return comps.find(c => c.date <= dateStr && (c.end_date ? c.end_date >= dateStr : c.date === dateStr));
  }
  function isCompStart(dateStr: string): Comp | undefined {
    return comps.find(c => c.date === dateStr);
  }

  const usedPriorities = [...new Set(comps.map(c => c.priority))];

  return (
    <div style={{ marginBottom: "36px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>Season calendar</p>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
        {phases.map((ph, i) => (
          <div key={ph.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: PHASE_COLORS[i % PHASE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ph.{ph.order} {ph.name}</span>
          </div>
        ))}
        {usedPriorities.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COMP_DOT[p] ?? "#888", flexShrink: 0, display: "inline-block" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{p === "A" ? "A race" : p.charAt(0).toUpperCase() + p.slice(1)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {months.map(month => {
          const y = month.getFullYear();
          const mo = month.getMonth();
          const daysInMonth = new Date(y, mo + 1, 0).getDate();
          const startOffset = (new Date(y, mo, 1).getDay() + 6) % 7;

          type Cell = null | { d: number; dateStr: string; pi: number; comp: Comp | undefined; compStart: Comp | undefined };
          const cells: Cell[] = [];
          for (let i = 0; i < startOffset; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ d, dateStr, pi: pIdx(dateStr), comp: compOn(dateStr), compStart: isCompStart(dateStr) });
          }
          const rem = cells.length % 7;
          if (rem > 0) for (let i = 0; i < 7 - rem; i++) cells.push(null);

          return (
            <div key={`${y}-${mo}`}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
                {DAY_NAMES_SHORT.map(d => (
                  <div key={d} style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textAlign: "center", padding: "4px 0 6px", letterSpacing: "0.04em", opacity: 0.6 }}>
                    {d}
                  </div>
                ))}
                {cells.map((cell, i) => {
                  const phColor = cell && cell.pi >= 0 ? PHASE_COLORS[cell.pi % PHASE_COLORS.length] : null;
                  const compColor = cell?.comp ? (COMP_DOT[cell.comp.priority] ?? "#888") : null;
                  const isStart = !!cell?.compStart;
                  return (
                    <div
                      key={i}
                      title={cell?.compStart ? `${cell.compStart.meeting || "Competition"} (${cell.compStart.priority})` : undefined}
                      onClick={() => cell && onDayClick?.(cell.dateStr)}
                      style={{
                        minHeight: "40px", borderRadius: "4px",
                        background: phColor ? (isStart ? phColor + "55" : phColor + "22") : cell ? "var(--surface)" : "transparent",
                        border: isStart ? `2px solid ${compColor}` : phColor ? `1px solid ${phColor}44` : "1px solid transparent",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px",
                        cursor: cell ? "pointer" : "default",
                      }}
                    >
                      {cell && (
                        <>
                          <span style={{ fontSize: "12px", fontWeight: isStart ? 700 : 400, color: phColor ?? "var(--text-muted)", lineHeight: 1 }}>
                            {cell.d}
                          </span>
                          {cell.comp && (
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: compColor ?? "#888", display: "block", flexShrink: 0 }} />
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

// ─── Weekly training log ──────────────────────────────────────────────────────

function getWeeks(startStr: string, endStr: string): string[][] {
  const start = new Date(startStr + "T12:00:00");
  const end = new Date(endStr + "T12:00:00");
  const firstMon = new Date(start);
  const dow = (firstMon.getDay() + 6) % 7;
  firstMon.setDate(firstMon.getDate() - dow);

  const weeks: string[][] = [];
  const cur = new Date(firstMon);
  while (cur <= end) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function WeeklyLog({
  season, phases, comps, sessions, dayNotes, onDayClick,
}: {
  season: Season;
  phases: Phase[];
  comps: Comp[];
  sessions: TrainingSession[];
  dayNotes: DayNote[];
  onDayClick: (date: string) => void;
}) {
  if (!season.start_date || !season.end_date) {
    return (
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>Training log</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.6 }}>Add season start and end dates to enable the weekly training log.</p>
      </div>
    );
  }

  const weeks = getWeeks(season.start_date, season.end_date);

  function phaseFor(dateStr: string): Phase | undefined {
    return phases.find(p => dateStr >= p.start_date && dateStr <= p.end_date);
  }
  function phaseIdxFor(dateStr: string): number {
    return phases.findIndex(p => dateStr >= p.start_date && dateStr <= p.end_date);
  }
  function compFor(dateStr: string): Comp | undefined {
    return comps.find(c => c.date <= dateStr && (c.end_date ? c.end_date >= dateStr : c.date === dateStr));
  }
  function sessionsOn(dateStr: string): TrainingSession[] {
    return sessions.filter(s => s.date === dateStr);
  }
  function notesOn(dateStr: string): DayNote[] {
    return dayNotes.filter(n => n.date === dateStr);
  }
  function isIntensityDay(dateStr: string): boolean {
    const ph = phaseFor(dateStr);
    if (!ph?.intensity_days?.length) return false;
    const d = new Date(dateStr + "T12:00:00");
    return ph.intensity_days.includes(WEEKDAY_NAMES[d.getDay()]);
  }
  function isInSeason(dateStr: string): boolean {
    return dateStr >= season.start_date! && dateStr <= season.end_date!;
  }

  const SESSION_TYPE_ICON: Record<string, string> = {
    track: "T", gym: "G", mobility: "M", cross_training: "X",
    recovery: "R", competition: "C", psych: "P", note: "N",
  };

  return (
    <div style={{ marginBottom: "32px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>Training log</p>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Intensity day</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", background: "var(--surface)", padding: "0 4px", borderRadius: "2px" }}>T</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Session logged</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.6 }}>Tap any day to view or log</span>
        </div>
      </div>

      {/* Horizontally scrollable on small screens */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ minWidth: "480px", display: "flex", flexDirection: "column", gap: "0px" }}>
          {weeks.map((week, wi) => {
            const weekSessions = week.flatMap(d => sessionsOn(d));
            const weekNotes = week.flatMap(d => notesOn(d));
            const weekHasData = week.some(d => isInSeason(d));
            if (!weekHasData) return null;

            const firstInSeason = week.find(d => isInSeason(d));
            const ph = firstInSeason ? phaseFor(firstInSeason) : undefined;
            const phIdx = firstInSeason ? phaseIdxFor(firstInSeason) : -1;
            const phColor = phIdx >= 0 ? PHASE_COLORS[phIdx % PHASE_COLORS.length] : null;

            const weekLabel = `${new Date(week[0] + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${new Date(week[6] + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;

            return (
              <div key={wi} style={{ borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "0", alignItems: "stretch" }}>
                  <div style={{ padding: "8px 10px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>{weekLabel}</p>
                    {ph && (
                      <p style={{ margin: "2px 0 0", fontSize: "10px", color: phColor ?? "var(--text-muted)", fontWeight: 600 }}>{ph.name}</p>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {week.map((dateStr, di) => {
                      const inSeason = isInSeason(dateStr);
                      const dayPhIdx = phaseIdxFor(dateStr);
                      const dayPhColor = dayPhIdx >= 0 ? PHASE_COLORS[dayPhIdx % PHASE_COLORS.length] : null;
                      const comp = compFor(dateStr);
                      const compColor = comp ? (COMP_DOT[comp.priority] ?? "#888") : null;
                      const daySessions = sessionsOn(dateStr);
                      const dayNoteCount = notesOn(dateStr).length;
                      const intensity = inSeason && isIntensityDay(dateStr);
                      const d = new Date(dateStr + "T12:00:00");
                      const dayNum = d.getDate();

                      return (
                        <div
                          key={di}
                          onClick={() => inSeason ? onDayClick(dateStr) : undefined}
                          style={{
                            minHeight: "60px",
                            background: inSeason && dayPhColor ? dayPhColor + "18" : "transparent",
                            borderRight: di < 6 ? "1px solid var(--border)" : "none",
                            padding: "5px 4px",
                            cursor: inSeason ? "pointer" : "default",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            opacity: inSeason ? 1 : 0.3,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: dayPhColor ?? "var(--text-muted)", lineHeight: 1 }}>{dayNum}</span>
                            {intensity && (
                              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent)", display: "inline-block", flexShrink: 0 }} />
                            )}
                            {comp && (
                              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: compColor ?? "#888", display: "inline-block", flexShrink: 0 }} />
                            )}
                          </div>

                          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
                            {daySessions.map(s => (
                              <span
                                key={s.id}
                                title={s.title}
                                style={{
                                  fontSize: "9px", fontWeight: 700,
                                  padding: "1px 3px",
                                  borderRadius: "2px",
                                  background: dayPhColor ? dayPhColor + "44" : "var(--surface)",
                                  border: `1px solid ${dayPhColor ?? "var(--border)"}`,
                                  color: dayPhColor ?? "var(--text-muted)",
                                  lineHeight: 1.4,
                                }}
                              >
                                {SESSION_TYPE_ICON[s.session_type] ?? "S"}
                              </span>
                            ))}
                            {dayNoteCount > 0 && (
                              <span style={{ fontSize: "9px", color: "var(--text-muted)", opacity: 0.6, lineHeight: 1.4 }}>
                                {dayNoteCount === 1 ? "1n" : `${dayNoteCount}n`}
                              </span>
                            )}
                          </div>

                          {comp && comp.date === dateStr && (
                            <p style={{ margin: 0, fontSize: "8px", color: compColor ?? "#888", fontWeight: 700, lineHeight: 1.2 }}>
                              {comp.meeting ? comp.meeting.slice(0, 8) : "Comp"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(weekSessions.length > 0 || weekNotes.length > 0) && (
                  <div style={{ padding: "6px 10px 8px", display: "flex", flexDirection: "column", gap: "3px", background: "var(--surface)" }}>
                    {weekSessions.map(s => (
                      <div key={s.id} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "36px", flexShrink: 0 }}>
                          {new Date(s.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)" }}>{s.title}</span>
                        {s.duration_minutes && (
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.duration_minutes}min</span>
                        )}
                        {s.session_rpe && (
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>RPE {s.session_rpe}</span>
                        )}
                      </div>
                    ))}
                    {weekNotes.map(n => (
                      <div key={n.id} style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", width: "36px", flexShrink: 0 }}>
                          {new Date(n.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" })}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--border)", marginRight: "2px" }}>|</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          {n.content.length > 70 ? n.content.slice(0, 70) + "..." : n.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Session form panel ───────────────────────────────────────────────────────

type SessionDraft = {
  date: string; session_type: string; title: string;
  description: string; duration_minutes: string; session_rpe: string;
};

function SessionPanel({
  draft, editId, saving,
  onChange, onSave, onDelete, onClose,
}: {
  draft: SessionDraft; editId: string | null; saving: boolean;
  onChange: (d: SessionDraft) => void;
  onSave: () => void; onDelete?: () => void; onClose: () => void;
}) {
  const set = (k: keyof SessionDraft, v: string) => onChange({ ...draft, [k]: v });
  return (
    <div style={{ display: "grid", gap: "10px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FI label="Date *" value={draft.date} onChange={v => set("date", v)} type="date" />
        <div>
          <label style={L}>Session type *</label>
          <select value={draft.session_type} onChange={e => set("session_type", e.target.value)} style={I}>
            {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <FI label="Title *" value={draft.title} onChange={v => set("title", v)} placeholder="e.g. 3x600m tempo, Hill circuits, Activation" />
      <FTA label="Description / session content" value={draft.description} onChange={v => set("description", v)} placeholder="What was planned and what happened" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <FI label="Duration (minutes)" value={draft.duration_minutes} onChange={v => set("duration_minutes", v)} type="number" placeholder="e.g. 75" />
        <div>
          <label style={L}>Session RPE (1–10)</label>
          <select value={draft.session_rpe} onChange={e => set("session_rpe", e.target.value)} style={I}>
            <option value="">—</option>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
        <button onClick={onSave} disabled={saving} style={{ padding: "7px 18px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={onClose} style={{ padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        {onDelete && (
          <button onClick={onDelete} style={{ marginLeft: "auto", padding: "7px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Delete</button>
        )}
      </div>
    </div>
  );
}

// ─── Day modal ────────────────────────────────────────────────────────────────

const blankSession: SessionDraft = { date: "", session_type: "track", title: "", description: "", duration_minutes: "", session_rpe: "" };

function DayModal({
  dateStr, phases, comps, sessions, dayNotes,
  userId, saving, savingNote,
  onClose, onSaveSession, onDeleteSession, onSaveNote, onDeleteNote,
}: {
  dateStr: string;
  phases: Phase[]; comps: Comp[]; sessions: TrainingSession[]; dayNotes: DayNote[];
  userId: string;
  saving: boolean; savingNote: boolean;
  onClose: () => void;
  onSaveSession: (draft: SessionDraft, editId: string | null) => Promise<boolean>;
  onDeleteSession: (id: string) => Promise<void>;
  onSaveNote: (date: string, content: string) => Promise<void>;
  onDeleteNote: (id: string) => void;
}) {
  const [view, setView] = useState<"detail" | "session">("detail");
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({ ...blankSession, date: dateStr });
  const [noteDraft, setNoteDraft] = useState("");

  const dayPhIdx = phases.findIndex(p => dateStr >= p.start_date && dateStr <= p.end_date);
  const dayPh = dayPhIdx >= 0 ? phases[dayPhIdx] : null;
  const dayComp = comps.find(c => c.date <= dateStr && (c.end_date ? c.end_date >= dateStr : c.date === dateStr));
  const daySess = sessions.filter(s => s.date === dateStr);
  const dayNoteList = dayNotes.filter(n => n.date === dateStr);

  const dayLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  function openEdit(s: TrainingSession) {
    setEditSessionId(s.id);
    setSessionDraft({
      date: s.date, session_type: s.session_type, title: s.title,
      description: s.description ?? "", duration_minutes: String(s.duration_minutes ?? ""),
      session_rpe: String(s.session_rpe ?? ""),
    });
    setView("session");
  }

  async function handleSaveSession() {
    const ok = await onSaveSession(sessionDraft, editSessionId);
    if (ok) { setView("detail"); setEditSessionId(null); }
  }

  async function handleDeleteSession() {
    if (!editSessionId) return;
    await onDeleteSession(editSessionId);
    setView("detail");
    setEditSessionId(null);
  }

  async function handleAddNote() {
    if (!noteDraft.trim()) return;
    await onSaveNote(dateStr, noteDraft);
    setNoteDraft("");
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: "560px", background: "var(--bg)", borderRadius: "16px 16px 0 0", maxHeight: "90vh", overflowY: "auto", padding: "0 20px 40px" }}>
        {/* Drag handle */}
        <div style={{ position: "sticky", top: 0, background: "var(--bg)", paddingTop: "12px", paddingBottom: "8px", zIndex: 1 }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--border)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {view === "session" ? (
              <button onClick={() => { setView("detail"); setEditSessionId(null); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", padding: "0" }}>
                ← Back
              </button>
            ) : (
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{dayLabel}</p>
                {dayPh && (
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: PHASE_COLORS[dayPhIdx % PHASE_COLORS.length], marginRight: "6px", verticalAlign: "middle" }} />
                    Phase {dayPh.order}: {dayPh.name}
                  </p>
                )}
              </div>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>
        </div>

        {view === "detail" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Competition */}
            {dayComp && (
              <div style={{ padding: "12px 14px", background: "var(--surface)", borderRadius: "8px", border: `1px solid ${COMP_DOT[dayComp.priority] ?? "#888"}` }}>
                <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: COMP_DOT[dayComp.priority] ?? "#888" }}>
                  {dayComp.meeting || "Competition"} ({dayComp.priority})
                </p>
                {dayComp.venue && <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{dayComp.venue}</p>}
                {dayComp.events?.length > 0 && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>{dayComp.events.join(", ")}</p>}
              </div>
            )}

            {/* Sessions */}
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Sessions</p>
              {daySess.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {daySess.map(s => (
                    <div key={s.id} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "6px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{s.title}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>
                          {s.session_type.replace(/_/g, " ")}
                          {s.duration_minutes ? ` · ${s.duration_minutes}min` : ""}
                          {s.session_rpe ? ` · RPE ${s.session_rpe}` : ""}
                        </p>
                        {s.description && <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)", opacity: 0.75 }}>{s.description}</p>}
                      </div>
                      <button onClick={() => openEdit(s)} style={{ fontSize: "11px", padding: "4px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>Edit</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.5 }}>No sessions logged.</p>
              )}
              <button
                onClick={() => { setEditSessionId(null); setSessionDraft({ ...blankSession, date: dateStr }); setView("session"); }}
                style={{ marginTop: "10px", width: "100%", padding: "9px", background: "var(--accent)", color: "var(--bg)", fontWeight: 700, fontSize: "14px", borderRadius: "6px", border: "none", cursor: "pointer" }}
              >
                + Log session
              </button>
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Notes</p>
              {dayNoteList.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
                  {dayNoteList.map(n => (
                    <div key={n.id} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {n.author_id === userId ? "You" : "Athlete"} · {new Date(n.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {n.author_id === userId && (
                          <button onClick={() => onDeleteNote(n.id)} style={{ background: "none", border: "none", fontSize: "16px", color: "var(--text-muted)", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text)", lineHeight: 1.55 }}>{n.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="Add a note..."
                  style={{ flex: 1, padding: "8px 10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text)", fontSize: "13px", resize: "vertical", minHeight: "56px", boxSizing: "border-box" }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteDraft.trim()}
                  style={{ padding: "8px 14px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer", opacity: (savingNote || !noteDraft.trim()) ? 0.5 : 1, flexShrink: 0 }}
                >
                  {savingNote ? "..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "4px" }}>
            <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
              {editSessionId ? "Edit session" : "Log session"}
            </p>
            <SessionPanel
              draft={sessionDraft}
              editId={editSessionId}
              saving={saving}
              onChange={setSessionDraft}
              onSave={handleSaveSession}
              onDelete={editSessionId ? handleDeleteSession : undefined}
              onClose={() => { setView("detail"); setEditSessionId(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance trend (SVG) ──────────────────────────────────────────────────

function PerformanceTrend({ comps }: { comps: Comp[] }) {
  const results = comps
    .filter(c => c.status === "completed" && c.result_time)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (results.length < 2) return null;

  function parseTime(t: string): number | null {
    const parts = t.trim().split(":");
    if (parts.length === 2) {
      const [m, s] = parts.map(Number);
      return isNaN(m) || isNaN(s) ? null : m * 60 + s;
    }
    const v = parseFloat(t);
    return isNaN(v) ? null : v;
  }

  const parsed = results.map(c => ({ date: c.date, meeting: c.meeting, time: parseTime(c.result_time!) }));
  const valid = parsed.filter(p => p.time !== null) as { date: string; meeting: string | null; time: number }[];
  if (valid.length < 2) return null;

  const W = 620, H = 120, PAD = { t: 16, r: 16, b: 28, l: 40 };
  const times = valid.map(v => v.time);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const range = maxT - minT || 1;

  function xOf(i: number) { return PAD.l + (i / (valid.length - 1)) * (W - PAD.l - PAD.r); }
  function yOf(t: number) { return PAD.t + ((maxT - t) / range) * (H - PAD.t - PAD.b); }

  const pathD = valid.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v.time)}`).join(" ");

  return (
    <div style={{ marginBottom: "32px" }}>
      <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>Performance trend</p>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: `${W}px`, height: `${H}px`, display: "block" }}>
          <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" />
          {valid.map((v, i) => (
            <g key={i}>
              <circle cx={xOf(i)} cy={yOf(v.time)} r="4" fill="var(--accent)" />
              <text x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                {new Date(v.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </text>
              <text x={xOf(i)} y={yOf(v.time) - 8} textAnchor="middle" fontSize="10" fill="var(--accent)" fontWeight="600">
                {v.time < 60 ? v.time.toFixed(2) : `${Math.floor(v.time / 60)}:${String(Math.round(v.time % 60)).padStart(2, "0")}`}
              </text>
            </g>
          ))}
        </svg>
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

const blankComp: Partial<Comp> & { events_str: string } = { events_str: "", priority: "prep", status: "upcoming" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeasonPage() {
  const { id: athleteId, seasonId } = useParams<{ id: string; seasonId: string }>();
  const { user, loading } = useAuth();

  const [season,      setSeason]      = useState<Season | null>(null);
  const [athleteName, setAthleteName] = useState("");
  const [phases,      setPhases]      = useState<Phase[]>([]);
  const [comps,       setComps]       = useState<Comp[]>([]);
  const [sessions,    setSessions]    = useState<TrainingSession[]>([]);
  const [dayNotes,    setDayNotes]    = useState<DayNote[]>([]);
  const [fetching,    setFetching]    = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [savingNote,  setSavingNote]  = useState(false);

  const [editSeason,  setEditSeason]  = useState(false);
  const [sf,          setSf]          = useState<Partial<Season>>({});

  const [editPhaseId,  setEditPhaseId]  = useState<string | null>(null);
  const [phaseF,       setPhaseF]       = useState<Partial<Phase>>({});
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhase,     setNewPhase]     = useState<Partial<Phase>>({});

  const [editCompId,  setEditCompId]  = useState<string | null>(null);
  const [compF,       setCompF]       = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });
  const [showAddComp, setShowAddComp] = useState(false);
  const [newComp,     setNewComp]     = useState<Partial<Comp> & { events_str: string }>({ ...blankComp });

  const [modalDay, setModalDay] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !athleteId || !seasonId) return;
    const sb = createClient();
    const [{ data: s }, { data: pa }, { data: ph }, { data: co }, { data: sess }, { data: notes }] = await Promise.all([
      sb.from("seasons").select("*").eq("id", seasonId).single(),
      sb.from("provisional_athletes").select("name").eq("id", athleteId).single(),
      sb.from("season_phases")
        .select("id, name, start_date, end_date, focus, training_focus, competition_notes, key_cue, coach_notes, order, intensity_days")
        .eq("season_id", seasonId).order("order"),
      sb.from("competitions")
        .select("id, date, end_date, venue, meeting, events, priority, purpose, status, result_time, result_position, result_summary")
        .eq("season_id", seasonId).order("date"),
      sb.from("training_sessions")
        .select("id, date, session_type, title, description, duration_minutes, session_rpe")
        .eq("provisional_athlete_id", athleteId)
        .gte("date", "2020-01-01")
        .order("date"),
      sb.from("day_notes")
        .select("id, date, author_id, content, created_at")
        .eq("provisional_athlete_id", athleteId)
        .order("created_at"),
    ]);
    setSeason(s);
    setAthleteName(pa?.name ?? "");
    setPhases(ph ?? []);
    setComps(co ?? []);
    setSessions(sess ?? []);
    setDayNotes(notes ?? []);
    setFetching(false);
  }, [user, athleteId, seasonId]);

  useEffect(() => { if (!loading) fetchData(); }, [user, loading, fetchData]);

  // ── Season edit ──────────────────────────────────────────────────────────────

  async function saveSeason() {
    if (!season) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("seasons").update({
      name: sf.name, season_type: sf.season_type,
      start_date: sf.start_date || null, end_date: sf.end_date || null,
      goal: sf.goal || null, target_event: sf.target_event || null,
      target_performance: sf.target_performance || null, target_date: sf.target_date || null,
      status: sf.status, notes: sf.notes || null,
    }).eq("id", seasonId);
    if (!error) { setSeason(s => s ? { ...s, ...sf } : s); setEditSeason(false); }
    setSaving(false);
  }

  // ── Phase CRUD ───────────────────────────────────────────────────────────────

  async function savePhase(phaseId: string) {
    setSaving(true);
    await createClient().from("season_phases").update({
      name: phaseF.name, start_date: phaseF.start_date, end_date: phaseF.end_date,
      order: phaseF.order, focus: phaseF.focus || null,
      training_focus: phaseF.training_focus || null,
      competition_notes: phaseF.competition_notes || null,
      key_cue: phaseF.key_cue || null,
      coach_notes: phaseF.coach_notes || null,
      intensity_days: phaseF.intensity_days?.length ? phaseF.intensity_days : null,
    }).eq("id", phaseId);
    setEditPhaseId(null);
    await fetchData();
    setSaving(false);
  }

  async function addPhase() {
    const { name, start_date, end_date } = newPhase;
    if (!name || !start_date || !end_date) return;
    setSaving(true);
    const maxOrder = phases.reduce((m, p) => Math.max(m, p.order), 0);
    await createClient().from("season_phases").insert({
      provisional_athlete_id: athleteId, season_id: seasonId,
      name, start_date, end_date, order: maxOrder + 1,
      focus: newPhase.focus || null,
      training_focus: newPhase.training_focus || null,
      competition_notes: newPhase.competition_notes || null,
      key_cue: newPhase.key_cue || null,
      coach_notes: newPhase.coach_notes || null,
      intensity_days: newPhase.intensity_days?.length ? newPhase.intensity_days : null,
    });
    setNewPhase({}); setShowAddPhase(false);
    await fetchData(); setSaving(false);
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
    const { date, end_date, venue, meeting, priority, purpose, status, events_str, result_time, result_position, result_summary } = compF;
    await createClient().from("competitions").update({
      date, end_date: end_date || null, venue: venue || null,
      meeting: meeting || null, priority, purpose: purpose || null,
      status, events: parseEvents(events_str),
      result_time: result_time || null,
      result_position: result_position ?? null,
      result_summary: result_summary || null,
    }).eq("id", compId);
    setEditCompId(null); await fetchData(); setSaving(false);
  }

  async function addComp() {
    if (!newComp.date) return;
    setSaving(true);
    await createClient().from("competitions").insert({
      provisional_athlete_id: athleteId, season_id: seasonId,
      date: newComp.date, end_date: newComp.end_date || null,
      venue: newComp.venue || null, meeting: newComp.meeting || null,
      priority: newComp.priority ?? "prep", purpose: newComp.purpose || null,
      status: newComp.status ?? "upcoming",
      events: parseEvents(newComp.events_str ?? ""),
    });
    setNewComp({ ...blankComp }); setShowAddComp(false);
    await fetchData(); setSaving(false);
  }

  async function deleteComp(compId: string) {
    if (!confirm("Delete this competition?")) return;
    await createClient().from("competitions").delete().eq("id", compId);
    fetchData();
  }

  // ── Session CRUD (called from DayModal) ──────────────────────────────────────

  async function saveSession(draft: SessionDraft, editId: string | null): Promise<boolean> {
    const { date, session_type, title, description, duration_minutes, session_rpe } = draft;
    if (!date || !title) return false;
    setSaving(true);
    const payload = {
      date, session_type, title,
      description: description || null,
      duration_minutes: duration_minutes ? Number(duration_minutes) : null,
      session_rpe: session_rpe ? Number(session_rpe) : null,
    };
    const sb = createClient();
    if (editId) {
      await sb.from("training_sessions").update(payload).eq("id", editId);
    } else {
      await sb.from("training_sessions").insert({
        ...payload, provisional_athlete_id: athleteId, season_id: seasonId,
      });
    }
    await fetchData();
    setSaving(false);
    return true;
  }

  async function deleteSession(editId: string): Promise<void> {
    if (!confirm("Delete this session?")) return;
    await createClient().from("training_sessions").delete().eq("id", editId);
    await fetchData();
  }

  // ── Notes CRUD ───────────────────────────────────────────────────────────────

  async function saveNote(date: string, content: string): Promise<void> {
    if (!content.trim() || !user) return;
    setSavingNote(true);
    await createClient().from("day_notes").insert({
      provisional_athlete_id: athleteId,
      date,
      author_id: user.id,
      content: content.trim(),
    });
    await fetchData();
    setSavingNote(false);
  }

  async function deleteNote(noteId: string) {
    await createClient().from("day_notes").delete().eq("id", noteId);
    fetchData();
  }

  // ── Intensity days helper ────────────────────────────────────────────────────

  function toggleIntensityDay(current: string[] | null | undefined, day: string): string[] {
    const arr = current ?? [];
    return arr.includes(day) ? arr.filter(d => d !== day) : [...arr, day];
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

      {/* Macro calendar */}
      <SeasonCalendar phases={phases} comps={comps} onDayClick={setModalDay} />

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
                    <div>
                      <label style={L}>Intensity days</label>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => {
                          const active = phaseF.intensity_days?.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setPhaseF(f => ({ ...f, intensity_days: toggleIntensityDay(f.intensity_days, day) }))}
                              style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent)" : "transparent", color: active ? "var(--bg)" : "var(--text-muted)", cursor: "pointer", fontWeight: active ? 700 : 400 }}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
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
                      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--text-muted)" }}>
                        {fmtDate(ph.start_date)} – {fmtDate(ph.end_date)}
                        {ph.start_date && ph.end_date ? ` · ${phaseLen(ph.start_date, ph.end_date)}` : ""}
                        {ph.intensity_days?.length ? ` · Intensity: ${ph.intensity_days.map(d => d.slice(0, 3)).join(", ")}` : ""}
                      </p>
                      {ph.key_cue && <p style={{ margin: "0 0 6px", fontSize: "13px", fontStyle: "italic", color: "var(--accent)" }}>{ph.key_cue}</p>}
                      {ph.training_focus && <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>{ph.training_focus}</p>}
                      {ph.competition_notes && (
                        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "var(--text-muted)" }}>
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
                <div>
                  <label style={L}>Intensity days</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => {
                      const active = newPhase.intensity_days?.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setNewPhase(f => ({ ...f, intensity_days: toggleIntensityDay(f.intensity_days, day) }))}
                          style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent)" : "transparent", color: active ? "var(--bg)" : "var(--text-muted)", cursor: "pointer", fontWeight: active ? 700 : 400 }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                      {c.status === "completed" && c.result_time && (
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)" }}>{c.result_time}{c.result_position ? ` · P${c.result_position}` : ""}</span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                      {fmtDate(c.date)}{c.end_date ? ` – ${fmtDate(c.end_date)}` : ""}
                      {c.venue ? ` · ${c.venue}` : ""}
                      {c.events?.length > 0 ? ` · ${c.events.join(", ")}` : ""}
                    </p>
                    {c.purpose && <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)", opacity: 0.75 }}>{c.purpose}</p>}
                    {c.result_summary && <p style={{ margin: "3px 0 0", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>{c.result_summary}</p>}
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

      {/* Performance trend */}
      <PerformanceTrend comps={comps} />

      {/* Weekly training log */}
      <WeeklyLog
        season={season}
        phases={phases}
        comps={comps}
        sessions={sessions}
        dayNotes={dayNotes}
        onDayClick={setModalDay}
      />

      {/* Day modal */}
      {modalDay && user && (
        <DayModal
          dateStr={modalDay}
          phases={phases}
          comps={comps}
          sessions={sessions}
          dayNotes={dayNotes}
          userId={user.id}
          saving={saving}
          savingNote={savingNote}
          onClose={() => setModalDay(null)}
          onSaveSession={saveSession}
          onDeleteSession={deleteSession}
          onSaveNote={saveNote}
          onDeleteNote={deleteNote}
        />
      )}

    </div>
  );
}
