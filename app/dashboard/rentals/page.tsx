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
  returnNotedAt?: Date;       // set when buyer marks returned
  depositReleaseAmount?: number;
  depositRefundProcessed?: boolean;
  releaseReason?: string;
  color: string;
  lateFeePerDay: number;
  status: RentalStatus;
}

// ── Mock data (replace with Supabase fetch) ───────────────────────────────────

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
    returnNotedAt: new Date("2026-06-12"), // buyer marked returned 1 day late
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellerRentalsPage() {
  const [rentals, setRentals] = useState<SellerRental[]>(MOCK_RENTALS);
  const [drawer, setDrawer] = useState<string | null>(null); // orderId
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const active       = rentals.filter(r => r.status === "active");
  const awaitingAction = rentals.filter(r => r.status === "return_pending");
  const past         = rentals.filter(r =>
    r.status === "deposit_released" || r.status === "deposit_resolved" || r.status === "damage_claimed"
  );

  const drawerRental = rentals.find(r => r.id === drawer);

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
      const rental = rentals.find(r => r.id === orderId);
      setRentals(prev => prev.map(r =>
        r.id === orderId
          ? { ...r, status: "deposit_released", depositReleaseAmount: r.deposit, depositRefundProcessed: false, releaseReason: "returned in good condition" }
          : r
      ));
      setDrawer(null);
      void rental; // used above
    } catch {
      setConfirmError("Network error. Please try again.");
    } finally {
      setConfirming(false);
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
                            { k: "Renter",      v: `@${rental.renter}` },
                            { k: "Period",      v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                            { k: "Daily rate",  v: `$${rental.dailyRate.toLocaleString()}/day` },
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
                            { k: "Renter",      v: `@${rental.renter}` },
                            { k: "Period",      v: `${rental.rentalStart} – ${rental.rentalEnd}` },
                            { k: "Deposit held", v: `$${rental.deposit.toLocaleString()}` },
                          ].map(({ k, v }) => (
                            <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                              <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>{v}
                            </span>
                          ))}
                        </div>
                        {windowDays !== null && (
                          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: windowDays <= 1 ? "#991B1B" : "#92400E", marginBottom: "0" }}>
                            {windowDays > 0
                              ? `You have ${windowDays} business day${windowDays !== 1 ? "s" : ""} to inspect. After that the deposit auto-releases to the renter.`
                              : "Review window has lapsed — deposit will auto-release on the next scheduled run."}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setDrawer(rental.id); setConfirmError(null); }}
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
                      <span style={{ padding: "0.18rem 0.55rem", background: "#D1FAE5", color: "#065F46", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
                        {rental.status === "damage_claimed" ? "Damage claim" : "Deposit released"}
                      </span>
                    </div>
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6, marginBottom: rental.depositReleaseAmount != null ? "0.3rem" : 0 }}>
                      @{rental.renter} · {rental.rentalStart} – {rental.rentalEnd}
                    </p>
                    {rental.depositReleaseAmount != null && (
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
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--cream)", zIndex: 70, padding: "2rem", borderTop: "1px solid var(--warm-tan)", maxWidth: "520px", margin: "0 auto", maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.4rem" }}>
              Review return
            </h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem" }}>
              {drawerRental.item} · Deposit: ${drawerRental.deposit.toLocaleString()}
            </p>

            <div style={{ background: "#FEF3C7", padding: "0.75rem 1rem", marginBottom: "1.75rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                <strong>Confirming good condition</strong> releases the full deposit of ${drawerRental.deposit.toLocaleString()} back to the renter.
                The deposit of ${drawerRental.deposit.toLocaleString()} will be recorded as released.{" "}
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
                onClick={() => setDrawer(null)}
                style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>

            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.68rem", color: "var(--muted)", opacity: 0.55, marginTop: "1rem", lineHeight: 1.6, textAlign: "center" }}>
              If the item was damaged, you&apos;ll be able to file a damage claim from this screen in the next update.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
