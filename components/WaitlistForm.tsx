"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "waitlist", email }).toString(),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
        You're on the list. We'll be in touch.
      </p>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="email"
            name="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: "1 1 200px", maxWidth: "280px" }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              padding: "8px 20px",
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: status === "sending" ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {status === "sending" ? "..." : "Join waitlist →"}
          </button>
        </div>
        {status === "error" && (
          <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "6px" }}>
            Something went wrong. Try again.
          </p>
        )}
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
          Early access updates. No spam, ever.
        </p>
      </form>
    </>
  );
}
