"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

const PENDING_INVITE_KEY = "cf_pending_invite";

type ClaimState =
  | { phase: "idle" }
  | { phase: "claiming" }
  | { phase: "success"; coach_name: string; already_linked: boolean }
  | { phase: "error"; code: string };

const ERROR_MESSAGES: Record<string, string> = {
  not_found:         "This invite link is invalid or has already expired.",
  expired:           "This invite link has expired. Ask your coach to send a new one.",
  already_claimed:   "This invite link has already been used by another athlete.",
  self_invite:       "You cannot accept your own invite.",
  not_authenticated: "You need to be signed in to accept this invite.",
};

function JoinInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const { user, loading, openAuth } = useAuth();
  const token   = params.get("code") ?? "";
  const [state, setState] = useState<ClaimState>({ phase: "idle" });
  const claimedRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (!user && !loading) {
      sessionStorage.setItem(PENDING_INVITE_KEY, token);
    }
  }, [token, user, loading]);

  useEffect(() => {
    if (loading || !user || claimedRef.current) return;
    const pendingToken = token || sessionStorage.getItem(PENDING_INVITE_KEY) || "";
    if (!pendingToken) return;
    claimedRef.current = true;
    sessionStorage.removeItem(PENDING_INVITE_KEY);
    claimInvite(pendingToken);
  }, [user, loading, token]);

  async function claimInvite(t: string) {
    setState({ phase: "claiming" });
    const supabase = createClient();
    const { data, error } = await supabase.rpc("claim_invite", { p_token: t });
    if (error || !data) { setState({ phase: "error", code: "not_found" }); return; }
    if (data.error) { setState({ phase: "error", code: data.error as string }); return; }
    setState({ phase: "success", coach_name: data.coach_name ?? "your coach", already_linked: data.already_linked ?? false });
  }

  if (!token) {
    return (
      <div className="cf-page-narrow">
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Invalid invite</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
          This link is missing an invite code. Ask your coach to resend the invite link.
        </p>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="cf-page-narrow">
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Coach invite</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "32px" }}>
          Your coach has invited you to join their roster on concept//athleticclub.
          Sign in or create a free account to accept.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => openAuth("signin")} style={{ padding: "12px 28px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "14px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
            Sign in
          </button>
          <button onClick={() => openAuth("signup")} style={{ padding: "12px 28px", background: "var(--surface)", color: "var(--text)", fontWeight: 500, fontSize: "14px", borderRadius: "4px", border: "1px solid var(--border)", cursor: "pointer" }}>
            Create account
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "16px" }}>
          Your invite code is saved. Signing in will automatically link you to your coach.
        </p>
      </div>
    );
  }

  return (
    <div className="cf-page-narrow">
      <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>

      {(state.phase === "idle" || state.phase === "claiming") && (
        <>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Accepting invite</h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="cf-dot cf-dot-1" style={{ color: "var(--accent)" }}>·</span>
            <span className="cf-dot cf-dot-2" style={{ color: "var(--accent)" }}>·</span>
            <span className="cf-dot cf-dot-3" style={{ color: "var(--accent)" }}>·</span>
          </div>
        </>
      )}

      {state.phase === "success" && (
        <>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            {state.already_linked ? "Already linked" : "You're in"}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "32px" }}>
            {state.already_linked
              ? `You are already connected to ${state.coach_name}.`
              : `You are now connected to ${state.coach_name}. They can see your calendar, sessions, and results.`}
          </p>
          <button onClick={() => router.push("/profile")} style={{ padding: "12px 28px", background: "var(--accent)", color: "var(--bg)", fontWeight: 600, fontSize: "14px", borderRadius: "4px", border: "none", cursor: "pointer" }}>
            Go to profile
          </button>
        </>
      )}

      {state.phase === "error" && (
        <>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Invite error</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "32px" }}>
            {ERROR_MESSAGES[state.code] ?? "Something went wrong. Ask your coach to send a new invite link."}
          </p>
          <button onClick={() => router.push("/")} style={{ padding: "12px 28px", background: "var(--surface)", color: "var(--text)", fontWeight: 500, fontSize: "14px", borderRadius: "4px", border: "1px solid var(--border)", cursor: "pointer" }}>
            Back to home
          </button>
        </>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="cf-page-narrow">
        <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>concept//coach</p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Loading...</p>
      </div>
    }>
      <JoinInner />
    </Suspense>
  );
}
