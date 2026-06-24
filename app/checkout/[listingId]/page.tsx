"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

// ── Style tokens ──────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.7rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "#2A2118",
  display: "block", marginBottom: "0.4rem",
};
const inputStyle: React.CSSProperties = {
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

// ── Stripe Elements appearance ────────────────────────────────────────────────
const elementsAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary:    "#C4440A",
    colorBackground: "#FAF6F1",
    colorText:       "#0D0906",
    colorDanger:     "#991B1B",
    fontFamily:      "Jost, system-ui, sans-serif",
    borderRadius:    "0px",
    spacingUnit:     "4px",
  },
};

// ── Inner payment form (needs to be inside <Elements>) ───────────────────────
interface PaymentFormProps {
  label: string;
  amount: number; // cents
  buttonLabel: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function PaymentForm({ label, amount, buttonLabel, onSuccess, onError }: PaymentFormProps) {
  const stripe   = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // fallback for redirect-based methods
      },
      redirect: "if_required",
    });
    if (error) {
      onError(error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6B5E52" }}>
        {label} — {fmt(amount)}
      </p>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        style={{
          width: "100%", padding: "1.05rem", border: "none",
          background: "#C4440A", color: "var(--cream)",
          fontFamily: "var(--font-jost)", fontWeight: 600,
          fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
          cursor: !stripe || submitting ? "not-allowed" : "pointer",
          opacity: !stripe || submitting ? 0.6 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {submitting ? "Processing…" : buttonLabel}
      </button>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function CheckoutPage({ params: _params }: { params: { listingId: string } }) {
  const router     = useRouter();
  const sp         = useSearchParams();
  const isRental   = sp.get("type") === "rent";
  const days       = Number(sp.get("days") || 1);
  const startDate  = sp.get("startDate")  || "";
  const returnDate = sp.get("returnDate") || "";
  const depositPct = Number(sp.get("depositPct") || 40);

  const l = LISTING;

  // Display amounts (dollars, for the summary — actual cents used for Stripe)
  const rentalCostDollars = l.rent_price * days;
  const depositDollars    = Math.round(l.price * depositPct / 100);
  const shipping          = 18;
  const subtotalDollars   = isRental ? rentalCostDollars : l.price;

  // Cents (what Stripe actually charges)
  const rentalCents  = rentalCostDollars * 100;
  const depositCents = depositDollars * 100;
  const shippingCents = shipping * 100;
  const saleCents    = l.price * 100;

  // Checkout state machine
  // sale:   "address" → "paying" → "done"
  // rental: "address" → "paying_rental" → "paying_deposit" → "done"
  type Stage = "address" | "paying" | "paying_rental" | "paying_deposit" | "done";
  const [stage,    setStage]    = useState<Stage>("address");
  const [orderId,  setOrderId]  = useState<string | null>(null);
  const [rentalSecret,  setRentalSecret]  = useState<string | null>(null);
  const [depositSecret, setDepositSecret] = useState<string | null>(null);
  const [saleSecret,    setSaleSecret]    = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [promoCode,    setPromoCode]    = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError,   setPromoError]   = useState("");
  const discount = promoApplied ? Math.round(subtotalDollars * 0.10) : 0;

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
      setPromoApplied(true); setPromoError("");
    } else {
      setPromoError("Invalid promo code."); setPromoApplied(false);
    }
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setApiError(null);
    try {
      const res = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: _params.listingId,
          type: isRental ? "rent" : "sale",
          ...(isRental && {
            days,
            start_date:  startDate  ? new Date(startDate).toISOString().slice(0, 10)  : undefined,
            return_date: returnDate ? new Date(returnDate).toISOString().slice(0, 10) : undefined,
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setOrderId(data.orderId);
      if (isRental) {
        setRentalSecret(data.rentalClientSecret);
        setDepositSecret(data.depositClientSecret);
        setStage("paying_rental");
      } else {
        setSaleSecret(data.clientSecret);
        setStage("paying");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  // Navigate to success on completion
  useEffect(() => {
    if (stage === "done" && orderId) {
      const q = new URLSearchParams({
        isRental: String(isRental),
        days: String(days),
        returnDate,
        address: `${form.address1}, ${form.city}, ${form.state} ${form.zip}`,
        orderId,
      });
      router.push(`/checkout/success?${q}`);
    }
  }, [stage]);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">

        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1A1A18",
          marginBottom: "2rem", letterSpacing: "0.02em",
        }}>
          Checkout
        </h1>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "3.5rem", alignItems: "start" }}
          className="checkout-grid"
        >

          {/* ── LEFT: Order summary ─────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Item card */}
            <section>
              <p style={sectionTitle}>Order summary</p>
              <div style={{ display: "flex", gap: "1.2rem", padding: "1.2rem", border: "1px solid #E8DDD3" }}>
                <div style={{ width: "90px", aspectRatio: "3/4", background: l.bg, flexShrink: 0 }} />
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
                    padding: "0.22rem 0.6rem",
                  }}>
                    {isRental ? "Rental" : "Purchase"}
                  </span>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.3rem", color: "#C4440A" }}>
                    {isRental ? `$${rentalCostDollars.toLocaleString()}` : `$${l.price.toLocaleString()}`}
                  </p>
                  {isRental && (
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", color: "#3D3830" }}>
                      {days} days × ${l.rent_price}/day
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
                      ["Duration",                                   `${days} ${days === 1 ? "day" : "days"}`],
                      ["Daily rate",                                 `$${l.rent_price}/day`],
                      ["Total rental cost",                          `$${rentalCostDollars.toLocaleString()}`],
                      [`Security deposit (${depositPct}%, refundable)`, `$${depositDollars.toLocaleString()}`],
                      ["Return by",                                  returnDate ? fmtDate(returnDate) : "—"],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} style={rowBetween}>
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#2A2118" }}>{k}</span>
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: k === "Return by" ? 700 : 400, fontSize: "0.82rem", color: k === "Return by" ? "#C4440A" : "#1A1A18" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Promo code */}
            {stage === "address" && (
              <section>
                <p style={sectionTitle}>Promo code</p>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Code</label>
                    <input
                      style={{ ...inputStyle, textTransform: "uppercase" }}
                      value={promoCode}
                      onChange={e => { setPromoCode(e.target.value); setPromoError(""); setPromoApplied(false); }}
                      placeholder="VEERAL10"
                    />
                  </div>
                  <button
                    type="button" onClick={applyPromo}
                    style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
                      color: "#C4440A", border: "1px solid #C4440A", background: "transparent",
                      padding: "0.65rem 1.2rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#5a8a5a", marginTop: "0.5rem" }}>✓ Code applied — 10% off</p>}
                {promoError   && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#C4440A", marginTop: "0.5rem" }}>{promoError}</p>}
              </section>
            )}

            {/* Order total */}
            <section style={{ border: "1px solid #E8DDD3", padding: "1.2rem" }}>
              <p style={sectionTitle}>Order total</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>
                    {isRental ? "Rental cost" : "Item price"}
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>
                    ${subtotalDollars.toLocaleString()}
                  </span>
                </div>
                {promoApplied && (
                  <div style={rowBetween}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#5a8a5a" }}>Promo (VEERAL10)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#5a8a5a" }}>−${discount.toLocaleString()}</span>
                  </div>
                )}
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>Shipping</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>${shipping}</span>
                </div>
                {isRental && (
                  <div style={rowBetween}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#2A2118" }}>
                      Security deposit ({depositPct}%, refundable)
                    </span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>
                      ${depositDollars.toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{ height: "1px", background: "#E8DDD3", margin: "0.4rem 0" }} />
                <div style={rowBetween}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#1A1A18" }}>
                    Total
                  </span>
                  <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.7rem", color: "#C4440A" }}>
                    ${(subtotalDollars - discount + shipping + (isRental ? depositDollars : 0)).toLocaleString()}
                  </span>
                </div>
                {isRental && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52", marginTop: "0.25rem" }}>
                    Charged in two steps: rental fee + shipping first, then the refundable deposit.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ── RIGHT: Address + Payment ───────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "sticky", top: "6rem" }}>

            {/* Step 1: Shipping address */}
            {stage === "address" && (
              <form onSubmit={handleAddressSubmit} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <section>
                  <p style={sectionTitle}>Shipping address</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={labelStyle}>First name</label>
                        <input required style={inputStyle} value={form.firstName} onChange={setField("firstName")} placeholder="Priya" />
                      </div>
                      <div>
                        <label style={labelStyle}>Last name</label>
                        <input required style={inputStyle} value={form.lastName} onChange={setField("lastName")} placeholder="Sharma" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input required type="email" style={inputStyle} value={form.email} onChange={setField("email")} placeholder="priya@email.com" />
                    </div>
                    <div>
                      <label style={labelStyle}>Address line 1</label>
                      <input required style={inputStyle} value={form.address1} onChange={setField("address1")} placeholder="123 Main Street" />
                    </div>
                    <div>
                      <label style={labelStyle}>Address line 2 <span style={{ opacity: 0.5 }}>(optional)</span></label>
                      <input style={inputStyle} value={form.address2} onChange={setField("address2")} placeholder="Apt 4B" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: "1rem" }}>
                      <div>
                        <label style={labelStyle}>City</label>
                        <input required style={inputStyle} value={form.city} onChange={setField("city")} placeholder="New York" />
                      </div>
                      <div>
                        <label style={labelStyle}>State</label>
                        <input required style={inputStyle} value={form.state} onChange={setField("state")} placeholder="NY" maxLength={2} />
                      </div>
                      <div>
                        <label style={labelStyle}>ZIP</label>
                        <input required style={inputStyle} value={form.zip} onChange={setField("zip")} placeholder="10001" maxLength={10} />
                      </div>
                    </div>
                  </div>
                </section>

                {apiError && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#991B1B" }}>{apiError}</p>
                )}

                <button
                  type="submit" disabled={creating}
                  style={{
                    width: "100%", padding: "1.05rem", border: "none",
                    background: "#C4440A", color: "var(--cream)", cursor: creating ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                    opacity: creating ? 0.6 : 1, transition: "opacity 0.2s",
                  }}
                >
                  {creating ? "Preparing payment…" : "Continue to payment →"}
                </button>

                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "#3D3830", textAlign: "center", marginTop: "-0.5rem" }}>
                  By placing an order you agree to Veeral&apos;s terms and conditions.
                </p>
              </form>
            )}

            {/* Step 2a: Sale payment */}
            {stage === "paying" && saleSecret && (
              <section>
                <p style={sectionTitle}>Payment</p>
                <Elements stripe={stripePromise} options={{ clientSecret: saleSecret, appearance: elementsAppearance }}>
                  <PaymentForm
                    label="Item + shipping"
                    amount={saleCents + shippingCents}
                    buttonLabel={`Pay $${(l.price + shipping).toLocaleString()} — complete order`}
                    onSuccess={() => setStage("done")}
                    onError={setApiError}
                  />
                </Elements>
                {apiError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#991B1B", marginTop: "1rem" }}>{apiError}</p>}
              </section>
            )}

            {/* Step 2b: Rental fee payment */}
            {stage === "paying_rental" && rentalSecret && (
              <section>
                <p style={sectionTitle}>Payment — step 1 of 2</p>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#6B5E52", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  First, pay the rental fee and shipping. Then you&apos;ll be asked for the refundable security deposit separately.
                </p>
                <Elements stripe={stripePromise} options={{ clientSecret: rentalSecret, appearance: elementsAppearance }}>
                  <PaymentForm
                    label="Rental fee + shipping"
                    amount={rentalCents + shippingCents}
                    buttonLabel={`Pay $${(rentalCostDollars + shipping).toLocaleString()} — rental fee`}
                    onSuccess={() => setStage("paying_deposit")}
                    onError={setApiError}
                  />
                </Elements>
                {apiError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#991B1B", marginTop: "1rem" }}>{apiError}</p>}
              </section>
            )}

            {/* Step 2c: Deposit payment */}
            {stage === "paying_deposit" && depositSecret && (
              <section>
                <p style={sectionTitle}>Payment — step 2 of 2</p>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#6B5E52", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  Now pay the refundable security deposit. This is held by Veeral and returned within 3 days of the item being returned in good condition.
                </p>
                <Elements stripe={stripePromise} options={{ clientSecret: depositSecret, appearance: elementsAppearance }}>
                  <PaymentForm
                    label={`Refundable deposit (${depositPct}%)`}
                    amount={depositCents}
                    buttonLabel={`Pay $${depositDollars.toLocaleString()} deposit — confirm rental`}
                    onSuccess={() => setStage("done")}
                    onError={setApiError}
                  />
                </Elements>
                {apiError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#991B1B", marginTop: "1rem" }}>{apiError}</p>}
              </section>
            )}

            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "#3D3830", textAlign: "center" }}>
              🔒 Payments processed securely via Stripe
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
