"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputStyle = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1.5px solid var(--warm-tan)",
  outline: "none",
  fontFamily: "var(--font-jost)",
  fontWeight: 500,
  fontSize: "0.85rem",
  letterSpacing: "0.04em",
  color: "var(--dark)",
  padding: "0.5rem 0",
  caretColor: "var(--burnt-orange)",
} as const;

const labelStyle = {
  fontFamily: "var(--font-jost)",
  fontWeight: 500,
  fontSize: "0.52rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  display: "block",
  marginBottom: "0.4rem",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "1.6rem", color: "var(--dark)", marginBottom: "1rem"
        }}>
          Password updated ✦
        </p>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.82rem", letterSpacing: "0.05em", lineHeight: 1.8, color: "var(--muted)"
        }}>
          You&apos;re all set. Taking you home…
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "380px", width: "100%" }}>
      <h1 style={{
        fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
        fontSize: "2rem", letterSpacing: "0.02em", color: "var(--dark)",
        marginBottom: "0.4rem", textAlign: "center"
      }}>
        Set new password
      </h1>
      <p style={{
        fontFamily: "var(--font-jost)", fontWeight: 500,
        fontSize: "0.75rem", letterSpacing: "0.07em",
        color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem"
      }}>
        Choose a new password for your account
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
        <div>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
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
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--cream)", background: "var(--burnt-orange)",
            border: "none", padding: "0.95rem", cursor: "pointer",
            opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
            marginTop: "0.5rem",
          }}
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
