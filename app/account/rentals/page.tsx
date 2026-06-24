"use client";

import { useState } from "react";

// ── Status helpers ────────────────────────────────────────────────────────────

type RentalStatus =
  | "active"         // paid / shipped / delivered
  | "return_pending" // buyer marked returned; seller reviewing
  | "deposit_released"
  | "damage_claimed"
  | "deposit_resolved";

interface StatusBadge { bg: string; text: string; label: string }

function rentalStatusBadge(status: RentalStatus): StatusBadge {
  switch (status) {
    case "active":           return { bg: "#E8F5E9", text: "#2D6A4F", label: "Active" };
    case "return_pending":   return { bg: "#FEF3C7", text: "#92400E", label: "Return pending" };
    case "deposit_released": return { bg: "#D1FAE5", text: "#065F46", label: "Deposit released" };
    case "damage_claimed":   return { bg: "#FFF5F5", text: "#991B1B", label: "Damage claim filed" };
    case "deposit_resolved": return { bg: "#EDE9FE", text: "#5B21B6", label: "Claim resolved" };
  }
}

function getDaysLeft(returnBy: Date): number {
  return Math.ceil((returnBy.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountdownBadge(days: number): StatusBadge {
  if (days < 0)  return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 2) return { bg: "#FFF8E1", text: "#E65100", label: `${days} day${days !== 1 ? "s" : ""} left` };
  return               { bg: "#E8F5E9", text: "#2D6A4F", label: `${days} days left` };
}

// ── Mock data (replace with Supabase fetch) ───────────────────────────────────

interface BuyerRental {
  id: string;
  item: string;
  seller: string;
  rentalStart: string;
  rentalEnd: string;
  returnBy: Date;
  dailyRate: number;
  deposit: number;
  depositReleaseAmount?: number;
  depositRefundProcessed?: boolean;
  releaseReason?: string;
  bg: string;
  status: RentalStatus;
}

const MOCK_RENTALS: BuyerRental[] = [
  {
    id: "R201", item: "Mirror-work Lehenga (Bridal)", seller: "priya_sharma",
    rentalStart: "Jun 6, 2026", rentalEnd: "Jun 14, 2026",
    returnBy: new Date("2026-06-14"), dailyRate: 160, deposit: 800,
    bg: "#D4C5B5", status: "active",
  },
  {
    id: "R188", item: "Gold Tissue Lehenga", seller: "priya_sharma",
    rentalStart: "May 1, 2026", rentalEnd: "May 8, 2026",
    returnBy: new Date("2026-05-08"), dailyRate: 200, deposit: 1000,
    depositReleaseAmount: 1000, depositRefundProcessed: false,
    releaseReason: "returned in good condition",
    bg: "#E0DDD8", status: "deposit_released",
  },
  {
    id: "R175", item: "Sequin Lehenga — Midnight Blue", seller: "priya_sharma",
    rentalStart: "Apr 10, 2026", rentalEnd: "Apr 16, 2026",
    returnBy: new Date("2026-04-16"), dailyRate: 95, deposit: 500,
    bg: "#B8BFCC", status: "deposit_released",
    depositReleaseAmount: 500, depositRefundProcessed: false,
    releaseReason: "auto-released: review window lapsed",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuyerRentalsPage() {
  const [rentals, setRentals] = useState<BuyerRental[]>(MOCK_RENTALS);
  const [instructionsId, setInstructionsId] = useState<string | null>(null);
  const [returnDrawerId, setReturnDrawerId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const active = rentals.filter(r => r.status === "active");
  const inProgress = rentals.filter(r => r.status === "return_pending" || r.status === "damage_claimed");
  const past   = rentals.filter(r =>
    r.status === "deposit_released" || r.status === "deposit_resolved"
  );

  async function markReturned(rentalId: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/mark-returned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: trackingInput.trim() || undefined }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSubmitError(error ?? "Something went wrong.");
        return;
      }
      setRentals(prev => prev.map(r =>
        r.id === rentalId ? { ...r, status: "return_pending" } : r
      ));
      setReturnDrawerId(null);
      setTrackingInput("");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Rentals
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {active.length} active rental{active.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Active rentals */}
      {active.length === 0 && inProgress.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          No active rentals right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>

          {/* Active — item with renter */}
          {active.map(rental => {
            const days  = getDaysLeft(rental.returnBy);
            const badge = getCountdownBadge(days);
            return (
              <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>{rental.item}</p>
                      <span style={{ padding: "0.22rem 0.65rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                      {[
                        { k: "Seller",  v: `@${rental.seller}` },
                        { k: "Period",  v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                        { k: "Rate",    v: `$${rental.dailyRate}/day` },
                        { k: "Deposit", v: `$${rental.deposit}` },
                      ].map(({ k, v }) => (
                        <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                          <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setInstructionsId(rental.id)}
                        style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
                      >
                        Return instructions
                      </button>
                      <button
                        onClick={() => { setReturnDrawerId(rental.id); setTrackingInput(""); setSubmitError(null); }}
                        style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}
                      >
                        Mark as returned
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* In-progress — return_pending / damage_claimed */}
          {inProgress.map(rental => {
            const badge = rentalStatusBadge(rental.status);
            return (
              <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>{rental.item}</p>
                      <span style={{ padding: "0.22rem 0.65rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                      {[
                        { k: "Seller",  v: `@${rental.seller}` },
                        { k: "Period",  v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                        { k: "Deposit", v: `$${rental.deposit}` },
                      ].map(({ k, v }) => (
                        <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                          <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                        </span>
                      ))}
                    </div>
                    {rental.status === "return_pending" && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#92400E", background: "#FEF3C7", padding: "0.4rem 0.75rem", display: "inline-block" }}>
                        Return received — seller has 5 business days to inspect. Deposit auto-releases if no action.
                      </p>
                    )}
                    {rental.status === "damage_claimed" && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", background: "#FFF5F5", padding: "0.4rem 0.75rem", display: "inline-block" }}>
                        The seller has filed a damage claim. Veeral admin will review and decide.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past rentals */}
      {past.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginBottom: "1rem" }}>
            Past rentals
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
            {past.map(rental => {
              const badge = rentalStatusBadge(rental.status);
              return (
                <div key={rental.id} style={{ background: "var(--cream)", padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.3rem" }}>
                        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18" }}>{rental.item}</p>
                        <span style={{ padding: "0.18rem 0.55rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
                          {badge.label}
                        </span>
                      </div>
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6, marginBottom: rental.depositReleaseAmount != null ? "0.4rem" : 0 }}>
                        @{rental.seller} · {rental.rentalStart} – {rental.rentalEnd}
                      </p>
                      {rental.depositReleaseAmount != null && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52" }}>
                          Deposit of <strong>${rental.depositReleaseAmount.toLocaleString()}</strong> released
                          {rental.releaseReason ? ` — ${rental.releaseReason}` : ""}.{" "}
                          <span style={{ color: "#92400E" }}>
                            {rental.depositRefundProcessed
                              ? "Stripe refund processed."
                              : "No money moved yet — Stripe refund pending."}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return instructions drawer */}
      {instructionsId && (
        <>
          <div onClick={() => setInstructionsId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "1.5rem" }}>
              How to return your rental
            </h2>
            {[
              { n: 1, title: "Pack carefully", body: "Fold the garment gently and use the original garment bag if provided. Do not return without protective packaging." },
              { n: 2, title: "Ship within the return window", body: "Drop off at any USPS, UPS, or FedEx location before your return date. Keep your receipt." },
              { n: 3, title: 'Click "Mark as returned"', body: 'Once shipped, click the "Mark as returned" button and optionally enter your tracking number so the seller knows it\'s on the way.' },
              { n: 4, title: "Deposit release", body: "Your deposit will be released within 5 business days after the seller confirms the item is in good condition, or automatically if the seller takes no action." },
            ].map(step => (
              <div key={step.n} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "rgba(196,68,10,0.1)", color: "var(--burnt-orange)", fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {step.n}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18", marginBottom: "0.2rem" }}>{step.title}</p>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, lineHeight: 1.65 }}>{step.body}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setInstructionsId(null)} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}>
              Got it
            </button>
          </div>
        </>
      )}

      {/* Mark as returned drawer */}
      {returnDrawerId && (
        <>
          <div onClick={() => setReturnDrawerId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
              Mark as returned
            </h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem", lineHeight: 1.6 }}>
              Only do this once you&apos;ve shipped the item back. The seller will have 5 business days to confirm receipt before your deposit is automatically released.
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>
              Tracking number <span style={{ fontWeight: 400, opacity: 0.55 }}>(optional)</span>
            </p>
            <input
              type="text"
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              placeholder="e.g. 1Z999AA10123456784"
              style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1px solid var(--warm-tan)", background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", boxSizing: "border-box", marginBottom: "1.5rem" }}
            />
            {submitError && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{submitError}</p>
            )}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => markReturned(returnDrawerId)}
                disabled={submitting}
                style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", background: submitting ? "var(--warm-tan)" : "var(--burnt-orange)", color: submitting ? "var(--muted)" : "var(--cream)", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Submitting…" : "Confirm — item shipped back"}
              </button>
              <button
                onClick={() => setReturnDrawerId(null)}
                style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
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
