"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
  } catch { return iso; }
}

function fmt(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// Placeholder — in production pull real order from Supabase
const ORDER = {
  number: "VR-2847",
  title: "Red Bridal Lehenga with Gold Embroidery",
  category: "Lehenga",
  us_size: "6",
  seller: "priya_sharma",
  bg: "#DDD0C5",
  price: 4500,
  rent_price: 120,
  deposit: 1800,
};

function SuccessContent() {
  const sp         = useSearchParams();
  const isRental   = sp.get("isRental") === "true";
  const days       = Number(sp.get("days") || 0);
  const returnDate = sp.get("returnDate") || "";
  const address    = sp.get("address") || "Your shipping address";

  const o = ORDER;
  const rentalCost = o.rent_price * days;
  const shipping   = 18;
  const subtotal   = isRental ? rentalCost : o.price;
  const total      = subtotal + shipping + (isRental ? o.deposit : 0);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 1.5rem 5rem" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{
            fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic",
            fontSize: "2rem", letterSpacing: "-0.02em", color: "#C4440A", textDecoration: "none"
          }}>
            veeral
          </Link>
        </div>

        {/* Checkmark */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(196,68,10,0.08)", border: "1.5px solid #C4440A",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", color: "#C4440A"
          }}>
            ✓
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <h1 style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1A1A18",
            letterSpacing: "0.02em", lineHeight: 1.2
          }}>
            Your order is confirmed!
          </h1>
        </div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.88rem", letterSpacing: "0.06em", color: "#3D3830",
          textAlign: "center", marginBottom: "2.5rem"
        }}>
          Order <strong style={{ color: "#1A1A18", fontWeight: 500 }}>#{o.number}</strong>
        </p>

        {/* Divider */}
        <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "2rem" }} />

        {/* Item summary */}
        <section style={{ marginBottom: "1.8rem" }}>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#2A2118", marginBottom: "0.9rem"
          }}>
            Item
          </p>
          <div style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start" }}>
            <div style={{ width: "72px", aspectRatio: "3/4", background: o.bg, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18", lineHeight: 1.4, marginBottom: "0.3rem" }}>
                {o.title}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#2A2118", marginBottom: "0.2rem" }}>
                {o.category} · US Size {o.us_size}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#3D3830", marginBottom: "0.5rem" }}>
                @{o.seller}
              </p>
              <span style={{
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                color: isRental ? "#1A1A18" : "#C4440A",
                border: `1px solid ${isRental ? "#E8DDD3" : "#C4440A"}`,
                padding: "0.22rem 0.6rem"
              }}>
                {isRental ? `Rental · ${days} days` : "Purchase"}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.2rem", color: "#C4440A", flexShrink: 0 }}>
              {fmt(total)}
            </p>
          </div>
        </section>

        {/* Return reminder — rental only */}
        {isRental && returnDate && (
          <div style={{
            background: "rgba(196,68,10,0.06)", border: "1px solid rgba(196,68,10,0.25)",
            padding: "1.1rem 1.3rem", marginBottom: "1.8rem",
          }}>
            <p style={{
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
              color: "#C4440A", marginBottom: "0.5rem"
            }}>
              ✦ Return reminder
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#C4440A", marginBottom: "0.3rem" }}>
              Return by {fmtDate(returnDate)} to avoid late fees
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#2A2118", lineHeight: 1.7 }}>
              A prepaid return label will be emailed to you 2 days before your return date.
              Your {fmt(o.deposit)} deposit is refunded within 3 business days of the seller receiving the item.
            </p>
          </div>
        )}

        {/* Shipping address */}
        <section style={{ marginBottom: "1.8rem" }}>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#2A2118", marginBottom: "0.6rem"
          }}>
            Shipping to
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.7 }}>
            {address}
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#3D3830", marginTop: "0.3rem" }}>
            Estimated delivery: 3–5 business days after dispatch
          </p>
        </section>

        {/* Divider */}
        <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "1.8rem" }} />

        {/* What happens next */}
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#2A2118", marginBottom: "0.9rem"
          }}>
            What happens next
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {[
              "The seller ships your item within 2–3 business days",
              "You'll receive a tracking number by email once dispatched",
              isRental
                ? `Return the item using the prepaid label we'll email you before ${fmtDate(returnDate)}`
                : "Leave a review once your item arrives to help other buyers",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{
                  width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                  background: "#C4440A", color: "var(--cream)",
                  fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {i + 1}
                </span>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.76rem", color: "#1A1A18", lineHeight: 1.6, paddingTop: "0.1rem" }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/dashboard" style={{
            flex: 1, padding: "0.95rem", textAlign: "center",
            background: "#C4440A", textDecoration: "none",
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--cream)", display: "block", transition: "opacity 0.2s"
          }}
            onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = "1")}
          >
            View order
          </Link>
          <Link href="/listings" style={{
            flex: 1, padding: "0.95rem", textAlign: "center",
            border: "1px solid #E8DDD3", textDecoration: "none",
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#2A2118", display: "block", transition: "background 0.2s"
          }}
            onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "#EDE8E2")}
            onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.background = "transparent")}
          >
            Continue shopping
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", color: "var(--muted)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Loading…</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
