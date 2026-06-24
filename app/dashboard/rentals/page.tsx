"use client";

import { useState } from "react";
import { addBusinessDays, RETURN_REVIEW_WINDOW_DAYS } from "@/lib/rentals/businessDays";

// ── Types ─────────────────────────────────────────────────────────────────────

type RentalStatus =
  | "active"
  | "return_pending"
  | "deposit_released"
  | "damage_claimed"
  | "deposit_resolved";

interface SellerRental {
  id: string;
  item: string;
  renter: string;
  rentalStart: string;
  rentalEnd: string;
  dailyRate: number;
  totalDays: number;
  deposit: number;
  returnByDate: Date;
  returnNotedAt?: Date;
  depositReleaseAmount?: number;
  depositRefundProcessed?: boolean;
  releaseReason?: string;
  damageClaim?: {
    photos: string[];
    description: string;
    retainAmount: number;
  };
  color: string;
  lateFeePerDay: number;
  status: RentalStatus;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_RENTALS: SellerRental[] = [
  {
    id: "R201", item: "Mirror-work Lehenga (Bridal)", renter: "sana.rents",
    rentalStart: "Jun 6, 2026", rentalEnd: "Jun 14, 2026",
    dailyRate: 400, totalDays: 8, deposit: 1000,
    returnByDate: new Date("2026-06-14"), color: "#D4C5B5", lateFeePerDay: 60,
    status: "active",
  },
  {
    id: "R198", item: "Sequin Lehenga — Midnight Blue", renter: "kavitha_m",
    rentalStart: "Jun 5, 2026", rentalEnd: "Jun 11, 2026",
    dailyRate: 320, totalDays: 6, deposit: 800,
    returnByDate: new Date("2026-06-11"),
    returnNotedAt: new Date("2026-06-12"),
    color: "#B8BFCC", lateFeePerDay: 50,
    status: "return_pending",
  },
  {
    id: "R195", item: "Banarasi Silk Lehenga", renter: "riya.wears",
    rentalStart: "May 30, 2026", rentalEnd: "Jun 7, 2026",
    dailyRate: 250, totalDays: 8, deposit: 600,
    returnByDate: new Date("2026-06-07"), color: "#E8DDD3", lateFeePerDay: 40,
    status: "deposit_released",
    depositReleaseAmount: 600, depositRefundProcessed: false,
    releaseReason: "returned in good condition",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysUntilReturn(returnDate: Date): number {
  return Math.ceil((returnDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountdownBadge(days: number) {
  if (days < 0) return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 3) return { bg: "#FFF8E1", text: "#E65100", label: `Due in ${days} day${days !== 1 ? "s" : ""}` };
  return { bg: "#E8F5E9", text: "#2D6A4F", label: `Due in ${days} days` };
}

function getWindowDeadline(returnNotedAt: Date): Date {
  return addBusinessDays(returnNotedAt, RETURN_REVIEW_WINDOW_DAYS);
}

function daysLeftInWindow(returnNotedAt: Date): number {
  const deadline = getWindowDeadline(returnNotedAt);
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ── Damage claim drawer state ─────────────────────────────────────────────────

interface ClaimDraft {
  photos: string[];        // Cloudinary URLs
  description: string;
  retainAmount: string;    // dollars as string (user input)
}

const EMPTY_DRAFT: ClaimDraft = { photos: [], description: "", retainAmount: "" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellerRentalsPage() {
  const [rentals, setRentals] = useState<SellerRental[]>(MOCK_RENTALS);

  // Review-return drawer
  const [drawer, setDrawer] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Damage claim sub-view inside the drawer
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDraft, setClaimDraft] = useState<ClaimDraft>(EMPTY_DRAFT);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const active         = rentals.filter(r => r.status === "active");
  const awaitingAction = rentals.filter(r => r.status === "return_pending");
  const past           = rentals.filter(r =>
    r.status === "deposit_released" || r.status === "deposit_resolved" || r.status === "damage_claimed"
  );

  const drawerRental = rentals.find(r => r.id === drawer);

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
      if (!res.ok) {
        const { error } = await res.json();
        setConfirmError(error ?? "Something went wrong.");
        return;
      }
      setRentals(prev => prev.map(r =>
        r.id === orderId
          ? { ...r, status: "deposit_released", depositReleaseAmount: r.deposit, depositRefundProcessed: false, releaseReason: "returned in good condition" }
          : r
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
        reader.onload = () => resolve(reader.result as string);
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
      setClaimDraft(d => ({ ...d, photos: [...d.photos, url] }));
    } catch {
      setClaimError("Photo upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function submitClaim(orderId: string) {
    if (!drawerRental) return;
    const retainCents = Math.round(parseFloat(claimDraft.retainAmount) * 100);
    if (isNaN(retainCents) || retainCents <= 0) {
      setClaimError("Enter a valid amount to retain.");
      return;
    }
    if (retainCents > drawerRental.deposit * 100) {
      setClaimError(`Amount cannot exceed the deposit ($${drawerRental.deposit.toLocaleString()}).`);
      return;
    }
    if (!claimDraft.description.trim()) {
      setClaimError("Description is required.");
      return;
    }
    if (claimDraft.photos.length === 0) {
      setClaimError("At least one photo is required.");
      return;
    }

    setClaimSubmitting(true);
    setClaimError(null);
    try {
      const res = await fetch(`/api/rentals/${orderId}/claim-damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: claimDraft.photos,
          description: claimDraft.description.trim(),
          retainAmount: retainCents,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setClaimError(error ?? "Failed to file claim.");
        return;
      }
      setRentals(prev => prev.map(r =>
        r.id === orderId
          ? {
              ...r,
              status: "damage_claimed",
              damageClaim: {
                photos: claimDraft.photos,
                description: claimDraft.description.trim(),
                retainAmount: retainCents,
              },
            }
          : r
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
          {active.length + awaitingAction.length} active · {awaitingAction.length} awaiting your action
        </p>
      </div>

      {/* Active rentals */}
      {active.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.75rem" }}>
            Out on rental
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {active.map(rental => {
              const days = getDaysUntilReturn(rental.returnByDate);
              const badge = getCountdownBadge(days);
              return (
                <div key={rental.id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", borderLeft: `3px solid ${badge.text}`, padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div style={{ width: "56px", height: "56px", flexShrink: 0, background: rental.color, borderRadius: "2px" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{rental.item}</p>
                          <span style={{ padding: "0.18rem 0.6rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>{badge.label}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: days < 0 ? "0.5rem" : 0 }}>
                          {[
                            { k: "Renter",       v: `@${rental.renter}` },
                            { k: "Period",       v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                            { k: "Daily rate",   v: `$${rental.dailyRate.toLocaleString()}/day` },
                            { k: "Deposit held", v: `$${rental.deposit.toLocaleString()}` },
                          ].map(({ k, v }) => (
                            <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                              <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                            </span>
                          ))}
                        </div>
                        {days < 0 && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#FDECEA", padding: "0.35rem 0.75rem" }}>
                            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#C62828" }}>Late fee accruing</span>
                            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#C62828" }}>
                              ${rental.lateFeePerDay}/day · <strong>${(Math.abs(days) * rental.lateFeePerDay).toLocaleString()} total so far</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Awaiting action — return_pending */}
      {awaitingAction.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.75rem" }}>
            ⚑ Awaiting your confirmation
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {awaitingAction.map(rental => {
              const windowDays = rental.returnNotedAt ? daysLeftInWindow(rental.returnNotedAt) : null;
              return (
                <div key={rental.id} style={{ background: "#fff", border: "1px solid rgba(196,68,10,0.3)", borderLeft: "3px solid #C4440A", padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div style={{ width: "56px", height: "56px", flexShrink: 0, background: rental.color, borderRadius: "2px" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{rental.item}</p>
                          <span style={{ padding: "0.18rem 0.6rem", background: "#FEF3C7", color: "#92400E", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Return pending</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                          {[
                            { k: "Renter",       v: `@${rental.renter}` },
                            { k: "Period",       v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                            { k: "Deposit held", v: `$${rental.deposit.toLocaleString()}` },
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

      {/* Past rentals */}
      {past.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginBottom: "0.75rem" }}>
            Past rentals
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
            {past.map(rental => (
              <div key={rental.id} style={{ background: "var(--cream)", padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.color, borderRadius: "2px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18" }}>{rental.item}</p>
                      <span style={{
                        padding: "0.18rem 0.55rem",
                        background: rental.status === "damage_claimed" ? "#FEF3C7" : rental.status === "deposit_resolved" ? "#EDE9FE" : "#D1FAE5",
                        color: rental.status === "damage_claimed" ? "#92400E" : rental.status === "deposit_resolved" ? "#5B21B6" : "#065F46",
                        fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0,
                      }}>
                        {rental.status === "damage_claimed" ? "Admin reviewing" : rental.status === "deposit_resolved" ? "Resolved" : "Deposit released"}
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6, marginBottom: "0.3rem" }}>
                      @{rental.renter} · {rental.rentalStart} – {rental.rentalEnd}
                    </p>
                    {rental.status === "damage_claimed" && rental.damageClaim && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#92400E" }}>
                        Claim filed — requesting to retain <strong>${(rental.damageClaim.retainAmount / 100).toLocaleString()}</strong> of ${rental.deposit.toLocaleString()} deposit. Admin will review.
                      </p>
                    )}
                    {rental.depositReleaseAmount != null && rental.status !== "damage_claimed" && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52" }}>
                        Deposit of <strong>${rental.depositReleaseAmount.toLocaleString()}</strong> released — {rental.releaseReason}.{" "}
                        <span style={{ color: "#92400E" }}>
                          {rental.depositRefundProcessed ? "Stripe refund processed." : "No money moved yet — Stripe refund pending."}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review return drawer */}
      {drawerRental && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto", maxHeight: "88vh", overflowY: "auto" }}>

            {!showClaimForm ? (
              <>
                <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.4rem" }}>
                  Review return
                </h2>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem" }}>
                  {drawerRental.item} · Deposit: ${drawerRental.deposit.toLocaleString()}
                </p>

                <div style={{ background: "#FEF3C7", padding: "0.75rem 1rem", marginBottom: "1.75rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                    <strong>Confirming good condition</strong> releases the full deposit of ${drawerRental.deposit.toLocaleString()} back to the renter.{" "}
                    <strong>No money moves yet</strong> — Stripe refund is pending.
                  </p>
                </div>

                {confirmError && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{confirmError}</p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    onClick={() => confirmReturn(drawerRental.id)}
                    disabled={confirming}
                    style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", background: confirming ? "var(--warm-tan)" : "var(--burnt-orange)", color: confirming ? "var(--muted)" : "var(--cream)", border: "none", cursor: confirming ? "not-allowed" : "pointer" }}
                  >
                    {confirming ? "Processing…" : `✓ Good condition — release $${drawerRental.deposit.toLocaleString()} deposit`}
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
                  <button
                    onClick={() => { setShowClaimForm(false); setClaimError(null); }}
                    style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    ← Back
                  </button>
                  <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.4rem", color: "#1A1A18", margin: 0 }}>
                    File damage claim
                  </h2>
                </div>

                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.5rem" }}>
                  {drawerRental.item} · Deposit: ${drawerRental.deposit.toLocaleString()}
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
                        <button
                          onClick={() => setClaimDraft(d => ({ ...d, photos: d.photos.filter((_, j) => j !== i) }))}
                          style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", background: "#991B1B", color: "#fff", border: "none", borderRadius: "50%", fontSize: "0.6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {claimDraft.photos.length < 6 && (
                      <label style={{ width: "64px", height: "64px", border: "1px dashed var(--warm-tan)", display: "flex", alignItems: "center", justifyContent: "center", cursor: uploadingPhoto ? "not-allowed" : "pointer", color: "var(--muted)", fontSize: "1.2rem" }}>
                        {uploadingPhoto ? "…" : "+"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={uploadingPhoto}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhoto(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6 }}>
                    Upload up to 6 photos showing the damage.
                  </p>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
                    Description <span style={{ color: "#991B1B" }}>*</span>
                  </p>
                  <textarea
                    rows={4}
                    placeholder="Describe the damage in detail…"
                    value={claimDraft.description}
                    onChange={e => setClaimDraft(d => ({ ...d, description: e.target.value }))}
                    style={{ width: "100%", padding: "0.75rem", background: "#FAF6F1", border: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#1A1A18", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                {/* Retain amount */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6, marginBottom: "0.5rem" }}>
                    Amount to retain from deposit <span style={{ color: "#991B1B" }}>*</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: "#1A1A18" }}>$</span>
                    <input
                      type="number"
                      min={1}
                      max={drawerRental.deposit}
                      step={1}
                      placeholder={`Max $${drawerRental.deposit}`}
                      value={claimDraft.retainAmount}
                      onChange={e => setClaimDraft(d => ({ ...d, retainAmount: e.target.value }))}
                      style={{ flex: 1, padding: "0.65rem 0.75rem", background: "#FAF6F1", border: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "#1A1A18", outline: "none" }}
                    />
                  </div>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6, marginTop: "0.35rem" }}>
                    Cannot exceed the full deposit of ${drawerRental.deposit.toLocaleString()}.
                  </p>
                </div>

                {claimError && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{claimError}</p>
                )}

                <button
                  onClick={() => submitClaim(drawerRental.id)}
                  disabled={claimSubmitting}
                  style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", background: claimSubmitting ? "var(--warm-tan)" : "#991B1B", color: claimSubmitting ? "var(--muted)" : "#fff", border: "none", cursor: claimSubmitting ? "not-allowed" : "pointer" }}
                >
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
