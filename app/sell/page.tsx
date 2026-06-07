import Link from "next/link";

const STEPS = [
  {
    n: "01",
    title: "Create your profile",
    body: "Set up your seller page in minutes. Add a photo, bio, and location so buyers know who they're shopping from.",
  },
  {
    n: "02",
    title: "List your items",
    body: "Upload photos, set your price, add sizing details, and choose whether to sell, rent, or both. Goes live instantly.",
  },
  {
    n: "03",
    title: "Get paid",
    body: "Connect your bank account via Stripe. Payouts land directly in your account within 2–3 business days of each sale.",
  },
];

const TRUST = [
  { stat: "500+", label: "Active sellers" },
  { stat: "$0", label: "Listing fee" },
  { stat: "10%", label: "Platform fee per sale" },
  { stat: "2–3 days", label: "Payout turnaround" },
];

const WHY = [
  {
    icon: "✦",
    title: "South Asian fashion buyers",
    body: "Our audience specifically shops for Indian, Pakistani, and South Asian clothing — your pieces reach the right people.",
  },
  {
    icon: "✦",
    title: "Sell and rent from one listing",
    body: "List an item for sale, rental, or both simultaneously. Earn from a lehenga you've only worn once — or repeatedly.",
  },
  {
    icon: "✦",
    title: "No upfront costs",
    body: "Listing is always free. We take a small 10% fee only when you make a sale — aligned with your success.",
  },
  {
    icon: "✦",
    title: "Secure, fast payouts",
    body: "Payments handled by Stripe. Your money arrives in your bank account within days, not weeks.",
  },
];

const label: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.7rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "var(--burnt-orange)",
};

export default function SellPage() {
  return (
    <div style={{ background: "var(--cream)" }}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{
        maxWidth: "760px", margin: "0 auto", padding: "5rem 2rem 4rem",
        textAlign: "center"
      }}>
        <p style={{ ...label, display: "block", marginBottom: "1.5rem" }}>
          Sell on Veeral
        </p>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)", color: "#1A1A18",
          lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: "1.5rem"
        }}>
          Your wardrobe deserves<br />a second life
        </h1>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "1rem", letterSpacing: "0.04em", lineHeight: 1.8,
          color: "var(--muted)", maxWidth: "520px", margin: "0 auto 2.5rem"
        }}>
          Turn your pre-loved lehengas, sarees, and sherwanis into cash — or list them for rent and earn every wedding season.
        </p>
        <Link href="/onboarding" style={{
          fontFamily: "var(--font-jost)", fontWeight: 700,
          fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--cream)", background: "#C4440A",
          padding: "1.1rem 2.8rem", textDecoration: "none", display: "inline-block",
          transition: "opacity 0.2s"
        }}>
          Start selling — it&apos;s free
        </Link>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.75rem", color: "var(--muted)", marginTop: "1rem" }}>
          No listing fees · Join 500+ sellers
        </p>
      </section>

      {/* ── Trust stats ──────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--warm-tan)", borderBottom: "1px solid var(--warm-tan)", background: "#EDE8E2" }}>
        <div style={{
          maxWidth: "900px", margin: "0 auto", padding: "2.5rem 2rem",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem",
          textAlign: "center"
        }} className="stats-grid">
          {TRUST.map(t => (
            <div key={t.stat}>
              <p style={{
                fontFamily: "var(--font-cormorant)", fontWeight: 500,
                fontSize: "2.2rem", color: "#C4440A", lineHeight: 1, marginBottom: "0.4rem"
              }}>
                {t.stat}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.1em", color: "#2A2118" }}>
                {t.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem" }}>
          <h2 style={{
            fontFamily: "var(--font-cormorant)", fontWeight: 500,
            fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1A1A18",
            letterSpacing: "0.02em", whiteSpace: "nowrap"
          }}>
            How it works
          </h2>
          <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2.5rem" }} className="steps-grid">
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ position: "relative" }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: "absolute", top: "1.4rem", left: "calc(100% - 0.5rem)",
                  width: "calc(100% - 1rem)", height: "1px",
                  background: "var(--warm-tan)", zIndex: 0
                }} className="step-connector" />
              )}
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                border: "1.5px solid #C4440A", display: "flex",
                alignItems: "center", justifyContent: "center",
                marginBottom: "1.2rem", background: "var(--cream)",
                position: "relative", zIndex: 1
              }}>
                <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500, fontSize: "1rem", color: "#C4440A" }}>
                  {step.n}
                </span>
              </div>
              <h3 style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
                fontSize: "1.3rem", color: "#1A1A18", marginBottom: "0.6rem"
              }}>
                {step.title}
              </h3>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.8, color: "var(--muted)" }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Veeral ───────────────────────────────────────── */}
      <section style={{ background: "#EDE8E2", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem" }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontWeight: 500,
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1A1A18",
              letterSpacing: "0.02em", whiteSpace: "nowrap"
            }}>
              Why sell on Veeral?
            </h2>
            <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }} className="why-grid">
            {WHY.map(w => (
              <div key={w.title} style={{ padding: "1.5rem", background: "var(--cream)", border: "1px solid var(--warm-tan)" }}>
                <p style={{ color: "#C4440A", fontSize: "1rem", marginBottom: "0.75rem" }}>{w.icon}</p>
                <h3 style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.9rem", letterSpacing: "0.04em", color: "#1A1A18", marginBottom: "0.5rem" }}>
                  {w.title}
                </h3>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.8, color: "var(--muted)" }}>
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      <section style={{ textAlign: "center", padding: "5rem 2rem" }}>
        <h2 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#1A1A18",
          marginBottom: "1rem", letterSpacing: "0.02em"
        }}>
          Ready to start selling?
        </h2>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "var(--muted)", marginBottom: "2rem" }}>
          Set up your profile in under 5 minutes.
        </p>
        <Link href="/onboarding" style={{
          fontFamily: "var(--font-jost)", fontWeight: 700,
          fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--cream)", background: "#C4440A",
          padding: "1.1rem 2.8rem", textDecoration: "none", display: "inline-block"
        }}>
          Create your seller profile
        </Link>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .why-grid   { grid-template-columns: 1fr !important; }
          .step-connector { display: none; }
        }
      `}</style>
    </div>
  );
}
