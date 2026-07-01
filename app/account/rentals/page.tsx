"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type RentalStatus =
  | "pending" | "paid" | "shipped" | "delivered"
  | "return_pending"
  | "deposit_released"
  | "damage_claimed"
  | "deposit_resolved"
  | "cancelled" | "refunded";

interface BuyerRental {
  id: string;
  listing_id: string;
  seller_id: string;
  amount: number;         // cents — rental fee
  deposit_amount: number | null;
  deposit_held: boolean;
  deposit_release_amount: number | null;
  deposit_release_reason: string | null;
  deposit_released_at: string | null;
  status: RentalStatus;
  rental_start: string | null;
  rental_end: string | null;
  return_tracking_number: string | null;
  return_noted_at: string | null;
  created_at: string;
  title: string;
  images: string[];
  seller_username: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────

interface Badge { bg: string; text: string; label: string }

function rentalStatusBadge(status: RentalStatus): Badge {
  switch (status) {
    case "pending":
    case "paid":
    case "shipped":
    case "delivered":        return { bg: "#E8F5E9", text: "#2D6A4F", label: "Active" };
    case "return_pending":   return { bg: "#FEF3C7", text: "#92400E", label: "Return pending" };
    case "deposit_released": return { bg: "#D1FAE5", text: "#065F46", label: "Deposit released" };
    case "damage_claimed":   return { bg: "#FFF5F5", text: "#991B1B", label: "Damage claim filed" };
    case "deposit_resolved": return { bg: "#EDE9FE", text: "#5B21B6", label: "Claim resolved" };
    case "cancelled":        return { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" };
    case "refunded":         return { bg: "#EDE9FE", text: "#5B21B6", label: "Refunded" };
  }
}

function getDaysLeft(returnBy: string): number {
  return Math.ceil((new Date(returnBy).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountdownBadge(days: number): Badge {
  if (days < 0)  return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 2) return { bg: "#FFF8E1", text: "#E65100", label: `${days} day${days !== 1 ? "s" : ""} left` };
  return               { bg: "#E8F5E9", text: "#2D6A4F", label: `${days} days left` };
}

function isActive(s: RentalStatus) {
  return s === "pending" || s === "paid" || s === "shipped" || s === "delivered";
}

function isInProgress(s: RentalStatus) {
  return s === "return_pending" || s === "damage_claimed";
}

function isPast(s: RentalStatus) {
  return s === "deposit_released" || s === "deposit_resolved" || s === "cancelled" || s === "refunded";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuyerRentalsPage() {
  const [rentals, setRentals]         = useState<BuyerRental[]>([]);
  const [loading, setLoading]         = useState(true);
  const [instructionsId, setInstructionsId] = useState<string | null>(null);
  const [returnDrawerId, setReturnDrawerId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput]   = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rawOrders } = await supabase
        .from("orders")
        .select(
          "id, listing_id, seller_id, amount, deposit_amount, deposit_held, " +
          "deposit_release_amount, deposit_release_reason, deposit_released_at, " +
          "status, rental_start, rental_end, return_tracking_number, return_noted_at, created_at"
        )
        .eq("buyer_id", user.id)
        .eq("type", "rent")
        .order("created_at", { ascending: false });

      if (!rawOrders?.length) { setLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = rawOrders as any[];
      const listingIds = Array.from(new Set(rows.map((o) => o.listing_id as string)));
      const sellerIds  = Array.from(new Set(rows.map((o) => o.seller_id as string)));

      const [{ data: listings }, { data: sellers }] = await Promise.all([
        supabase.from("listings").select("id, title, images").in("id", listingIds),
        supabase.from("seller_profiles").select("id, username").in("id", sellerIds),
      ]);

      const merged: BuyerRental[] = rows.map((o) => {
        const l = listings?.find((x) => x.id === o.listing_id);
        const s = sellers?.find((x) => x.id === o.seller_id);
        return {
          id:                     o.id,
          listing_id:             o.listing_id,
          seller_id:              o.seller_id,
          amount:                 o.amount,
          deposit_amount:         o.deposit_amount ?? null,
          deposit_held:           o.deposit_held ?? false,
          deposit_release_amount: o.deposit_release_amount ?? null,
          deposit_release_reason: o.deposit_release_reason ?? null,
          deposit_released_at:    o.deposit_released_at ?? null,
          status:                 o.status as RentalStatus,
          rental_start:           o.rental_start ?? null,
          rental_end:             o.rental_end ?? null,
          return_tracking_number: o.return_tracking_number ?? null,
          return_noted_at:        o.return_noted_at ?? null,
          created_at:             o.created_at,
          title:                  l?.title ?? "Item",
          images:                 l?.images ?? [],
          seller_username:        s?.username ?? "",
        };
      });

      setRentals(merged);
      setLoading(false);
    });
  }, []);

  async function markReturned(rentalId: string) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/mark-returned`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tracking_number: trackingInput.trim() || undefined }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setSubmitError(error ?? "Something went wrong.");
        return;
      }
      setRentals((prev) => prev.map((r) => r.id === rentalId ? { ...r, status: "return_pending" } : r));
      setReturnDrawerId(null);
      setTrackingInput("");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const active     = rentals.filter((r) => isActive(r.status));
  const inProgress = rentals.filter((r) => isInProgress(r.status));
  const past       = rentals.filter((r) => isPast(r.status));

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Rentals
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : `${active.length} active rental${active.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading rentals…
        </div>
      ) : active.length === 0 && inProgress.length === 0 && past.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          No rentals yet.{" "}
          <Link href="/listings" style={{ color: "#C4440A", textDecoration: "underline" }}>Browse listings</Link>
        </div>
      ) : (
        <>
          {/* Active + in-progress */}
          {(active.length > 0 || inProgress.length > 0) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>

              {active.map((rental) => {
                const days  = rental.rental_end ? getDaysLeft(rental.rental_end) : 999;
                const badge = getCountdownBadge(days);
                const thumb = rental.images[0] ?? null;
                return (
                  <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                        {thumb && <img src={thumb} alt={rental.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>{rental.title}</p>
                          <span style={{ padding: "0.22rem 0.65rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                          {[
                            { k: "Seller",  v: `@${rental.seller_username}` },
                            { k: "Period",  v: rental.rental_start && rental.rental_end ? `${fmtDate(rental.rental_start)} – ${fmtDate(rental.rental_end)}` : "—" },
                            { k: "Deposit", v: rental.deposit_amount != null ? `$${(rental.deposit_amount / 100).toLocaleString()}` : "—" },
                          ].map(({ k, v }) => (
                            <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                              <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                          <Link href={`/account/orders/${rental.id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}>
                            View order
                          </Link>
                          <button onClick={() => setInstructionsId(rental.id)} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>
                            Return instructions
                          </button>
                          <button onClick={() => { setReturnDrawerId(rental.id); setTrackingInput(""); setSubmitError(null); }} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}>
                            Mark as returned
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {inProgress.map((rental) => {
                const badge = rentalStatusBadge(rental.status);
                const thumb = rental.images[0] ?? null;
                return (
                  <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                        {thumb && <img src={thumb} alt={rental.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>{rental.title}</p>
                          <span style={{ padding: "0.22rem 0.65rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                            {badge.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                          {[
                            { k: "Seller",  v: `@${rental.seller_username}` },
                            { k: "Period",  v: rental.rental_start && rental.rental_end ? `${fmtDate(rental.rental_start)} – ${fmtDate(rental.rental_end)}` : "—" },
                            { k: "Deposit", v: rental.deposit_amount != null ? `$${(rental.deposit_amount / 100).toLocaleString()}` : "—" },
                          ].map(({ k, v }) => (
                            <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                              <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                          <Link href={`/account/orders/${rental.id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}>
                            View order
                          </Link>
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
                {past.map((rental) => {
                  const badge = rentalStatusBadge(rental.status);
                  const thumb = rental.images[0] ?? null;
                  return (
                    <div key={rental.id} style={{ background: "var(--cream)", padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                        <div style={{ width: "48px", height: "48px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                          {thumb && <img src={thumb} alt={rental.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.3rem" }}>
                            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18" }}>{rental.title}</p>
                            <span style={{ padding: "0.18rem 0.55rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
                              {badge.label}
                            </span>
                          </div>
                          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6, marginBottom: "0.4rem" }}>
                            @{rental.seller_username}
                            {rental.rental_start && rental.rental_end && ` · ${fmtDate(rental.rental_start)} – ${fmtDate(rental.rental_end)}`}
                          </p>
                          {rental.deposit_release_amount != null && (
                            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52", marginBottom: "0.5rem" }}>
                              Deposit of <strong>${(rental.deposit_release_amount / 100).toLocaleString()}</strong> released
                              {rental.deposit_release_reason ? ` — ${rental.deposit_release_reason}` : ""}.
                            </p>
                          )}
                          <Link href={`/account/orders/${rental.id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px", opacity: 0.65 }}>
                            View order →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
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
            {submitError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{submitError}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => markReturned(returnDrawerId!)} disabled={submitting} style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.16em", textTransform: "uppercase", background: submitting ? "var(--warm-tan)" : "var(--burnt-orange)", color: submitting ? "var(--muted)" : "var(--cream)", border: "none", cursor: submitting ? "not-allowed" : "pointer" }}>
                {submitting ? "Submitting…" : "Confirm — item shipped back"}
              </button>
              <button onClick={() => setReturnDrawerId(null)} style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
