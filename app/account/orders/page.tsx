"use client";

import { useState } from "react";
import Link from "next/link";

type OrderStatus = "processing" | "shipped" | "delivered" | "completed";

interface BuyerOrder {
  id: string;
  item: string;
  seller: string;
  size: string;
  date: string;
  total: number;
  status: OrderStatus;
  tracking?: string;
  carrier?: string;
  bg: string;
}

const MOCK_ORDERS: BuyerOrder[] = [
  { id:"1043", item:"Red Bridal Lehenga with Gold Embroidery", seller:"priya_sharma",  size:"US 6",      date:"Jun 9, 2026",  total:4500, status:"processing", bg:"#D4C5B5" },
  { id:"1042", item:"Zardozi Saree — Ivory & Gold",            seller:"priya_sharma",  size:"Free size", date:"Jun 7, 2026",  total:980,  status:"shipped",    tracking:"1Z999AA10123456784", carrier:"UPS", bg:"#E8DDD3" },
  { id:"1038", item:"Silk Sharara Set — Sage Green",           seller:"meera_b",       size:"US 10",     date:"May 28, 2026", total:540,  status:"delivered",  bg:"#CFC0AF" },
  { id:"1035", item:"Pink Anarkali Kurta Set",                 seller:"ananya_m",      size:"US 8",      date:"May 20, 2026", total:320,  status:"completed",  bg:"#DDD0C5" },
  { id:"1030", item:"Blue Banarasi Silk Saree",                seller:"priya_sharma",  size:"Free size", date:"May 5, 2026",  total:1200, status:"completed",  bg:"#C3B5A8" },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  processing: { label:"Processing",  bg:"#F5F5F5",  text:"#555"    },
  shipped:    { label:"Shipped",     bg:"#E3F2FD",  text:"#1D4E89" },
  delivered:  { label:"Delivered",   bg:"#E8F5E9",  text:"#2D6A4F" },
  completed:  { label:"Completed",   bg:"#FFF3E0",  text:"#C4440A" },
};

interface ReviewDrawer {
  orderId: string;
  item: string;
  seller: string;
  rating: number;
  text: string;
}

export default function BuyerOrdersPage() {
  const [reviewDrawer, setReviewDrawer] = useState<ReviewDrawer | null>(null);
  const [submitted, setSubmitted]       = useState<Set<string>>(new Set());

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!reviewDrawer) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: reviewDrawer.orderId,
          rating:   reviewDrawer.rating,
          comment:  reviewDrawer.text,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSubmitError(error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(prev => new Set(Array.from(prev).concat(reviewDrawer.orderId)));
      setReviewDrawer(null);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem",
        }}>
          Orders
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {MOCK_ORDERS.filter(o => o.status !== "completed").length} active order{MOCK_ORDERS.filter(o => o.status !== "completed").length !== 1 ? "s" : ""}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
        {MOCK_ORDERS.map((order) => {
          const cfg = STATUS_CONFIG[order.status];
          const canReview = (order.status === "delivered" || order.status === "completed") && !submitted.has(order.id);
          const reviewed  = submitted.has(order.id);

          return (
            <div key={order.id} style={{ background: "var(--cream)", padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>

                {/* Thumbnail */}
                <div style={{
                  width: "64px", height: "64px", flexShrink: 0,
                  background: order.bg, borderRadius: "2px",
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                    <p style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3,
                    }}>
                      {order.item}
                    </p>
                    <span style={{
                      padding: "0.2rem 0.6rem", background: cfg.bg, color: cfg.text,
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase",
                      flexShrink: 0,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                    {[
                      { k:"Seller", v:`@${order.seller}` },
                      { k:"Size",   v:order.size },
                      { k:"Date",   v:order.date },
                      { k:"Total",  v:`$${order.total.toLocaleString()}` },
                    ].map(({ k, v }) => (
                      <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.7 }}>
                        <span style={{ fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>
                        {v}
                      </span>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.tracking && (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                      <span style={{ opacity: 0.55 }}>{order.carrier} · </span>
                      <a
                        href={`https://www.ups.com/track?tracknum=${order.tracking}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--burnt-orange)", textDecoration: "underline", textUnderlineOffset: "2px" }}
                      >
                        Track package ↗
                      </a>
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/listings/${order.id}`}
                      style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "0.4rem 0.9rem",
                        background: "transparent", color: "var(--muted)",
                        border: "1px solid var(--warm-tan)", textDecoration: "none",
                        transition: "border-color 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
                      onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
                    >
                      View listing
                    </Link>
                    {canReview && (
                      <button
                        onClick={() => setReviewDrawer({ orderId: order.id, item: order.item, seller: order.seller, rating: 5, text: "" })}
                        style={{
                          fontFamily: "var(--font-jost)", fontWeight: 600,
                          fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                          padding: "0.4rem 0.9rem",
                          background: "var(--burnt-orange)", color: "var(--cream)",
                          border: "none", cursor: "pointer", transition: "opacity 0.15s",
                        }}
                        onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                      >
                        Leave a review
                      </button>
                    )}
                    {reviewed && (
                      <span style={{
                        fontFamily: "var(--font-jost)", fontSize: "0.65rem",
                        color: "#2D6A4F", display: "flex", alignItems: "center", gap: "0.3rem",
                      }}>
                        ✓ Review submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review drawer */}
      {reviewDrawer && (
        <>
          <div onClick={() => setReviewDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--cream)", zIndex: 70,
            padding: "2rem", borderTop: "1px solid var(--warm-tan)",
            maxWidth: "520px", margin: "0 auto",
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.25rem",
            }}>
              Leave a review
            </h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.65, marginBottom: "1.75rem" }}>
              {reviewDrawer.item} · @{reviewDrawer.seller}
            </p>

            {/* Star rating */}
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.6rem" }}>
              Rating
            </p>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setReviewDrawer({ ...reviewDrawer, rating: n })}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "1.6rem", color: n <= reviewDrawer.rating ? "#C4440A" : "var(--warm-tan)",
                    padding: "0", lineHeight: 1, transition: "color 0.1s",
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Review text */}
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>
              Your review
            </p>
            <textarea
              placeholder="How was the item? Was it as described? How was the seller to work with?"
              value={reviewDrawer.text}
              onChange={e => setReviewDrawer({ ...reviewDrawer, text: e.target.value })}
              rows={4}
              style={{
                width: "100%", padding: "0.75rem",
                border: "1px solid var(--warm-tan)", background: "#fff",
                fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18",
                outline: "none", resize: "vertical", boxSizing: "border-box",
                marginBottom: "1.5rem",
              }}
            />

            {submitError && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>
                {submitError}
              </p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={submitReview}
                disabled={!reviewDrawer.text.trim() || submitting}
                style={{
                  flex: 1, padding: "0.75rem",
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase",
                  background: reviewDrawer.text.trim() && !submitting ? "var(--burnt-orange)" : "var(--warm-tan)",
                  color: reviewDrawer.text.trim() && !submitting ? "var(--cream)" : "var(--muted)",
                  border: "none", cursor: reviewDrawer.text.trim() && !submitting ? "pointer" : "not-allowed",
                }}
              >
                {submitting ? "Submitting…" : "Submit review"}
              </button>
              <button
                onClick={() => setReviewDrawer(null)}
                style={{
                  padding: "0.75rem 1.25rem",
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  background: "transparent", color: "var(--muted)",
                  border: "1px solid var(--warm-tan)", cursor: "pointer",
                }}
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
