"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

type RealAthlete = {
  id: string;
  name: string;
  classification: string | null;
  club: string | null;
  event_group: string | null;
};

type ProvisionalAthlete = {
  id: string;
  name: string;
  classification: string | null;
  club: string | null;
  event_group: string | null;
  target_event: string | null;
  target_performance: string | null;
  talent_hub: boolean;
};

type PendingInvite = {
  id: string;
  token: string;
  provisional_athlete_id: string | null;
  expires_at: string;
};

const EVENT_GROUPS = [
  { value: "sprints",         label: "Sprints" },
  { value: "hurdles",         label: "Hurdles" },
  { value: "middle_distance", label: "Middle distance" },
  { value: "long_distance",   label: "Long distance" },
  { value: "jumps",           label: "Jumps" },
  { value: "throws",          label: "Throws" },
  { value: "combined",        label: "Combined events" },
];

const INPUT: React.CSSProperties = {
  width: "100%", padding: "8px 10px", background: "var(--bg)",
  border: "1px solid var(--border)", borderRadius: "4px",
  color: "var(--text)", fontSize: "14px", boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px",
};

const emptyForm = { name: "", club: "", event_group: "" };

export default function CoachPage() {
  const { user, loading } = useAuth();
  const [athletes,     setAthletes]     = useState<RealAthlete[]>([]);
  const [provisionals, setProvisionals] = useState<ProvisionalAthlete[]>([]);
  const [invites,      setInvites]      = useState<PendingInvite[]>([]);
  const [fetching,     setFetching]     = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [form,         setForm]         = useState(emptyForm);
  const [saving,       setSaving]       = useState(false);
  const [copied,       setCopied]       = useState<string | null>(null);

  const f = (k: keyof typeof emptyForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const fetchData = useCallback(async () => {
    if (!user) return;
    const sb = createClient();

    const [{ data: caIds }, { data: paData }, { data: invData }] = await Promise.all([
      sb.from("coach_athlete").select("athlete_id").eq("coach_id", user.id).eq("status", "active"),
      sb.from("provisional_athletes")
        .select("id, name, classification, club, event_group, target_event, target_performance, talent_hub")
        .eq("coach_id", user.id).is("merged_into", null).order("created_at"),
      sb.from("athlete_invites")
        .select("id, token, provisional_athlete_id, expires_at")
        .eq("coach_id", user.id).is("claimed_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);

    if (caIds && caIds.length > 0) {
      const { data: profiles } = await sb.from("profiles")
        .select("id, name, classification, club, event_group")
        .in("id", caIds.map(r => r.athlete_id));
      setAthletes((profiles ?? []).map(p => ({ ...p })));
    } else {
      setAthletes([]);
    }

    setProvisionals(paData ?? []);
    setInvites(invData ?? []);
    setFetching(false);
  }, [user]);

  useEffect(() => { if (!loading) fetchData(); }, [user, loading, fetchData]);

  async function handleAddAthlete(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const sb = createClient();
    const { error } = await sb.from("provisional_athletes").insert({
      coach_id:   user.id,
      name:       form.name.trim(),
      club:       form.club       || null,
      event_group: form.event_group || null,
    });
    setSaving(false);
    if (!error) { setForm(emptyForm); setShowAdd(false); fetchData(); }
  }

  async function handleGenerateInvite(provisionalId: string) {
    if (!user) return;
    const sb = createClient();
    const { data } = await sb.from("athlete_invites")
      .insert({ coach_id: user.id, provisional_athlete_id: provisionalId })
      .select("token").single();
    if (data) { copyToClipboard(data.token); fetchData(); }
  }

  function copyToClipboard(token: string) {
    const url = `${window.location.origin}/join?code=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 3000);
  }

  if (loading || fetching) {
    return (
      <div className="cf-page-narrow">
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const total = athletes.length + provisionals.length;

  return (
    <div className="cf-page-narrow">

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Roster</h1>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{ padding: "8px 16px", background: showAdd ? "var(--surface)" : "var(--accent)", color: showAdd ? "var(--text)" : "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: showAdd ? "1px solid var(--border)" : "none", cursor: "pointer" }}
          >
            {showAdd ? "Cancel" : "+ Add athlete"}
          </button>
        </div>
        {total > 0 && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {athletes.length} active{provisionals.length > 0 ? ` · ${provisionals.length} provisional` : ""}
          </p>
        )}
      </div>

      {/* Add athlete form */}
      {showAdd && (
        <form onSubmit={handleAddAthlete} style={{ marginBottom: "32px", padding: "20px", border: "1px solid var(--accent)", borderRadius: "8px", background: "var(--surface)" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700, margin: "0 0 18px" }}>New athlete</p>

          <div style={{ display: "grid", gap: "14px" }}>

            <div>
              <label style={LABEL}>Name *</label>
              <input required value={form.name} onChange={e => f("name", e.target.value)} style={INPUT} placeholder="Full name" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={LABEL}>Club</label>
                <input value={form.club} onChange={e => f("club", e.target.value)} style={INPUT} placeholder="Club name" />
              </div>
              <div>
                <label style={LABEL}>Event group</label>
                <select value={form.event_group} onChange={e => f("event_group", e.target.value)} style={INPUT}>
                  <option value="">Select</option>
                  {EVENT_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>

            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
              Profile, classification, season targets, coaching principles and competition calendar are all set on the athlete page.
            </p>

          </div>

          <div style={{ marginTop: "18px" }}>
            <button type="submit" disabled={saving} style={{ padding: "10px 22px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Add athlete"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {total === 0 && !showAdd && (
        <div style={{ padding: "48px 0", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>No athletes on your roster yet.</p>
          <button onClick={() => setShowAdd(true)} style={{ padding: "10px 22px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "13px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
            Add your first athlete
          </button>
        </div>
      )}

      {/* Active athletes */}
      {athletes.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>Active</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {athletes.map(a => (
              <Link key={a.id} href={`/coach/athlete/${a.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", textDecoration: "none" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{a.name}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    {[a.classification, a.club, a.event_group?.replace("_", " ")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: "16px", flexShrink: 0 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Provisional athletes */}
      {provisionals.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>Provisional</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {provisionals.map(p => {
              const invite = invites.find(i => i.provisional_athlete_id === p.id);
              const inviteUrl = invite ? `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${invite.token}` : null;
              return (
                <div key={p.id} style={{ padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <Link href={`/coach/provisional/${p.id}`} style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                          {p.name}
                        </Link>
                        <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--border)", color: "var(--text-muted)", letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0 }}>
                          PENDING
                        </span>
                        {p.talent_hub && (
                          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--accent)", color: "var(--bg)", letterSpacing: "0.08em", fontWeight: 700, flexShrink: 0 }}>
                            TALENT HUB
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                        {[p.classification, p.target_event, p.target_performance].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {!invite && (
                      <button
                        onClick={() => handleGenerateInvite(p.id)}
                        style={{ fontSize: "12px", padding: "6px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                      >
                        Generate invite
                      </button>
                    )}
                  </div>

                  {invite && inviteUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                      <code style={{ fontSize: "11px", color: "var(--text-muted)", background: "var(--bg)", padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {inviteUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(invite.token)}
                        style={{ fontSize: "12px", padding: "6px 12px", background: copied === invite.token ? "var(--accent)" : "transparent", border: "1px solid var(--border)", borderRadius: "4px", color: copied === invite.token ? "var(--bg)" : "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}
                      >
                        {copied === invite.token ? "Copied" : "Copy link"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session planner */}
      <div>
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "12px" }}>Tools</p>
        <Link href="/coach/session" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", textDecoration: "none" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Session planner</p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Generate a full training session with warm-up, drills, cues and footwear</p>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "16px", marginLeft: "12px" }}>→</span>
        </Link>
      </div>

    </div>
  );
}
