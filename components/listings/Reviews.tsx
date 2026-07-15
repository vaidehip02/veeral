"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { username: string | null; display_name: string | null } | null;
}

interface ReviewsProps {
  listingId: string;
  currentUserId: string | null;
}

function Stars({ rating, interactive = false, onSelect, onHover }: {
  rating: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
  onHover?: (r: number) => void;
}) {
  return (
    <span style={{ display: "inline-flex", gap: "0.1rem" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={() => interactive && onSelect?.(s)}
          onMouseEnter={() => interactive && onHover?.(s)}
          onMouseLeave={() => interactive && onHover?.(0)}
          style={{
            fontSize: interactive ? "1.6rem" : "0.85rem",
            color: s <= rating ? "#C4440A" : "#C8C2BB",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.1s",
            userSelect: "none",
          }}
        >★</span>
      ))}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Reviews({ listingId, currentUserId }: ReviewsProps) {
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [loading, setLoading]         = useState(true);
  const [canReview, setCanReview]     = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [showForm, setShowForm]       = useState(false);
  const [rating, setRating]           = useState(5);
  const [hovered, setHovered]         = useState(0);
  const [comment, setComment]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // Get order IDs for this listing (reviews are keyed by order, not listing)
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("listing_id", listingId);

      const orderIds = (orders ?? []).map(o => o.id);

      if (orderIds.length > 0) {
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("id, rating, comment, created_at, reviewer_id")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false });

        const rows = reviewData ?? [];

        // Batch-fetch reviewer display names from seller_profiles
        const reviewerIds = [...new Set(rows.map(r => r.reviewer_id).filter(Boolean))];
        let profileMap: Record<string, { username: string | null; display_name: string | null }> = {};
        if (reviewerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("seller_profiles")
            .select("id, username, display_name")
            .in("id", reviewerIds);
          profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
        }

        setReviews(rows.map(r => ({
          ...r,
          reviewer: profileMap[r.reviewer_id] ?? null,
        })));
      }

      // Check if logged-in buyer can review
      if (currentUserId) {
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("listing_id", listingId)
          .eq("buyer_id", currentUserId)
          .in("status", ["delivered", "completed"])
          .maybeSingle();

        if (order) {
          setEligibleOrderId(order.id);
          const { data: existing } = await supabase
            .from("reviews")
            .select("id")
            .eq("order_id", order.id)
            .eq("reviewer_id", currentUserId)
            .maybeSingle();
          setAlreadyReviewed(!!existing);
          setCanReview(!existing);
        }
      }

      setLoading(false);
    }

    load();
  }, [listingId, currentUserId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eligibleOrderId) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id:      eligibleOrderId,
        rating,
        comment,
        reviewer_role: "buyer",
      }),
    });

    if (res.ok) {
      setSubmitted(true);
      setShowForm(false);
      setCanReview(false);
      // Optimistically add to list
      setReviews(prev => [{
        id: Math.random().toString(),
        rating,
        comment,
        created_at: new Date().toISOString(),
        reviewer: null,
      }, ...prev]);
    } else {
      const data = await res.json();
      setSubmitError(data.error ?? "Failed to submit review");
    }
    setSubmitting(false);
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <h2 style={{
          fontFamily: "var(--font-cormorant)", fontWeight: 500,
          fontSize: "1.4rem", letterSpacing: "0.03em", color: "#1A1A18", whiteSpace: "nowrap"
        }}>
          Reviews
          {avg && (
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "var(--muted)", marginLeft: "0.75rem" }}>
              ★ {avg} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          )}
        </h2>
        <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
        {canReview && !showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--cream)", background: "#C4440A",
              border: "none", padding: "0.55rem 1.1rem", cursor: "pointer",
              whiteSpace: "nowrap", transition: "opacity 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            Leave a review
          </button>
        )}
      </div>

      {/* Already reviewed note */}
      {alreadyReviewed && !submitted && (
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65, marginBottom: "1.25rem" }}>
          You&apos;ve already reviewed this purchase.
        </p>
      )}

      {/* Success */}
      {submitted && (
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#C4440A", marginBottom: "1.5rem" }}>
          ✦ Thanks for your review!
        </p>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ border: "1px solid var(--warm-tan)", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.8rem" }}>
            Your rating
          </p>
          <div style={{ marginBottom: "1.2rem" }}>
            <Stars rating={hovered || rating} interactive onSelect={setRating} onHover={setHovered} />
          </div>

          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>
            Your review
          </p>
          <textarea
            required
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="Tell other buyers what you thought of this piece…"
            style={{
              width: "100%", background: "transparent",
              border: "1px solid var(--warm-tan)", outline: "none",
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.82rem", color: "var(--dark)",
              padding: "0.75rem", resize: "none", caretColor: "#C4440A",
              boxSizing: "border-box",
            }}
          />

          {submitError && (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#C62828", marginTop: "0.5rem" }}>
              {submitError}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--cream)", background: "#C4440A",
                border: "none", padding: "0.75rem 1.5rem",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.88rem", letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--muted)", background: "none",
                border: "1px solid var(--warm-tan)", padding: "0.75rem 1.5rem", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.8rem", color: "#1E1E1C", opacity: 0.6 }}>
          No reviews yet — be the first to review this item.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {reviews.map(r => (
            <div key={r.id} style={{ borderBottom: "1px solid var(--warm-tan)", paddingBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "var(--dark)" }}>
                      {r.reviewer?.display_name ?? r.reviewer?.username ?? "Verified buyer"}
                    </span>
                    <span style={{
                      fontFamily: "var(--font-jost)", fontWeight: 500,
                      fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                      color: "#C4440A", border: "1px solid #C4440A", padding: "0.15rem 0.5rem"
                    }}>
                      Verified purchase
                    </span>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", color: "#3D3830" }}>
                  {fmtDate(r.created_at)}
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.8rem", lineHeight: 1.8, color: "var(--dark)", marginTop: "0.5rem"
              }}>
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
