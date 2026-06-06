"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inputStyle = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1.5px solid var(--warm-tan)",
  outline: "none",
  fontFamily: "var(--font-jost)",
  fontWeight: 300,
  fontSize: "0.85rem",
  letterSpacing: "0.04em",
  color: "var(--dark)",
  padding: "0.5rem 0",
  caretColor: "var(--burnt-orange)",
} as const;

const labelStyle = {
  fontFamily: "var(--font-jost)",
  fontWeight: 300,
  fontSize: "0.52rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  display: "block",
  marginBottom: "0.4rem",
};

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?type=recovery`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
          fontSize: "1.6rem", color: "var(--dark)", marginBottom: "1rem"
        }}>
          Email sent ✦
        </p>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 200,
          fontSize: "0.82rem", letterSpacing: "0.05em", lineHeight: 1.8, color: "var(--muted)",
          marginBottom: "2rem"
        }}>
          Check <strong>{email}</strong> for a password reset link.
        </p>
        <Link href="/login" style={{
          fontFamily: "var(--font-jost)", fontWeight: 400,
          fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--burnt-orange)", textDecoration: "none"
        }}>
          ← Back to login
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "380px", width: "100%" }}>

      <h1 style={{
        fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
        fontSize: "2rem", letterSpacing: "0.02em", color: "var(--dark)",
        marginBottom: "0.4rem", textAlign: "center"
      }}>
        Reset password
      </h1>
      <p style={{
        fontFamily: "var(--font-jost)", fontWeight: 200,
        fontSize: "0.75rem", letterSpacing: "0.07em",
        color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem"
      }}>
        Enter your email and we&apos;ll send you a reset link
      </p>

      <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#C95C1A", letterSpacing: "0.04em" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 400,
            fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--cream)", background: "var(--burnt-orange)",
            border: "none", padding: "0.95rem", cursor: "pointer",
            opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
            marginTop: "0.5rem",
          }}
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "2rem", fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", letterSpacing: "0.05em", color: "var(--muted)" }}>
        <Link href="/login" style={{ color: "var(--burnt-orange)", textDecoration: "none" }}>
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
