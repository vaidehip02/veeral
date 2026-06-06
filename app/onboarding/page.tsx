"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Upsert the seller profile
    const { error } = await supabase
      .from("seller_profiles")
      .upsert({
        id: user.id,
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
      });

    if (error) {
      setError(error.message.includes("unique") ? "That username is taken — try another." : error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>

      {/* Wordmark */}
      <header style={{ padding: "1.8rem 2rem", textAlign: "center" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic",
          fontSize: "2.2rem", letterSpacing: "-0.02em", color: "#C4440A", textDecoration: "none"
        }}>
          veeral
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ maxWidth: "420px", width: "100%" }}>

          <h1 style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
            fontSize: "2rem", letterSpacing: "0.02em", color: "var(--dark)",
            marginBottom: "0.4rem", textAlign: "center"
          }}>
            Set up your seller profile
          </h1>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 200,
            fontSize: "0.75rem", letterSpacing: "0.07em",
            color: "var(--muted)", textAlign: "center", marginBottom: "2.5rem"
          }}>
            This is how buyers will find and recognise you
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
            <div>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
                placeholder="priya_sharma"
                maxLength={30}
                style={inputStyle}
              />
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", letterSpacing: "0.1em", color: "var(--warm-tan)", marginTop: "0.4rem" }}>
                shopveeral.com/sellers/{username || "your-username"}
              </p>
            </div>

            <div>
              <label style={labelStyle}>Display name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Priya Sharma"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Bio <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell buyers a little about you and what you sell…"
                rows={3}
                maxLength={200}
                style={{
                  ...inputStyle,
                  borderBottom: "none",
                  border: "1px solid var(--warm-tan)",
                  padding: "0.6rem 0.8rem",
                  resize: "none",
                  width: "100%",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Location <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Mumbai, Delhi, London…"
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
              {loading ? "Saving…" : "Complete profile →"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 300,
                fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--muted)", background: "none", border: "none",
                cursor: "pointer", textAlign: "center"
              }}
            >
              Skip for now
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
