"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SocialAuth from "@/components/auth/SocialAuth";

type Role = "buyer" | "seller";

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

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<Role>("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: `${window.location.origin}/callback?role=${role}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300, fontSize: "1.6rem", color: "var(--dark)", marginBottom: "1rem" }}>
          Check your email ✦
        </p>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 200, fontSize: "0.82rem", letterSpacing: "0.05em", lineHeight: 1.8, color: "var(--muted)" }}>
          We sent a confirmation link to <strong>{email}</strong>.<br />
          Click it to activate your account.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "380px", width: "100%" }}>

      {/* Heading */}
      <h1 style={{
        fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
        fontSize: "2rem", letterSpacing: "0.02em", color: "var(--dark)",
        marginBottom: "0.4rem", textAlign: "center"
      }}>
        Create an account
      </h1>
      <p style={{
        fontFamily: "var(--font-jost)", fontWeight: 200,
        fontSize: "0.75rem", letterSpacing: "0.07em",
        color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem"
      }}>
        Join Veeral to buy, sell, or rent South Asian fashion
      </p>

      {/* Role toggle */}
      <div style={{ display: "flex", border: "1px solid var(--warm-tan)", marginBottom: "2rem" }}>
        {(["buyer", "seller"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            style={{
              flex: 1,
              padding: "0.65rem",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-jost)",
              fontWeight: 400,
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: role === r ? "var(--burnt-orange)" : "transparent",
              color: role === r ? "var(--cream)" : "var(--muted)",
              transition: "all 0.2s",
            }}
          >
            {r === "buyer" ? "I want to buy / rent" : "I want to sell"}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
        <div>
          <label style={labelStyle}>Full name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Priya Sharma"
            style={inputStyle}
          />
        </div>

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

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
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
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0 1.5rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--warm-tan)" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
      </div>

      {/* Social auth */}
      <SocialAuth role={role} />

      <p style={{ textAlign: "center", marginTop: "2rem", fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", letterSpacing: "0.05em", color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--burnt-orange)", textDecoration: "none" }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
