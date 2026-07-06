"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SHIPPING_CENTS = 1800;

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  } catch { return iso; }
}

interface OrderData {
  id: string;
  type: "sale" | "rent";
  amount: number;
  platform_fee: number;
  deposit_amount: number | null;
  rental_start: string | null;
  rental_end: string | null;
  listing_title: string;
  listing_category: string;
  listing_size: string | null;
  listing_image: string | null;
  seller_username: string;
}

function SuccessContent() {
  const sp        = useSearchParams();
  const orderId   = sp.get("orderId") ?? "";
  const address   = sp.get("address") ?? "Your shipping address";

  const [order, setOrder]     = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    db
      .from("orders")
      .select("id, type, amount, platform_fee, deposit_amount, rental_start, rental_end, listing_id, seller_id")
      .eq("id", orderId)
      .single()
      .then(async ({ data: o }: { data: { id: string; type: string; amount: number; platform_fee: number; deposit_amount: number | null; rental_start: string | null; rental_end: string | null; listing_id: string; seller_id: string } | null }) => {
        if (!o) { setLoading(false); return; }
        const [{ data: listing }, { data: seller }] = await Promise.all([
          db.from("listings").select("title, images, size, category").eq("id", o.listing_id).single(),
          db.from("seller_profiles").select("username").eq("id", o.seller_id).single(),
        ]);
        setOrder({
          id:               o.id,
          type:             o.type as "sale" | "rent",
          amount:           o.amount,
          platform_fee:     o.platform_fee,
          deposit_amount:   o.deposit_amount,
          rental_start:     o.rental_start,
          rental_end:       o.rental_end,
          listing_title:    listing?.title ?? "Your item",
          listing_category: listing?.category ?? "",
          listing_size:     listing?.size ?? null,
          listing_image:    listing?.images?.[0] ?? null,
          seller_username:  seller?.username ?? "",
        });
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", color: "var(--muted)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Loading…</p>
      </div>
    );
  }

  const isRental     = order?.type === "rent";
  const depositCents = order?.deposit_amount ?? 0;
  const totalCents   = (order?.amount ?? 0) + (order?.platform_fee ?? 0) + SHIPPING_CENTS + (isRental ? depositCents : 0);
  const returnDate   = order?.rental_end ?? "";
  const shortId      = order ? `VR-${order.id.slice(0, 6).toUpperCase()}` : "VR-??????";

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 1.5rem 5rem" }}>
      <div style={{ width: "100%", maxWidth: "500px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic", fontSize: "2rem", letterSpacing: "-0.02em", color: "#C4440A", textDecoration: "none" }}>
            veeral
          </Link>
        </div>

        {/* Checkmark */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(196,68,10,0.08)", border: "1.5px solid #C4440A", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", color: "#C4440A" }}>
            ✓
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1A1A18", letterSpacing: "0.02em", lineHeight: 1.2 }}>
            Your order is confirmed!
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", letterSpacing: "0.06em", color: "#3D3830", textAlign: "center", marginBottom: "2.5rem" }}>
          Order <strong style={{ color: "#1A1A18", fontWeight: 500 }}>#{shortId}</strong>
        </p>

        <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "2rem" }} />

        {/* Item summary */}
        <section style={{ marginBottom: "1.8rem" }}>
          <p style={labelStyle}>Item</p>
          <div style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start" }}>
            <div style={{ width: "72px", aspectRatio: "3/4", background: order?.listing_image ? "transparent" : "#DDD0C5", flexShrink: 0, overflow: "hidden" }}>
              {order?.listing_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.listing_image} alt={order.listing_title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18", lineHeight: 1.4, marginBottom: "0.3rem" }}>
                {order?.listing_title ?? "Your item"}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#2A2118", marginBottom: "0.2rem" }}>
                {order?.listing_category}{order?.listing_size ? ` · ${order.listing_size}` : ""}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#3D3830", marginBottom: "0.5rem" }}>
                @{order?.seller_username}
              </p>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: isRental ? "#1A1A18" : "#C4440A", border: `1px solid ${isRental ? "#E8DDD3" : "#C4440A"}`, padding: "0.22rem 0.6rem" }}>
                {isRental ? "Rental" : "Purchase"}
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.2rem", color: "#C4440A", flexShrink: 0 }}>
              {fmt(totalCents)}
            </p>
          </div>
        </section>

        {/* Price breakdown */}
        {order && (
          <section style={{ marginBottom: "1.8rem", padding: "1rem 1.25rem", background: "#F9F6F2", border: "1px solid #E8DDD3" }}>
            <p style={labelStyle}>Price breakdown</p>
            {[
              { label: isRental ? "Rental fee" : "Item price", cents: order.amount },
              { label: "Veeral fee",                           cents: order.platform_fee },
              { label: "Shipping",                             cents: SHIPPING_CENTS },
              ...(isRental && depositCents > 0
                ? [{ label: "Security deposit (refundable)", cents: depositCents }]
                : []),
            ].map(({ label, cents }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "var(--muted)", opacity: 0.75 }}>{label}</span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#1A1A18" }}>{fmt(cents)}</span>
              </div>
            ))}
            <div style={{ height: "1px", background: "#E8DDD3", margin: "0.5rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18" }}>Total</span>
              <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1rem", color: "#C4440A" }}>{fmt(totalCents)}</span>
            </div>
          </section>
        )}

        {/* Return reminder — rental only */}
        {isRental && returnDate && (
          <div style={{ background: "rgba(196,68,10,0.06)", border: "1px solid rgba(196,68,10,0.25)", padding: "1.1rem 1.3rem", marginBottom: "1.8rem" }}>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.5rem" }}>
              ✦ Return reminder
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#C4440A", marginBottom: "0.3rem" }}>
              Ship back by {fmtDate(returnDate)}
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#2A2118", lineHeight: 1.7 }}>
              Drop off with the carrier by this date — late fees are based on the postmark, not delivery date.
              You&apos;ll receive return instructions before your ship-back date.
              Your {fmt(depositCents)} deposit is refunded within 5 business days after the seller confirms receipt.
            </p>
          </div>
        )}

        {/* Shipping address */}
        <section style={{ marginBottom: "1.8rem" }}>
          <p style={labelStyle}>Shipping to</p>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.7 }}>
            {address}
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", color: "#3D3830", marginTop: "0.3rem" }}>
            Estimated delivery: 3–5 business days after dispatch
          </p>
        </section>

        <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "1.8rem" }} />

        {/* What happens next */}
        <section style={{ marginBottom: "2.5rem" }}>
          <p style={labelStyle}>What happens next</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {[
              "The seller ships your item within 2–3 business days",
              "You'll receive a tracking number by email once dispatched",
              isRental && returnDate
                ? `Return the item to the seller — drop off with a carrier by ${fmtDate(returnDate)} (postmark counts, not delivery date)`
                : "Leave a review once your item arrives to help other buyers",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, background: "#C4440A", color: "var(--cream)", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <Link
            href={orderId ? `/account/orders/${orderId}` : "/account/orders"}
            style={{ flex: 1, padding: "0.95rem", textAlign: "center", background: "#C4440A", textDecoration: "none", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cream)", display: "block" }}
          >
            View order
          </Link>
          <Link
            href="/listings"
            style={{ flex: 1, padding: "0.95rem", textAlign: "center", border: "1px solid #E8DDD3", textDecoration: "none", fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#2A2118", display: "block" }}
          >
            Continue shopping
          </Link>
        </div>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
  color: "#2A2118", marginBottom: "0.6rem",
};

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
