"use client";

import { useState } from "react";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1.5px solid var(--warm-tan)", outline: "none",
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.9rem", letterSpacing: "0.04em",
  color: "#0D0906", padding: "0.5rem 0", caretColor: "#C4440A",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.7rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "#2A2118",
  display: "block", marginBottom: "0.4rem",
};

const hintStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.72rem", letterSpacing: "0.06em",
  color: "var(--muted)", marginTop: "0.35rem",
};

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ["Profile", "Payouts", "Done"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "2.5rem" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: i < current ? "#C4440A" : i === current ? "#C4440A" : "transparent",
              border: `1.5px solid ${i <= current ? "#C4440A" : "var(--warm-tan)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s"
            }}>
              {i < current ? (
                <span style={{ color: "var(--cream)", fontSize: "0.75rem" }}>✓</span>
              ) : (
                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.65rem", color: i === current ? "var(--cream)" : "var(--warm-tan)" }}>
                  {i + 1}
                </span>
              )}
            </div>
            <span style={{
              fontFamily: "var(--font-jost)", fontWeight: i === current ? 700 : 500,
              fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase",
              color: i <= current ? "#1A1A18" : "var(--warm-tan)"
            }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: "1px", background: i < current ? "#C4440A" : "var(--warm-tan)", margin: "0 0.75rem", transition: "background 0.3s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Profile ───────────────────────────────────────────────────────────
function StepProfile({ onNext }: { onNext: () => void }) {
  const supabase = createClient();
  const [form, setForm] = useState({ displayName: "", username: "", bio: "", city: "", state: "" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function setField(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setLoading(false); return; }

    let avatarUrl = "";
    if (avatar) {
      // Upload to Cloudinary via our API route
      const fd = new FormData(); fd.append("file", avatar);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      avatarUrl = json.url || "";
    }

    const { error: dbErr } = await supabase.from("seller_profiles").upsert({
      id: user.id,
      username: form.username.toLowerCase().trim(),
      display_name: form.displayName.trim(),
      bio: form.bio.trim() || null,
      location: [form.city, form.state].filter(Boolean).join(", ") || null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    });

    if (dbErr) {
      setError(dbErr.message.includes("unique") ? "That username is taken — try another." : dbErr.message);
      setLoading(false);
    } else {
      onNext();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "1.6rem", color: "#1A1A18", marginBottom: "0.3rem" }}>
          Set up your profile
        </h2>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "var(--muted)" }}>
          This is how buyers will find and recognise you.
        </p>
      </div>

      {/* Avatar upload */}
      <div>
        <label style={labelStyle}>Profile photo</label>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: avatarPreview ? "transparent" : "var(--warm-tan)",
            border: "1px solid var(--warm-tan)", overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: "var(--font-cormorant)", fontSize: "1.6rem", color: "var(--muted)", fontStyle: "italic" }}>P</span>
            }
          </div>
          <label style={{
            fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: "#C4440A", border: "1px solid #C4440A",
            padding: "0.5rem 1rem", cursor: "pointer"
          }}>
            {avatarPreview ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
        <div>
          <label style={labelStyle}>Display name</label>
          <input required style={inputStyle} value={form.displayName} onChange={setField("displayName")} placeholder="Priya Sharma" />
        </div>
        <div>
          <label style={labelStyle}>Username</label>
          <input
            required style={inputStyle}
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase() }))}
            placeholder="priya_sharma"
            maxLength={30}
          />
          <p style={hintStyle}>veeral.com/sellers/{form.username || "your-handle"}</p>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Bio <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea
          value={form.bio} onChange={setField("bio")}
          rows={3} maxLength={200}
          placeholder="Tell buyers what you sell and what makes your pieces special…"
          style={{ ...inputStyle, borderBottom: "none", border: "1px solid var(--warm-tan)", padding: "0.6rem 0.8rem", resize: "none" }}
        />
        <p style={hintStyle}>{200 - form.bio.length} characters remaining</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
        <div>
          <label style={labelStyle}>City <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <input style={inputStyle} value={form.city} onChange={setField("city")} placeholder="New York" />
        </div>
        <div>
          <label style={labelStyle}>State <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <input style={inputStyle} value={form.state} onChange={setField("state")} placeholder="NY" maxLength={2} />
        </div>
      </div>

      {error && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#C4440A" }}>{error}</p>}

      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "1rem", background: "#C4440A", border: "none", cursor: "pointer",
        fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem",
        letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cream)",
        opacity: loading ? 0.6 : 1, transition: "opacity 0.2s"
      }}>
        {loading ? "Saving…" : "Continue →"}
      </button>
    </form>
  );
}

// ── Step 2: Stripe Connect ────────────────────────────────────────────────────
function StepStripe({ onNext }: { onNext: () => void }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setConnecting(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong. Please try again.");
        setConnecting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setConnecting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "1.6rem", color: "#1A1A18", marginBottom: "0.3rem" }}>
          Connect your bank account
        </h2>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.7 }}>
          Veeral uses Stripe to pay sellers securely. Connect your bank account to receive payouts within 2–3 business days of each sale.
        </p>
      </div>

      {/* What to expect */}
      <div style={{ border: "1px solid var(--warm-tan)", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {[
          ["🔒", "Secure", "Your bank details are handled entirely by Stripe — Veeral never sees them."],
          ["⚡", "Fast payouts", "Funds reach your account within 2–3 business days of each completed sale."],
          ["💸", "You keep what you list", "Buyers pay a small platform fee on top of your listed price. You receive exactly what you listed — no deductions."],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{icon}</span>
            <div>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.85rem", color: "#1A1A18", marginBottom: "0.15rem" }}>{title}</p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#C4440A" }}>{error}</p>}

      <button onClick={handleConnect} disabled={connecting} style={{
        width: "100%", padding: "1rem", background: "#C4440A", border: "none", cursor: "pointer",
        fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem",
        letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cream)",
        opacity: connecting ? 0.6 : 1, transition: "opacity 0.2s",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
      }}>
        {connecting ? "Redirecting to Stripe…" : "Connect with Stripe →"}
      </button>

      <button onClick={onNext} style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.75rem",
        letterSpacing: "0.1em", color: "var(--muted)", textDecoration: "underline",
        textUnderlineOffset: "3px"
      }}>
        Skip for now — I&apos;ll connect later
      </button>
    </div>
  );
}

// ── Step 3: Done ──────────────────────────────────────────────────────────────
function StepDone() {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center" }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: "rgba(196,68,10,0.08)", border: "1.5px solid #C4440A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.8rem", color: "#C4440A"
      }}>
        ✦
      </div>
      <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "2rem", color: "#1A1A18" }}>
        You&apos;re ready to sell!
      </h2>
      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "var(--muted)", lineHeight: 1.8, maxWidth: "380px" }}>
        Your seller profile is live. Create your first listing now and start reaching thousands of South Asian fashion buyers.
      </p>
      <Link href="/dashboard/listings/new" style={{
        fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem",
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: "var(--cream)", background: "#C4440A",
        padding: "1rem 2.5rem", textDecoration: "none", display: "inline-block"
      }}>
        Create your first listing →
      </Link>
      <Link href="/dashboard" style={{
        fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.78rem",
        letterSpacing: "0.08em", color: "var(--muted)", textDecoration: "underline",
        textUnderlineOffset: "3px"
      }}>
        Go to my dashboard
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{
            fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic",
            fontSize: "1.8rem", color: "#C4440A", textDecoration: "none"
          }}>
            veeral
          </Link>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginTop: "0.4rem" }}>
            Seller onboarding
          </p>
        </div>

        <Steps current={step} />

        {step === 0 && <StepProfile onNext={() => setStep(1)} />}
        {step === 1 && <StepStripe onNext={() => setStep(2)} />}
        {step === 2 && <StepDone />}
      </div>
    </div>
  );
}
