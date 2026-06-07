"use client";

import { useState } from "react";

interface Review {
  id: string;
  buyer_username: string;
  rating: number;
  body: string;
  created_at: string;
  verified_purchase: boolean;
}

interface ReviewsProps {
  listingId: string;
  reviews: Review[];
  canReview: boolean; // true if logged-in user has purchased/rented this item
}

// Placeholder reviews
const PLACEHOLDER_REVIEWS: Review[] = [
  {
    id: "1",
    buyer_username: "meena_k",
    rating: 5,
    body: "Absolutely stunning lehenga — the embroidery is even more beautiful in person. Arrived well-packaged and exactly as described. Would buy from this seller again without hesitation.",
    created_at: "2026-04-12",
    verified_purchase: true,
  },
  {
    id: "2",
    buyer_username: "tara_style",
    rating: 4,
    body: "Great condition for a pre-loved piece. Shipping was fast and seller was very communicative. Slightly smaller than listed but still wearable. Overall really happy with this purchase.",
    created_at: "2026-03-28",
    verified_purchase: true,
  },
];

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "1.1rem" : "0.8rem";
  return (
    <span style={{ color: "#C4440A", fontSize: sz, letterSpacing: "0.05em" }}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Reviews({ listingId, reviews = PLACEHOLDER_REVIEWS, canReview }: ReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: POST to Supabase
    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
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

      {/* Leave review form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ border: "1px solid var(--warm-tan)", padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--muted)", marginBottom: "0.8rem"
          }}>
            Your rating
          </p>
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.2rem" }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s} type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "1.6rem", color: s <= (hovered || rating) ? "#C4440A" : "#C8C2BB",
                  padding: "0 0.1rem", transition: "color 0.1s",
                }}
              >★</button>
            ))}
          </div>

          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 500,
            fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--muted)", marginBottom: "0.5rem"
          }}>
            Your review
          </p>
          <textarea
            required
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            placeholder="Tell other buyers what you thought of this piece…"
            style={{
              width: "100%", background: "transparent",
              border: "1px solid var(--warm-tan)", outline: "none",
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.82rem", letterSpacing: "0.03em",
              color: "var(--dark)", padding: "0.75rem", resize: "none",
              caretColor: "#C4440A",
            }}
          />

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button type="submit" style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.88rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--cream)", background: "#C4440A",
              border: "none", padding: "0.75rem 1.5rem", cursor: "pointer",
            }}>
              Submit review
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.88rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--muted)", background: "none",
              border: "1px solid var(--warm-tan)", padding: "0.75rem 1.5rem", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.85rem", letterSpacing: "0.06em",
          color: "#C4440A", marginBottom: "1.5rem"
        }}>
          ✦ Thanks for your review!
        </p>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.8rem", letterSpacing: "0.06em",
          color: "#1E1E1C"
        }}>
          No reviews yet — be the first to review this item.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {reviews.map(r => (
            <div key={r.id} style={{ borderBottom: "1px solid var(--warm-tan)", paddingBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                    <span style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.85rem", color: "var(--dark)"
                    }}>
                      @{r.buyer_username}
                    </span>
                    {r.verified_purchase && (
                      <span style={{
                        fontFamily: "var(--font-jost)", fontWeight: 500,
                        fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                        color: "#C4440A", border: "1px solid #C4440A",
                        padding: "0.15rem 0.5rem"
                      }}>
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <span style={{
                  fontFamily: "var(--font-jost)", fontWeight: 500,
                  fontSize: "0.7rem", letterSpacing: "0.06em", color: "#3D3830"
                }}>
                  {fmtDate(r.created_at)}
                </span>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.8rem", letterSpacing: "0.03em",
                lineHeight: 1.8, color: "var(--dark)", marginTop: "0.5rem"
              }}>
                {r.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
