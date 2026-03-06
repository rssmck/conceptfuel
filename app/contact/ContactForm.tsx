"use client";
import { useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": "contact",
          ...form,
        }).toString(),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        style={{
          padding: "24px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>Message sent.</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Thanks for getting in touch. We will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <label
                htmlFor="name"
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginBottom: "6px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
            >
              <option value="">Select a topic...</option>
              <option value="Feedback on concept//fuel">Feedback on concept//fuel</option>
              <option value="Coaching enquiry">Coaching enquiry</option>
              <option value="Bug or issue">Bug or issue</option>
              <option value="Partnership or collaboration">Partnership or collaboration</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              style={{
                display: "block",
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "6px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={6}
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us what's on your mind..."
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                borderRadius: "4px",
                padding: "10px 12px",
                width: "100%",
                fontFamily: "inherit",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                minHeight: "120px",
                lineHeight: 1.6,
              }}
            />
          </div>

          {status === "error" && (
            <p style={{ color: "var(--danger)", fontSize: "13px" }}>
              Something went wrong. Please try again or reach out directly via our social channels.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              padding: "12px 28px",
              background: status === "sending" ? "var(--surface-2)" : "var(--accent)",
              color: status === "sending" ? "var(--text-muted)" : "var(--bg)",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "4px",
              border: "none",
              cursor: status === "sending" ? "not-allowed" : "pointer",
              alignSelf: "flex-start",
              transition: "all 0.15s",
            }}
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>
    </>
  );
}
