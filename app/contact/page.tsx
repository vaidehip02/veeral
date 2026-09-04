"use client";

import { useState } from "react";
import Link from "next/link";

const SUBJECTS = [
  "Order issue",
  "Rental issue",
  "Payment or payout",
  "Listing question",
  "Account help",
  "Report a user or listing",
  "Other",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  border: "1px solid var(--warm-tan)",
  background: "#fff",
  fontFamily: "var(--font-jost)",
  fontSize: "0.88rem",
  color: "#1A1A18",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)",
  fontWeight: 600,
  fontSize: "0.65rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--muted)",
  display: "block",
  marginBottom: "0.4rem",
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const { error: e } = await res.json();
        setError(e ?? "Something went wrong.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ borderBottom: "1px solid var(--warm-tan)", padding: "4rem 1.5rem 3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "1rem" }}>
          ✦ Contact us
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "#1A1A18", marginBottom: "1rem", lineHeight: 1.1 }}>
          We&apos;re here to help
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "var(--muted)", maxWidth: "420px", margin: "0 auto", lineHeight: 1.8 }}>
          Send us a message and we&apos;ll get back to you as soon as possible — usually within one business day.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        {sent ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.75rem" }}>
              Message sent
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.8, marginBottom: "2rem" }}>
              Thanks for reaching out. We&apos;ll reply to <strong>{form.email}</strong> within one business day.
            </p>
            <Link href="/" style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "0.9rem 2rem", background: "var(--burnt-orange)", color: "#fff", textDecoration: "none", display: "inline-block" }}>
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Vaidehi Patel"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <select
                value={form.subject}
                onChange={e => set("subject", e.target.value)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.subject ? "#1A1A18" : "#A89E98" }}
              >
                <option value="" disabled>Select a topic…</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                value={form.message}
                onChange={e => set("message", e.target.value)}
                placeholder="Describe your issue or question in as much detail as possible — include your order number if relevant."
                rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
              />
            </div>

            {error && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#991B1B" }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "1rem 2rem", background: submitting ? "var(--warm-tan)" : "var(--burnt-orange)", color: submitting ? "var(--muted)" : "#fff", border: "none", cursor: submitting ? "not-allowed" : "pointer", alignSelf: "flex-start" }}
            >
              {submitting ? "Sending…" : "Send message →"}
            </button>

            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.6, lineHeight: 1.7 }}>
              Prefer email? Write to us directly at{" "}
              <a href="mailto:help@shopveeral.com" style={{ color: "var(--burnt-orange)", textDecoration: "none" }}>help@shopveeral.com</a>.
            </p>

          </form>
        )}
      </div>
    </div>
  );
}
