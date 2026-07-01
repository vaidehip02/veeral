"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MessageButton from "@/components/messages/MessageButton";

// ── Types ─────────────────────────────────────────────────────────────────────

type DBStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

interface BuyerOrder {
  id: string;
  listing_id: string;
  seller_id: string;
  amount: number;       // cents
  platform_fee: number; // cents
  status: DBStatus;
  created_at: string;
  title: string;
  images: string[];
  size: string | null;
  category: string;
  seller_username: string;
  tracking?: string;
}

const STATUS_CONFIG: Record<DBStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: "Processing", bg: "#F5F5F5",  text: "#555"     },
  paid:      { label: "Processing", bg: "#F5F5F5",  text: "#555"     },
  shipped:   { label: "Shipped",    bg: "#EEF2FF",  text: "#3730A3"  },
  delivered: { label: "Delivered",  bg: "#E8F5E9",  text: "#2D6A4F"  },
  cancelled: { label: "Cancelled",  bg: "#FEE2E2",  text: "#991B1B"  },
  refunded:  { label: "Refunded",   bg: "#EDE9FE",  text: "#5B21B6"  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Review drawer state ───────────────────────────────────────────────────────

interface ReviewDrawer {
  orderId: string;
  title: string;
  sellerUsername: string;
  rating: number;
  text: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuyerOrdersPage() {
  const [orders, setOrders]           = useState<BuyerOrder[]>([]);
  const [loading, setLoading]         = useState(true);
  const [reviewDrawer, setReviewDrawer] = useState<ReviewDrawer | null>(null);
  const [submitted, setSubmitted]     = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rawOrders } = await supabase
        .from("orders")
        .select("id, listing_id, seller_id, amount, platform_fee, status, created_at, return_tracking_number")
        .eq("buyer_id", user.id)
        .eq("type", "sale")
        .order("created_at", { ascending: false });

      if (!rawOrders?.length) { setLoading(false); return; }

      const listingIds = Array.from(new Set(rawOrders.map((o) => o.listing_id)));
      const sellerIds  = Array.from(new Set(rawOrders.map((o) => o.seller_id)));

      const [{ data: listings }, { data: sellers }] = await Promise.all([
        supabase.from("listings").select("id, title, images, size, category").in("id", listingIds),
        supabase.from("seller_profiles").select("id, username").in("id", sellerIds),
      ]);

      const merged: BuyerOrder[] = rawOrders.map((o) => {
        const l = listings?.find((x) => x.id === o.listing_id);
        const s = sellers?.find((x) => x.id === o.seller_id);
        return {
          id:               o.id,
          listing_id:       o.listing_id,
          seller_id:        o.seller_id,
          amount:           o.amount,
          platform_fee:     o.platform_fee,
          status:           o.status as DBStatus,
          created_at:       o.created_at,
          title:            l?.title ?? "Item",
          images:           l?.images ?? [],
          size:             l?.size ?? null,
          category:         l?.category ?? "",
          seller_username:  s?.username ?? "",
          tracking:         o.return_tracking_number ?? undefined,
        };
      });

      setOrders(merged);
      setLoading(false);
    });
  }, []);

  const submitReview = async () => {
    if (!reviewDrawer) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ order_id: reviewDrawer.orderId, rating: reviewDrawer.rating, comment: reviewDrawer.text }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSubmitError(error ?? "Something went wrong.");
        return;
      }
      setSubmitted((prev) => new Set(Array.from(prev).concat(reviewDrawer.orderId)));
      setReviewDrawer(null);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded").length;

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Orders
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : `${activeCount} active order${activeCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          No orders yet.{" "}
          <Link href="/listings" style={{ color: "#C4440A", textDecoration: "underline" }}>Browse listings</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
          {orders.map((order) => {
            const cfg       = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const canReview = order.status === "delivered" && !submitted.has(order.id);
            const reviewed  = submitted.has(order.id);
            const thumbnail = order.images[0] ?? null;
            const total     = (order.amount + order.platform_fee + 1800) / 100;

            return (
              <div key={order.id} style={{ background: "var(--cream)", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>

                  {/* Thumbnail */}
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                    {thumbnail && <img src={thumbnail} alt={order.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>
                        {order.title}
                      </p>
                      <span style={{ padding: "0.2rem 0.6rem", background: cfg.bg, color: cfg.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                      {[
                        { k: "Seller", v: `@${order.seller_username}` },
                        { k: "Size",   v: order.size ?? "—" },
                        { k: "Date",   v: fmtDate(order.created_at) },
                        { k: "Total",  v: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
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
                        <a href={`https://www.ups.com/track?tracknum=${order.tracking}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--burnt-orange)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                          Track package ↗
                        </a>
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                      <Link
                        href={`/account/orders/${order.id}`}
                        style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}
                      >
                        View order
                      </Link>
                      <Link
                        href={`/listings/${order.listing_id}`}
                        style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}
                      >
                        View listing
                      </Link>
                      {order.seller_id && (
                        <MessageButton
                          recipientId={order.seller_id}
                          listingId={order.listing_id}
                          orderId={order.id}
                          label="Message seller"
                          style={{ fontSize: "0.6rem", padding: "0.4rem 0.9rem" }}
                        />
                      )}
                      {canReview && (
                        <button
                          onClick={() => setReviewDrawer({ orderId: order.id, title: order.title, sellerUsername: order.seller_username, rating: 5, text: "" })}
                          style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}
                        >
                          Leave a review
                        </button>
                      )}
                      {reviewed && (
                        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "#2D6A4F", display: "flex", alignItems: "center", gap: "0.3rem" }}>
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
      )}

      {/* Review drawer */}
      {reviewDrawer && (
        <>
          <div onClick={() => setReviewDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
              Leave a review
            </h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.65, marginBottom: "1.75rem" }}>
              {reviewDrawer.title} · @{reviewDrawer.sellerUsername}
            </p>

            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.6rem" }}>Rating</p>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReviewDrawer({ ...reviewDrawer, rating: n })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.6rem", color: n <= reviewDrawer.rating ? "#C4440A" : "var(--warm-tan)", padding: 0, lineHeight: 1 }}>★</button>
              ))}
            </div>

            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>Your review</p>
            <textarea
              placeholder="How was the item? Was it as described? How was the seller to work with?"
              value={reviewDrawer.text}
              onChange={e => setReviewDrawer({ ...reviewDrawer, text: e.target.value })}
              rows={4}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--warm-tan)", background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "1.5rem" }}
            />

            {submitError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{submitError}</p>}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={submitReview} disabled={!reviewDrawer.text.trim() || submitting} style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", background: reviewDrawer.text.trim() && !submitting ? "var(--burnt-orange)" : "var(--warm-tan)", color: reviewDrawer.text.trim() && !submitting ? "var(--cream)" : "var(--muted)", border: "none", cursor: reviewDrawer.text.trim() && !submitting ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting…" : "Submit review"}
              </button>
              <button onClick={() => setReviewDrawer(null)} style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
