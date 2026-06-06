"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ── Placeholder listing data (replace with Supabase fetch by listingId) ───────
const LISTING = {
  id: "1",
  title: "Red Bridal Lehenga with Gold Embroidery",
  price: 4500,
  rent_price: 120,
  us_size: "6",
  category: "Lehenga",
  bg: "#DDD0C5",
  seller_username: "priya_sharma",
};

function formatPrice(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "transparent",
  border: "none", borderBottom: "1.5px solid var(--warm-tan)",
  outline: "none", fontFamily: "var(--font-jost)",
  fontWeight: 300, fontSize: "0.85rem", letterSpacing: "0.04em",
  color: "var(--dark)", padding: "0.5rem 0",
  caretColor: "#C4440A",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 300,
  fontSize: "0.52rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "var(--muted)",
  display: "block", marginBottom: "0.4rem",
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
  fontSize: "1.3rem", color: "var(--dark)", marginBottom: "1.2rem",
};

export default function CheckoutPage({ params }: { params: { listingId: string } }) {
  const searchParams = useSearchParams();
  const isRental    = searchParams.get("type") === "rent";
  const days        = Number(searchParams.get("days") || 1);
  const returnDate  = searchParams.get("returnDate");

  const l           = LISTING;
  const rentalCost  = l.rent_price * days;
  const deposit     = Math.round(l.price * 0.40);
  const totalDue    = isRental ? rentalCost + deposit : l.price;

  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    address: "", city: "", state: "", zip: "",
  });

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    // TODO: create Stripe PaymentIntent, confirm, then redirect
    setTimeout(() => { window.location.href = "/checkout/success"; }, 1200);
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--warm-tan)", padding: "1.2rem 2rem", textAlign: "center" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic",
          fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#C4440A", textDecoration: "none"
        }}>
          veeral
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "4rem", alignItems: "start" }}
          className="checkout-grid"
        >

          {/* LEFT — Forms */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* Shipping */}
            <section>
              <h2 style={sectionHeading}>Shipping address</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                  <div>
                    <label style={labelStyle}>First name</label>
                    <input required style={inputStyle} value={form.firstName} onChange={set("firstName")} placeholder="Priya" />
                  </div>
                  <div>
                    <label style={labelStyle}>Last name</label>
                    <input required style={inputStyle} value={form.lastName} onChange={set("lastName")} placeholder="Sharma" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input required type="email" style={inputStyle} value={form.email} onChange={set("email")} placeholder="priya@email.com" />
                </div>
                <div>
                  <label style={labelStyle}>Street address</label>
                  <input required style={inputStyle} value={form.address} onChange={set("address")} placeholder="123 Main Street, Apt 4B" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input required style={inputStyle} value={form.city} onChange={set("city")} placeholder="New York" />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input required style={inputStyle} value={form.state} onChange={set("state")} placeholder="NY" maxLength={2} />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP</label>
                    <input required style={inputStyle} value={form.zip} onChange={set("zip")} placeholder="10001" maxLength={10} />
                  </div>
                </div>
              </div>
            </section>

            <div style={{ height: "1px", background: "var(--warm-tan)" }} />

            {/* Payment */}
            <section>
              <h2 style={sectionHeading}>Payment</h2>
              <div style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div>
                  <label style={labelStyle}>Card number</label>
                  <input required style={{ ...inputStyle, letterSpacing: "0.12em" }} placeholder="1234 5678 9012 3456" maxLength={19} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                  <div>
                    <label style={labelStyle}>Expiry</label>
                    <input required style={inputStyle} placeholder="MM / YY" maxLength={7} />
                  </div>
                  <div>
                    <label style={labelStyle}>CVC</label>
                    <input required style={inputStyle} placeholder="•••" maxLength={4} type="password" />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Name on card</label>
                  <input required style={inputStyle} placeholder="Priya Sharma" />
                </div>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 300,
                fontSize: "0.6rem", letterSpacing: "0.06em",
                color: "var(--muted)", marginTop: "0.75rem"
              }}>
                🔒 Payments processed securely via Stripe. Veeral never stores your card details.
              </p>
            </section>

            <button
              type="submit" disabled={placing}
              style={{
                width: "100%", padding: "1.1rem",
                background: "#C4440A", border: "none", cursor: "pointer",
                fontFamily: "var(--font-jost)", fontWeight: 400,
                fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--cream)", opacity: placing ? 0.6 : 1, transition: "opacity 0.2s",
              }}
            >
              {placing ? "Placing order…" : `Place order — ${formatPrice(totalDue)}`}
            </button>
          </form>

          {/* RIGHT — Order summary */}
          <aside style={{ position: "sticky", top: "2rem" }}>
            <h2 style={sectionHeading}>Order summary</h2>

            {/* Item card */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--warm-tan)" }}>
              <div style={{ width: "80px", aspectRatio: "3/4", background: l.bg, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.82rem", color: "var(--dark)", marginBottom: "0.3rem", lineHeight: 1.3 }}>
                  {l.title}
                </p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.2rem" }}>
                  {l.category} · US {l.us_size}
                </p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.4rem" }}>
                  @{l.seller_username}
                </p>
                <span style={{
                  fontFamily: "var(--font-jost)", fontWeight: 400,
                  fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: isRental ? "var(--dark)" : "#C4440A",
                  border: `1px solid ${isRental ? "var(--warm-tan)" : "#C4440A"}`,
                  padding: "0.2rem 0.5rem"
                }}>
                  {isRental ? "Rental" : "Purchase"}
                </span>
              </div>
            </div>

            {/* Rental details */}
            {isRental && returnDate && (
              <div style={{ background: "#EDE8E2", padding: "1rem", marginBottom: "1.2rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.3rem" }}>
                  Rental details
                </p>
                {([
                  ["Duration", `${days} ${days === 1 ? "day" : "days"}`],
                  ["Return by", fmtDate(returnDate)],
                  ["Rental cost", formatPrice(rentalCost)],
                  ["Deposit (refundable)", formatPrice(deposit)],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.68rem", color: "var(--muted)" }}>{k}</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: k === "Return by" ? 600 : 400, fontSize: "0.68rem", color: k === "Return by" ? "#C4440A" : "var(--dark)" }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Price breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", paddingBottom: "1rem", borderBottom: "1px solid var(--warm-tan)" }}>
              {isRental ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Rental ({days} days)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(rentalCost)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Security deposit</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(deposit)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Item price</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(l.price)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Shipping</span>
                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)", fontStyle: "italic" }}>Calculated after order</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "1rem" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dark)" }}>Total</span>
              <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "1.8rem", color: "#C4440A" }}>{formatPrice(totalDue)}</span>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
