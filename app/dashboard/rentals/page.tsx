"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addBusinessDays, RETURN_REVIEW_WINDOW_DAYS } from "@/lib/rentals/businessDays";

// ── Types ─────────────────────────────────────────────────────────────────────

type RentalStatus =
  | "pending" | "paid" | "active"
  | "return_pending"
  | "deposit_released"
  | "damage_claimed"
  | "deposit_resolved"
  | "cancelled" | "refunded";

interface SellerRental {
  id: string;
  status: RentalStatus;
  amount: number;           // cents — rental fee
  deposit_amount: number;   // cents
  deposit_held: boolean;
  deposit_release_amount: number | null;
  deposit_release_reason: string | null;
  deposit_released_at: string | null;
  damage_claim_photos: string[] | null;
  damage_claim_description: string | null;
  damage_claim_retain_amount: number | null;
  rental_start: string | null;
  rental_end: string | null;
  return_noted_at: string | null;
  late_fee_cents: number | null;
  late_fee_days: number | null;
  created_at: string;
  buyer_id: string;
  listing_id: string;
  // joined
  listing_title: string;
  listing_image: string | null;
  buyer_username: string;
  rent_price_per_day: number; // cents
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDaysUntilShipBack(rentalEnd: string): number {
  return Math.ceil((new Date(rentalEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountdownBadge(days: number) {
  if (days < 0) return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 3) return { bg: "#FFF8E1", text: "#E65100", label: `Ship back in ${days} day${days !== 1 ? "s" : ""}` };
  return { bg: "#E8F5E9", text: "#2D6A4F", label: `Ship back in ${days} days` };
}

function daysLeftInWindow(returnNotedAt: string): number {
  const deadline = addBusinessDays(new Date(returnNotedAt), RETURN_REVIEW_WINDOW_DAYS);
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isPast(r: SellerRental) {
  return r.status === "deposit_released" || r.status === "deposit_resolved" || r.status === "damage_claimed";
}

// ── Damage claim drawer state ─────────────────────────────────────────────────

interface ClaimDraft {
  photos: string[];
  description: string;
  retainAmount: string;
}

const EMPTY_DRAFT: ClaimDraft = { photos: [], description: "", retainAmount: "" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellerRentalsPage() {
  const [rentals,  setRentals]  = useState<SellerRental[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [lateFeeMultiplier, setLateFeeMultiplier] = useState(1.5);

  // Review-return drawer
  const [drawer,       setDrawer]       = useState<string | null>(null);
  const [confirming,   setConfirming]   = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Damage claim sub-view
  const [showClaimForm,    setShowClaimForm]    = useState(false);
  const [claimDraft,       setClaimDraft]       = useState<ClaimDraft>(EMPTY_DRAFT);
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false);
  const [claimSubmitting,  setClaimSubmitting]  = useState(false);
  const [claimError,       setClaimError]       = useState<string | null>(null);

  // ── Load late-fee multiplier for live estimate on overdue cards ─────────────
  useEffect(() => {
    fetch("/api/admin/settings/late-fee")
      .then(r => r.json())
      .then(d => { if (d.late_fee_multiplier) setLateFeeMultiplier(Number(d.late_fee_multiplier)); })
      .catch(() => { /* keep default 1.5 */ });
  }, []);

  // ── Fetch real data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rawOrders } = await supabase
        .from("orders")
        .select(
          "id, status, amount, deposit_amount, deposit_held, " +
          "deposit_release_amount, deposit_release_reason, deposit_released_at, " +
          "damage_claim_photos, damage_claim_description, damage_claim_retain_amount, " +
          "rental_start, rental_end, return_noted_at, late_fee_cents, late_fee_days, " +
          "created_at, buyer_id, listing_id"
        )
        .eq("seller_id", user.id)
        .eq("type", "rent")
        .order("created_at", { ascending: false });

      if (!rawOrders?.length) { setLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = rawOrders as any[];
      const listingIds = Array.from(new Set(rows.map((o) => o.listing_id)));
      const buyerIds   = Array.from(new Set(rows.map((o) => o.buyer_id)));

      const [{ data: listings }, { data: buyers }] = await Promise.all([
        supabase.from("listings").select("id, title, images, rent_price").in("id", listingIds),
        supabase.from("seller_profiles").select("id, username").in("id", buyerIds),
      ]);

      setRentals(rows.map((o) => {
        const l = listings?.find((x) => x.id === o.listing_id);
        const b = buyers?.find((x) => x.id === o.buyer_id);
        return {
          id:                         o.id,
          status:                     o.status as RentalStatus,
          amount:                     o.amount,
          deposit_amount:             o.deposit_amount ?? 0,
          deposit_held:               o.deposit_held ?? false,
          deposit_release_amount:     o.deposit_release_amount ?? null,
          deposit_release_reason:     o.deposit_release_reason ?? null,
          deposit_released_at:        o.deposit_released_at ?? null,
          damage_claim_photos:        o.damage_claim_photos ?? null,
          damage_claim_description:   o.damage_claim_description ?? null,
          damage_claim_retain_amount: o.damage_claim_retain_amount ?? null,
          rental_start:               o.rental_start ?? null,
          rental_end:                 o.rental_end ?? null,
          return_noted_at:            o.return_noted_at ?? null,
          late_fee_cents:             o.late_fee_cents ?? null,
          late_fee_days:              o.late_fee_days ?? null,
          created_at:                 o.created_at,
          buyer_id:                   o.buyer_id,
          listing_id:                 o.listing_id,
          listing_title:              l?.title ?? "Item",
          listing_image:              l?.images?.[0] ?? null,
          buyer_username:             b?.username ?? "",
          rent_price_per_day:         (l as { rent_price?: number } | undefined)?.rent_price ?? 0,
        };
      }));
      setLoading(false);
    });
  }, []);

  const active         = rentals.filter((r) => r.status === "active" || r.status === "paid");
  const awaitingAction = rentals.filter((r) => r.status === "return_pending");
  const past           = rentals.filter(isPast);

  const drawerRental = rentals.find((r) => r.id === drawer);

  function openDrawer(id: string) {
    setDrawer(id);
    setConfirmError(null);
    setShowClaimForm(false);
    setClaimDraft(EMPTY_DRAFT);
    setClaimError(null);
  }

  async function confirmReturn(orderId: string) {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(`/api/rentals/${orderId}/confirm-return`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setConfirmError(body.error ?? "Something went wrong.");
        return;
      }
      setRentals((prev) => prev.map((r) =>
        r.id === orderId
          ? {
              ...r,
              status: "deposit_released" as RentalStatus,
              deposit_release_amount: body.renterRefundCents ?? r.deposit_amount,
              deposit_release_reason: body.overdueDays > 0
                ? `returned in good condition — ${body.overdueDays} day${body.overdueDays !== 1 ? "s" : ""} late`
                : "returned in good condition",
              late_fee_cents: body.lateFee > 0 ? body.lateFee : null,
              late_fee_days:  body.overdueDays > 0 ? body.overdueDays : null,
            }
          : r,
      ));
      setDrawer(null);
    } catch {
      setConfirmError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, folder: "veeral/damage-claims" }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setClaimDraft((d) => ({ ...d, photos: [...d.photos, url] }));
    } catch {
      setClaimError("Photo upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function submitClaim(orderId: string) {
    if (!drawerRental) return;
    const retainCents = Math.round(parseFloat(claimDraft.retainAmount) * 100);
    if (isNaN(retainCents) || retainCents <= 0) { setClaimError("Enter a valid amount to retain."); return; }
    if (retainCents > drawerRental.deposit_amount) { setClaimError(`Amount cannot exceed the deposit (${fmt(drawerRental.deposit_amount)}).`); return; }
    if (!claimDraft.description.trim()) { setClaimError("Description is required."); return; }
    if (claimDraft.photos.length === 0) { setClaimError("At least one photo is required."); return; }

    setClaimSubmitting(true);
    setClaimError(null);
    try {
      const res = await fetch(`/api/rentals/${orderId}/claim-damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: claimDraft.photos, description: claimDraft.description.trim(), retainAmount: retainCents }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setClaimError(error ?? "Failed to file claim.");
        return;
      }
      setRentals((prev) => prev.map((r) =>
        r.id === orderId
          ? { ...r, status: "damage_claimed" as RentalStatus, damage_claim_photos: claimDraft.photos, damage_claim_description: claimDraft.description.trim(), damage_claim_retain_amount: retainCents }
          : r,
      ));
      setDrawer(null);
    } catch {
      setClaimError("Network error. Please try again.");
    } finally {
      setClaimSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Rentals
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : `${active.length + awaitingAction.length} active · ${awaitingAction.length} awaiting your action`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading rentals…
        </div>
      ) : rentals.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed var(--warm-tan)" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.4rem", color: "#1A1A18", marginBottom: "0.5rem" }}>No rentals yet</p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6 }}>
            When a renter books one of your listings, it will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Active rentals ─────────────────────────────────────────────── */}
          {active.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.75rem" }}>
                Out on rental
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {active.map((rental) => {
                  const days  = rental.rental_end ? getDaysUntilShipBack(rental.rental_end) : 999;
                  const badge = getCountdownBadge(days);
                  return (
                    <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                        <div style={{ width: "56px", height: "56px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                          {rental.listing_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={rental.listing_image} alt={rental.listing_title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{rental.listing_title}</p>
                            <span style={{ padding: "0.18rem 0.6rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>{badge.label}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.5rem" }}>
                            {[
                              { k: "Renter",       v: `@${rental.buyer_username}` },
                              { k: "Period",       v: rental.rental_start && rental.rental_end ? `${fmtShort(rental.rental_start)} – ${fmtShort(rental.rental_end)}` : "—" },
                              { k: "Rental fee",   v: fmt(rental.amount) },
                            ].map(({ k, v }) => (
                              <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                                <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                              </span>
                            ))}
                          </div>
                          {rental.rental_end && (
                            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                              <span style={{ fontWeight: 600, color: days <= 2 ? "#C62828" : "#1A1A18" }}>Renter ships back by {fmtShort(rental.rental_end)}</span>{" "}
                              <span title="Drop off with the carrier by this date. Late fees are based on the renter's ship/postmark date, not the delivery date." style={{ cursor: "help", borderBottom: "1px dotted currentColor", fontSize: "0.7rem", opacity: 0.55 }}>ⓘ</span>
                            </p>
                          )}
                          {/* Deposit context — separate from payout */}
                          <div style={{ display: "inline-block", padding: "0.4rem 0.75rem", background: "#F9F6F2", border: "1px solid var(--warm-tan)" }}>
                            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.8 }}>
                              <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>Deposit held </span>
                              {fmt(rental.deposit_amount)} — refundable to renter; claimable if returned damaged
                            </span>
                          </div>
                          {days < 0 && (() => {
                            const overdue = Math.abs(days);
                            const estFee = rental.rent_price_per_day > 0
                              ? Math.round(rental.rent_price_per_day * overdue * lateFeeMultiplier)
                              : null;
                            return (
                              <div style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#FDECEA", padding: "0.35rem 0.75rem" }}>
                                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C62828" }}>
                                  Late — ship-by date passed
                                  {estFee !== null && ` · est. late fee ${fmt(estFee)}`}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Awaiting action ────────────────────────────────────────────── */}
          {awaitingAction.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.75rem" }}>
                ⚑ Awaiting your confirmation
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {awaitingAction.map((rental) => {
                  const windowDays = rental.return_noted_at ? daysLeftInWindow(rental.return_noted_at) : null;
                  return (
                    <div key={rental.id} style={{ background: "#fff", border: "1px solid rgba(196,68,10,0.3)", borderLeft: "3px solid #C4440A", padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: 0 }}>
                          <div style={{ width: "56px", height: "56px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                            {rental.listing_image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={rental.listing_image} alt={rental.listing_title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{rental.listing_title}</p>
                              <span style={{ padding: "0.18rem 0.6rem", background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Return pending</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                              {[
                                { k: "Renter",       v: `@${rental.buyer_username}` },
                                { k: "Period",       v: rental.rental_start && rental.rental_end ? `${fmtShort(rental.rental_start)} – ${fmtShort(rental.rental_end)}` : "—" },
                                { k: "Deposit held", v: fmt(rental.deposit_amount) },
                              ].map(({ k, v }) => (
                                <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                                  <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                                </span>
                              ))}
                            </div>
                            {windowDays !== null && (
                              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: windowDays <= 1 ? "#991B1B" : "#92400E" }}>
                                {windowDays > 0
                                  ? `You have ${windowDays} business day${windowDays !== 1 ? "s" : ""} to inspect or file a damage claim.`
                                  : "Review window has lapsed — deposit will auto-release on the next scheduled run."}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => openDrawer(rental.id)}
                          style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.55rem 1.1rem", flexShrink: 0, background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}
                        >
                          Review return
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Past rentals ───────────────────────────────────────────────── */}
          {past.length > 0 && (
            <div>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginBottom: "0.75rem" }}>
                Past rentals
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
                {past.map((rental) => (
                  <div key={rental.id} style={{ background: "var(--cream)", padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div style={{ width: "48px", height: "48px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                        {rental.listing_image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rental.listing_image} alt={rental.listing_title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18" }}>{rental.listing_title}</p>
                          <span style={{
                            padding: "0.18rem 0.55rem",
                            background: rental.status === "damage_claimed" ? "#FEF3C7" : rental.status === "deposit_resolved" ? "#EDE9FE" : "#D1FAE5",
                            color:      rental.status === "damage_claimed" ? "#92400E" : rental.status === "deposit_resolved" ? "#5B21B6" : "#065F46",
                            fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0,
                          }}>
                            {rental.status === "damage_claimed" ? "Admin reviewing" : rental.status === "deposit_resolved" ? "Resolved" : "Deposit released"}
                          </span>
                        </div>
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6, marginBottom: "0.3rem" }}>
                          @{rental.buyer_username}
                          {rental.rental_start && rental.rental_end && ` · ${fmtDate(rental.rental_start)} – ${fmtDate(rental.rental_end)}`}
                          {" · "}{fmt(rental.amount)} rental fee
                        </p>
                        {rental.status === "damage_claimed" && rental.damage_claim_retain_amount != null && (
                          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#92400E" }}>
                            Claim filed — requesting to retain <strong>{fmt(rental.damage_claim_retain_amount)}</strong> of {fmt(rental.deposit_amount)} deposit. Admin will review.
                          </p>
                        )}
                        {rental.deposit_release_amount != null && rental.status !== "damage_claimed" && (
                          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52" }}>
                            Deposit of <strong>{fmt(rental.deposit_release_amount)}</strong> released
                            {rental.deposit_release_reason ? ` — ${rental.deposit_release_reason}` : ""}.
                            {rental.late_fee_cents != null && rental.late_fee_cents > 0 && (
                              <span style={{ display: "block", marginTop: "0.2rem", color: "#C62828" }}>
                                Late fee applied: <strong>{fmt(rental.late_fee_cents)}</strong>
                                {rental.late_fee_days != null && ` (${rental.late_fee_days} day${rental.late_fee_days !== 1 ? "s" : ""} overdue)`}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Review return drawer ─────────────────────────────────────────────── */}
      {drawerRental && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem 2rem calc(2rem + env(safe-area-inset-bottom, 80px))", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto", maxHeight: "80vh", overflowY: "auto" }}>

            {!showClaimForm ? (
              <>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.4rem" }}>
                  Review return
                </h2>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem" }}>
                  {drawerRental.listing_title} · Deposit: {fmt(drawerRental.deposit_amount)}
                </p>

                {(() => {
                  const overdueDays = drawerRental.rental_end
                    ? Math.max(0, -getDaysUntilShipBack(drawerRental.rental_end))
                    : 0;
                  const estLateFee = overdueDays > 0 && drawerRental.rent_price_per_day > 0
                    ? Math.min(Math.round(drawerRental.rent_price_per_day * overdueDays * lateFeeMultiplier), drawerRental.deposit_amount)
                    : 0;
                  const renterRefund = drawerRental.deposit_amount - estLateFee;
                  return (
                    <div style={{ background: overdueDays > 0 ? "#FDECEA" : "#FEF3C7", padding: "0.75rem 1rem", marginBottom: "1.75rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: overdueDays > 0 ? "#991B1B" : "#92400E", lineHeight: 1.6, margin: 0 }}>
                        {overdueDays > 0 ? (
                          <>
                            <strong>Return is {overdueDays} day{overdueDays !== 1 ? "s" : ""} late.</strong>{" "}
                            Est. late fee: <strong>{fmt(estLateFee)}</strong> (deducted from deposit).{" "}
                            Renter refund: <strong>{fmt(renterRefund)}</strong>.{" "}
                            Exact fee is computed at confirmation time.
                          </>
                        ) : (
                          <>
                            <strong>Confirming good condition</strong> releases the full deposit of {fmt(drawerRental.deposit_amount)} back to the renter.{" "}
                            <strong>This moves real money</strong> — Stripe refund will be issued immediately.
                          </>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {confirmError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{confirmError}</p>}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    onClick={() => confirmReturn(drawerRental.id)}
                    disabled={confirming}
                    style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", background: confirming ? "var(--warm-tan)" : "var(--burnt-orange)", color: confirming ? "var(--muted)" : "var(--cream)", border: "none", cursor: confirming ? "not-allowed" : "pointer" }}
                  >
                    {confirming ? "Processing…" : `✓ Good condition — release ${fmt(drawerRental.deposit_amount)} deposit`}
                  </button>
                  <button
                    onClick={() => { setShowClaimForm(true); setClaimError(null); }}
                    style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "#991B1B", border: "1px solid #FECACA", cursor: "pointer" }}
                  >
                    ⚠ File a damage claim
                  </button>
                  <button
                    onClick={() => setDrawer(null)}
                    style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <button onClick={() => { setShowClaimForm(false); setClaimError(null); }} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    ← Back
                  </button>
                  <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.4rem", color: "#1A1A18", margin: 0 }}>
                    File damage claim
                  </h2>
                </div>

                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.5rem" }}>
                  {drawerRental.listing_title} · Deposit: {fmt(drawerRental.deposit_amount)}
                </p>

                <div style={{ background: "#FFF5F5", border: "1px solid #FECACA", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#991B1B", lineHeight: 1.6, margin: 0 }}>
                    A Veeral admin will review your claim and photos before any decision is made. The deposit will remain held until the admin resolves the claim. <strong>No money moves until admin resolution.</strong>
                  </p>
                </div>

                {/* Photos */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
                    Photos <span style={{ color: "#991B1B" }}>*</span>
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    {claimDraft.photos.map((url, i) => (
                      <div key={i} style={{ position: "relative", width: "64px", height: "64px" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "2px" }} />
                        <button onClick={() => setClaimDraft((d) => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", background: "#991B1B", color: "#fff", border: "none", borderRadius: "50%", fontSize: "0.6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ))}
                    {claimDraft.photos.length < 6 && (
                      <label style={{ width: "64px", height: "64px", border: "1px dashed var(--warm-tan)", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingPhoto ? "not-allowed" : "pointer", color: "var(--muted)", fontSize: "1.2rem" }}>
                        {uploadingPhoto ? "…" : "+"}
                        <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingPhoto} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = ""; }} />
                      </label>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6 }}>Upload up to 6 photos showing the damage.</p>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
                    Description <span style={{ color: "#991B1B" }}>*</span>
                  </p>
                  <textarea rows={4} placeholder="Describe the damage in detail…" value={claimDraft.description} onChange={(e) => setClaimDraft((d) => ({ ...d, description: e.target.value }))} style={{ width: "100%", padding: "0.75rem", background: "#FAF6F1", border: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#1A1A18", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>

                {/* Retain amount */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
                    Amount to retain from deposit <span style={{ color: "#991B1B" }}>*</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#1A1A18" }}>$</span>
                    <input type="number" min={1} max={drawerRental.deposit_amount / 100} step={1} placeholder={`Max $${(drawerRental.deposit_amount / 100).toLocaleString()}`} value={claimDraft.retainAmount} onChange={(e) => setClaimDraft((d) => ({ ...d, retainAmount: e.target.value }))} style={{ flex: 1, padding: "0.65rem 0.75rem", background: "#FAF6F1", border: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "#1A1A18", outline: "none" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6, marginTop: "0.35rem" }}>Cannot exceed the full deposit of {fmt(drawerRental.deposit_amount)}.</p>
                </div>

                {claimError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{claimError}</p>}

                <button onClick={() => submitClaim(drawerRental.id)} disabled={claimSubmitting} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", background: claimSubmitting ? "var(--warm-tan)" : "#991B1B", color: claimSubmitting ? "var(--muted)" : "#fff", border: "none", cursor: claimSubmitting ? "not-allowed" : "pointer" }}>
                  {claimSubmitting ? "Submitting…" : "Submit damage claim"}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
