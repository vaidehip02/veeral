"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ── Placeholder — replace with Supabase fetch using listingId ─────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

// ── Shared style tokens ───────────────────────────────────────────────────────
const label: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.7rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "#2A2118",
  display: "block", marginBottom: "0.4rem",
};

const input: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1.5px solid #E8DDD3", outline: "none",
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.85rem", letterSpacing: "0.04em",
  color: "#0D0906", padding: "0.5rem 0", caretColor: "#C4440A",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
  fontSize: "1.25rem", color: "#1A1A18", marginBottom: "1.2rem",
};

const rowBetween: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "baseline",
};

export default function CheckoutPage({ params: _params }: { params: { listingId: string } }) {
  const router = useRouter();
  const sp = useSearchParams();
  const isRental   = sp.get("type") === "rent";
  const days       = Number(sp.get("days") || 1);
  const returnDate = sp.get("returnDate") || "";

  const l = LISTING;
  const rentalCost = l.rent_price * days;
  const deposit    = Math.round(l.price * 0.40);
  const shipping   = 18;
  const subtotal   = isRental ? rentalCost : l.price;
  const total      = subtotal + shipping + (isRental ? deposit : 0);

  const [promoCode, setPromoCode]   = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [placing, setPlacing]       = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    address1: "", address2: "", city: "", state: "", zip: "",
  });

  function setField(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function applyPromo() {
    if (promoCode.trim().toUpperCase() === "VEERAL10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
      setPromoApplied(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    // TODO: create Stripe PaymentIntent and confirm
    const q = new URLSearchParams({
      isRental: String(isRental), days: String(days), returnDate,
      address: `${form.address1}, ${form.city}, ${form.state} ${form.zip}`,
    });
    setTimeout(() => router.push(`/checkout/success?${q}`), 1200);
  }

  const discount = promoApplied ? Math.round(subtotal * 0.10) : 0;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">

        {/* Page title */}
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1A1A18",
          marginBottom: "2rem", letterSpacing: "0.02em"
        }}>
          Checkout
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "3.5rem", alignItems: "start" }}
          className="checkout-grid"
        >

          {/* ── LEFT: Order summary ─────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Item card */}
            <section>
              <p style={sectionTitle}>Order summary</p>
              <div style={{ display: "flex", gap: "1.2rem", padding: "1.2rem", border: "1px solid #E8DDD3" }}>
                {/* Photo */}
                <div style={{ width: "90px", aspectRatio: "3/4", background: l.bg, flexShrink: 0 }} />
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", marginBottom: "0.3rem", lineHeight: 1.4 }}>
                    {l.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#2A2118", marginBottom: "0.2rem" }}>
                    {l.category} · US Size {l.us_size}
                  </p>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#3D3830", marginBottom: "0.6rem" }}>
                    @{l.seller_username}
                  </p>
                  <span style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                    color: isRental ? "#1A1A18" : "#C4440A",
                    border: `1px solid ${isRental ? "#E8DDD3" : "#C4440A"}`,
                    padding: "0.22rem 0.6rem"
                  }}>
                    {isRental ? "Rental" : "Purchase"}
                  </span>
                </div>
                {/* Price */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.3rem", color: "#C4440A" }}>
                    {isRental ? fmt(rentalCost) : fmt(l.price)}
                  </p>
                  {isRental && (
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", color: "#3D3830" }}>
                      {days} days × {fmt(l.rent_price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Rental detail box */}
              {isRental && returnDate && (
                <div style={{
                  background: "rgba(196,68,10,0.05)", border: "1px solid rgba(196,68,10,0.2)",
                  borderTop: "none", padding: "1.2rem",
                }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.8rem" }}>
                    ✦ Rental details
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    {([
                      ["Duration",             `${days} ${days === 1 ? "day" : "days"}`],
                      ["Daily rate",           fmt(l.rent_price)],
                      ["Total rental cost",    fmt(rentalCost)],
                      ["Security deposit (40%, refundable)", fmt(deposit)],
                      ["Return by",            fmtDate(returnDate)],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} style={{ ...rowBetween }}>
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#2A2118" }}>{k}</span>
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: k === "Return by" ? 700 : 400, fontSize: "0.82rem", color: k === "Return by" ? "#C4440A" : "#1A1A18" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Promo code */}
            <section>
              <p style={sectionTitle}>Promo code</p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={label}>Code</label>
                  <input
                    style={{ ...input, textTransform: "uppercase" }}
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError(""); setPromoApplied(false); }}
                    placeholder="VEERAL10"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyPromo}
                  style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#C4440A", border: "1px solid #C4440A", background: "transparent",
                    padding: "0.65rem 1.2rem", cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 0.2s", flexShrink: 0,
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "#C4440A"; e.currentTarget.style.color = "var(--cream)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#C4440A"; }}
                >
                  Apply
                </button>
              </div>
              {promoApplied && (
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#5a8a5a", marginTop: "0.5rem" }}>
                  ✓ Code applied — 10% off subtotal
                </p>
              )}
              {promoError && (
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#C4440A", marginTop: "0.5rem" }}>
                  {promoError}
                </p>
              )}
            </section>

            {/* Order total */}
            <section style={{ border: "1px solid #E8DDD3", padding: "1.2rem" }}>
              <p style={sectionTitle}>Order total</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>
                    {isRental ? "Rental cost" : "Item price"}
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>{fmt(subtotal)}</span>
                </div>
                {promoApplied && (
                  <div style={rowBetween}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#5a8a5a" }}>Promo (VEERAL10)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#5a8a5a" }}>−{fmt(discount)}</span>
                  </div>
                )}
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>Shipping</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>{fmt(shipping)}</span>
                </div>
                {isRental && (
                  <div style={rowBetween}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>Security deposit (refundable)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>{fmt(deposit)}</span>
                  </div>
                )}
                <div style={{ height: "1px", background: "#E8DDD3", margin: "0.4rem 0" }} />
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1A18" }}>
                    Total
                  </span>
                  <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.7rem", color: "#C4440A" }}>
                    {fmt(total - discount)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ── RIGHT: Shipping + Payment ──────────────────────── */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "sticky", top: "6rem" }}>

            {/* Shipping */}
            <section>
              <p style={sectionTitle}>Shipping address</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={label}>First name</label>
                    <input required style={input} value={form.firstName} onChange={setField("firstName")} placeholder="Priya" />
                  </div>
                  <div>
                    <label style={label}>Last name</label>
                    <input required style={input} value={form.lastName} onChange={setField("lastName")} placeholder="Sharma" />
                  </div>
                </div>
                <div>
                  <label style={label}>Email</label>
                  <input required type="email" style={input} value={form.email} onChange={setField("email")} placeholder="priya@email.com" />
                </div>
                <div>
                  <label style={label}>Address line 1</label>
                  <input required style={input} value={form.address1} onChange={setField("address1")} placeholder="123 Main Street" />
                </div>
                <div>
                  <label style={label}>Address line 2 <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input style={input} value={form.address2} onChange={setField("address2")} placeholder="Apt 4B" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: "1rem" }}>
                  <div>
                    <label style={label}>City</label>
                    <input required style={input} value={form.city} onChange={setField("city")} placeholder="New York" />
                  </div>
                  <div>
                    <label style={label}>State</label>
                    <input required style={input} value={form.state} onChange={setField("state")} placeholder="NY" maxLength={2} />
                  </div>
                  <div>
                    <label style={label}>ZIP</label>
                    <input required style={input} value={form.zip} onChange={setField("zip")} placeholder="10001" maxLength={10} />
                  </div>
                </div>
              </div>
            </section>

            {/* Payment */}
            <section>
              <p style={sectionTitle}>Payment</p>
              <div style={{ border: "1px solid #E8DDD3", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1.3rem" }}>
                <div>
                  <label style={label}>Card number</label>
                  <input
                    required
                    style={{ ...input, letterSpacing: "0.1em" }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                      e.target.value = v.replace(/(.{4})/g, "$1 ").trim();
                    }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={label}>Expiry</label>
                    <input required style={input} placeholder="MM / YY" maxLength={7} />
                  </div>
                  <div>
                    <label style={label}>CVV</label>
                    <input required style={input} placeholder="•••" type="password" maxLength={4} />
                  </div>
                </div>
                <div>
                  <label style={label}>Name on card</label>
                  <input required style={input} placeholder="Priya Sharma" />
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.06em", color: "#3D3830", marginTop: "0.6rem" }}>
                🔒 Payments processed securely via Stripe
              </p>
            </section>

            {/* Place order */}
            <button
              type="submit" disabled={placing}
              style={{
                width: "100%", padding: "1.05rem", border: "none", cursor: "pointer",
                background: "#C4440A", color: "var(--cream)",
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                opacity: placing ? 0.6 : 1, transition: "opacity 0.2s",
              }}
              onMouseOver={e => !placing && (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={e => (e.currentTarget.style.opacity = placing ? "0.6" : "1")}
            >
              {placing ? "Placing order…" : `Place order — ${fmt(total - discount)}`}
            </button>

            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.06em", color: "#3D3830", textAlign: "center", marginTop: "-0.5rem" }}>
              By placing an order you agree to Veeral&apos;s terms and conditions.
            </p>
          </form>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
