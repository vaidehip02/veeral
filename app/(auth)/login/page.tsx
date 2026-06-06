"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SocialAuth from "@/components/auth/SocialAuth";

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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if seller needs to complete onboarding
    const { data: profile } = await supabase
      .from("seller_profiles")
      .select("stripe_onboarding_complete, display_name")
      .eq("id", data.user.id)
      .single();

    const role = data.user.user_metadata?.role;
    if (role === "seller" && !profile?.stripe_onboarding_complete) {
      router.push("/onboarding");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <div style={{ maxWidth: "380px", width: "100%" }}>

      {/* Heading */}
      <h1 style={{
        fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
        fontSize: "2rem", letterSpacing: "0.02em", color: "var(--dark)",
        marginBottom: "0.4rem", textAlign: "center"
      }}>
        Welcome back
      </h1>
      <p style={{
        fontFamily: "var(--font-jost)", fontWeight: 200,
        fontSize: "0.75rem", letterSpacing: "0.07em",
        color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem"
      }}>
        Log in to your Veeral account
      </p>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label style={labelStyle}>Password</label>
            <Link href="/forgot-password" style={{
              fontFamily: "var(--font-jost)", fontWeight: 300,
              fontSize: "0.52rem", letterSpacing: "0.12em",
              color: "var(--burnt-orange)", textDecoration: "none"
            }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
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
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0 1.5rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--warm-tan)" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
      </div>

      {/* Social auth */}
      <SocialAuth />

      <p style={{ textAlign: "center", marginTop: "2rem", fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", letterSpacing: "0.05em", color: "var(--muted)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "var(--burnt-orange)", textDecoration: "none" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
