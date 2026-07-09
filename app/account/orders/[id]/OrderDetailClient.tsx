"use client";

import { useState } from "react";
import Link from "next/link";
import MessageButton from "@/components/messages/MessageButton";
import { BUYER_DETAIL_STATUS } from "@/lib/orderStatus";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  type: "sale" | "rent";
  status: string;
  amount: number;
  platform_fee: number;
  seller_payout: number;
  deposit_amount: number | null;
  deposit_held: boolean;
  deposit_release_amount: number | null;
  deposit_release_reason: string | null;
  deposit_released_at: string | null;
  rental_start: string | null;
  rental_end: string | null;
  return_tracking_number: string | null;
  return_noted_at: string | null;
  paid_at: string | null;
  created_at: string;
  listing_id: string;
  seller_id: string;
}

interface Listing {
  id: string;
  title: string;
  images: string[];
  size: string | null;
  category: string;
  brand: string | null;
}

interface Seller {
  id: string;
  display_name: string | null;
  username: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SHIPPING_CENTS = 1800;

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}


// Steps shown on the timeline. "current" = highlighted, "done" = completed.
function getTimelineSteps(status: string, isRental: boolean) {
  const saleSteps    = ["pending", "paid", "shipped", "delivered"];
  const rentalSteps  = ["pending", "paid", "shipped", "delivered", "return_pending", "deposit_released"];
  const steps = isRental ? rentalSteps : saleSteps;

  const currentIdx = steps.indexOf(status);
  return steps.map((s, i) => ({
    key:     s,
    label:   BUYER_DETAIL_STATUS[s]?.label ?? s,
    done:    i < currentIdx,
    current: i === currentIdx,
  }));
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderDetailClient({
  order,
  listing,
  seller,
}: {
  order: Order;
  listing: Listing | null;
  seller: Seller | null;
}) {
  const [reviewOpen, setReviewOpen]   = useState(false);
  const [rating, setRating]           = useState(5);
  const [reviewText, setReviewText]   = useState("");
  const [reviewed, setReviewed]       = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const shortId       = `VR-${order.id.slice(0, 6).toUpperCase()}`;
  const isRental      = order.type === "rent";
  const depositCents  = order.deposit_amount ?? 0;
  const totalCents    = order.amount + order.platform_fee + SHIPPING_CENTS + (isRental ? depositCents : 0);
  const canReview     = (order.status === "delivered") && !reviewed;
  const statusStyle   = BUYER_DETAIL_STATUS[order.status] ?? { bg: "#F5F5F5", text: "#555" };
  const timelineSteps = getTimelineSteps(order.status, isRental);
  const thumbnail     = listing?.images?.[0] ?? null;
  const sellerName    = seller?.display_name ?? `@${seller?.username ?? "seller"}`;

  async function submitReview() {
    setSubmitting(true);
    setReviewError(null);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ order_id: order.id, rating, comment: reviewText }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setReviewError(error ?? "Something went wrong.");
        return;
      }
      setReviewed(true);
      setReviewOpen(false);
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px" }}>

      {/* Back link */}
      <Link
        href={isRental ? "/account/rentals" : "/account/orders"}
        style={{
          fontFamily: "var(--font-jost)", fontSize: "0.72rem", fontWeight: 500,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--muted)", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          marginBottom: "2rem", opacity: 0.65,
        }}
      >
        ← {isRental ? "Rentals" : "Orders"}
      </Link>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.4rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", lineHeight: 1.1,
        }}>
          Order #{shortId}
        </h1>
        <span style={{
          padding: "0.25rem 0.75rem",
          background: statusStyle.bg, color: statusStyle.text,
          fontFamily: "var(--font-jost)", fontWeight: 700,
          fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase",
          alignSelf: "center",
        }}>
          {BUYER_DETAIL_STATUS[order.status]?.label ?? order.status}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.6, marginBottom: "2rem" }}>
        Placed {fmtDate(order.created_at)}
        {order.paid_at && ` · Paid ${fmtDate(order.paid_at)}`}
      </p>

      <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "2rem" }} />

      {/* Item */}
      <section style={{ marginBottom: "2rem" }}>
        <p style={labelStyle}>Item</p>
        <div style={{ display: "flex", gap: "1.1rem", alignItems: "flex-start" }}>
          <div style={{
            width: "80px", aspectRatio: "3/4", flexShrink: 0,
            background: thumbnail ? "transparent" : "#DDD0C5",
            overflow: "hidden",
          }}>
            {thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail} alt={listing?.title ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.9rem", color: "#1A1A18", lineHeight: 1.4, marginBottom: "0.3rem" }}>
              {listing?.title ?? "Item"}
            </p>
            {listing && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "var(--muted)", opacity: 0.7, marginBottom: "0.3rem" }}>
                {listing.category}{listing.size ? ` · ${listing.size}` : ""}{listing.brand ? ` · ${listing.brand}` : ""}
              </p>
            )}
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
              {sellerName}
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
        </div>
      </section>

      {/* Rental period */}
      {isRental && order.rental_start && order.rental_end && (
        <section style={{ marginBottom: "2rem", padding: "1rem 1.25rem", background: "rgba(196,68,10,0.04)", border: "1px solid rgba(196,68,10,0.15)" }}>
          <p style={labelStyle}>Rental period</p>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
            {fmtDateShort(order.rental_start)} – {fmtDateShort(order.rental_end)}
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
            Ship back by{" "}
            <strong style={{ color: "#C4440A" }}>{fmtDateShort(order.rental_end)}</strong>
            {" "}
            <span
              title="Drop off with the carrier by this date. Late fees apply if you ship after this date — based on postmark, not delivery date."
              style={{ cursor: "help", borderBottom: "1px dotted currentColor", fontSize: "0.72rem" }}
            >
              ⓘ
            </span>
          </p>
        </section>
      )}

      {/* Price breakdown */}
      <section style={{ marginBottom: "2rem" }}>
        <p style={labelStyle}>Price breakdown</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { label: isRental ? "Rental fee" : "Item price", cents: order.amount },
            { label: "Veeral fee",                           cents: order.platform_fee },
            { label: "Shipping",                             cents: SHIPPING_CENTS },
            ...(isRental && depositCents > 0
              ? [{ label: "Security deposit (refundable)", cents: depositCents }]
              : []),
          ].map(({ label, cents }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.75 }}>{label}</span>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#1A1A18", fontWeight: 500 }}>{fmt(cents)}</span>
            </div>
          ))}
          <div style={{ height: "1px", background: "#E8DDD3", margin: "0.25rem 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>Total charged</span>
            <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600, fontSize: "1.1rem", color: "#C4440A" }}>{fmt(totalCents)}</span>
          </div>
        </div>
      </section>

      {/* Deposit status (rental) */}
      {isRental && depositCents > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <p style={labelStyle}>Deposit status</p>
          {order.deposit_released_at ? (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#065F46" }}>
              ✓ {fmt(order.deposit_release_amount ?? depositCents)} released
              {order.deposit_release_reason ? ` — ${order.deposit_release_reason}` : ""}
              {" "}on {fmtDateShort(order.deposit_released_at)}.
            </p>
          ) : order.deposit_held ? (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#92400E" }}>
              {fmt(depositCents)} held — will be refunded within 5 business days after the seller confirms your return.
            </p>
          ) : (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.65 }}>
              Awaiting payment confirmation.
            </p>
          )}
        </section>
      )}

      {/* Return tracking */}
      {isRental && order.return_tracking_number && (
        <section style={{ marginBottom: "2rem" }}>
          <p style={labelStyle}>Return tracking</p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#1A1A18" }}>
            {order.return_tracking_number}
            {order.return_noted_at && (
              <span style={{ color: "var(--muted)", opacity: 0.6 }}> · Marked returned {fmtDateShort(order.return_noted_at)}</span>
            )}
          </p>
        </section>
      )}

      {/* Status timeline */}
      <section style={{ marginBottom: "2rem" }}>
        <p style={labelStyle}>Order status</p>
        <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", rowGap: "0.75rem" }}>
          {timelineSteps.map((step, i) => (
            <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                <div style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: step.done || step.current ? "#C4440A" : "#E8DDD3",
                  border: step.current ? "2px solid #C4440A" : "none",
                  outline: step.current ? "3px solid rgba(196,68,10,0.2)" : "none",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: step.done || step.current ? "#1A1A18" : "var(--muted)",
                  fontWeight: step.current ? 700 : 500,
                  opacity: step.done || step.current ? 1 : 0.4,
                  whiteSpace: "nowrap",
                }}>
                  {step.label}
                </span>
              </div>
              {i < timelineSteps.length - 1 && (
                <div style={{
                  width: "32px", height: "1px", flexShrink: 0, marginBottom: "1.1rem",
                  background: step.done ? "#C4440A" : "#E8DDD3",
                }} />
              )}
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: "1px", background: "#E8DDD3", marginBottom: "2rem" }} />

      {/* Actions */}
      <section style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <Link
          href={`/listings/${order.listing_id}`}
          style={outlineBtn}
        >
          View listing
        </Link>

        {seller?.id && (
          <MessageButton
            recipientId={seller.id}
            listingId={order.listing_id}
            orderId={order.id}
            label="Message seller"
            style={{ fontSize: "0.75rem", padding: "0.45rem 1rem", letterSpacing: "0.14em" }}
          />
        )}

        {canReview && (
          <button onClick={() => setReviewOpen(true)} style={primaryBtn}>
            Leave a review
          </button>
        )}

        {reviewed && (
          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#2D6A4F", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            ✓ Review submitted
          </span>
        )}
      </section>

      {/* Review drawer */}
      {reviewOpen && (
        <>
          <div
            onClick={() => setReviewOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--cream)", zIndex: 70,
            padding: "2rem", borderTop: "1px solid var(--warm-tan)",
            maxWidth: "520px", margin: "0 auto",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
              Leave a review
            </h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.65, marginBottom: "1.75rem" }}>
              {listing?.title ?? "Your item"} · {sellerName}
            </p>

            <p style={drawerLabelStyle}>Rating</p>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.6rem", color: n <= rating ? "#C4440A" : "var(--warm-tan)", padding: 0, lineHeight: 1 }}
                >
                  ★
                </button>
              ))}
            </div>

            <p style={drawerLabelStyle}>Your review</p>
            <textarea
              placeholder="How was the item? Was it as described? How was the seller to work with?"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--warm-tan)", background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "1.5rem" }}
            />

            {reviewError && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{reviewError}</p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={submitReview}
                disabled={!reviewText.trim() || submitting}
                style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", background: reviewText.trim() && !submitting ? "var(--burnt-orange)" : "var(--warm-tan)", color: reviewText.trim() && !submitting ? "var(--cream)" : "var(--muted)", border: "none", cursor: reviewText.trim() && !submitting ? "pointer" : "not-allowed" }}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
              <button
                onClick={() => setReviewOpen(false)}
                style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared style objects ──────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 500,
  fontSize: "0.78rem", letterSpacing: "0.22em", textTransform: "uppercase",
  color: "#2A2118", marginBottom: "0.75rem",
};

const drawerLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase",
  color: "var(--muted)", marginBottom: "0.5rem",
};

const outlineBtn: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase",
  padding: "0.45rem 1rem",
  background: "transparent", color: "var(--muted)",
  border: "1px solid var(--warm-tan)", textDecoration: "none",
  display: "inline-block",
};

const primaryBtn: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase",
  padding: "0.45rem 1rem",
  background: "var(--burnt-orange)", color: "var(--cream)",
  border: "none", cursor: "pointer",
};
