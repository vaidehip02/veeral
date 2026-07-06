"use client";

import { useState } from "react";
import MessageButton from "@/components/messages/MessageButton";

const A = {
  dark: "#0D0906", muted: "#6B5E52", label: "#9C8B7E",
  accent: "#C4440A", card: "#FFFFFF", border: "#EDE6DE", bg: "#FAF6F1",
};
const dark:  React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.dark };
const muted: React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.muted };
const lbl:   React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: A.label,
};

type AdminRentalStatus = "active" | "return_pending" | "damage_claimed" | "deposit_released" | "deposit_resolved";

interface AdminRental {
  id: string; buyer: string; buyerId: string; seller: string; sellerId: string; item: string;
  start: string; end: string; returnBy: Date;
  dailyRate: number; deposit: number; bg: string;
  status: AdminRentalStatus;
  // damage claim fields
  damageClaim?: {
    photos: string[];
    description: string;
    retainAmount: number; // cents
  };
}

const TODAY = new Date("2026-06-24");

const RENTALS: AdminRental[] = [
  { id:"R201", buyer:"ananya_m",    buyerId:"", seller:"priya_sharma", sellerId:"", item:"Mirror-work Lehenga (Bridal)",   start:"Jun 6",  end:"Jun 14", returnBy:new Date("2026-06-14"), dailyRate:160, deposit:80000,  bg:"#D4C5B5", status:"active" },
  { id:"R200", buyer:"kavitha_m",   buyerId:"", seller:"priya_sharma", sellerId:"", item:"Sequin Lehenga — Midnight Blue", start:"Jun 5",  end:"Jun 11", returnBy:new Date("2026-06-11"), dailyRate:95,  deposit:50000,  bg:"#B8BFCC", status:"return_pending" },
  { id:"R198", buyer:"sana.rents",  buyerId:"", seller:"meera_b",      sellerId:"", item:"Gold Tissue Lehenga",            start:"Jun 3",  end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:200, deposit:100000, bg:"#E0DDD8", status:"active" },
  { id:"R195", buyer:"riya.wears",  buyerId:"", seller:"priya_sharma", sellerId:"", item:"Banarasi Silk Lehenga",          start:"May 30", end:"Jun 7",  returnBy:new Date("2026-06-07"), dailyRate:120, deposit:60000,  bg:"#D4C5B5", status:"deposit_released" },
  {
    id:"R192", buyer:"pooja_k", buyerId:"", seller:"meera_b", sellerId:"", item:"Sequin Lehenga", start:"May 28", end:"Jun 9", returnBy:new Date("2026-06-09"), dailyRate:95, deposit:50000, bg:"#B8BFCC",
    status: "damage_claimed",
    damageClaim: {
      photos: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200",
      ],
      description: "There is a 3-inch tear along the hem on the back panel, and a beading section is missing near the waist. The item was returned without the dupatta.",
      retainAmount: 25000, // $250.00
    },
  },
  { id:"R189", buyer:"arjun.style", buyerId:"", seller:"raj_styles", sellerId:"", item:"Navy Sherwani Brocade", start:"May 25", end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:80, deposit:40000, bg:"#C9CDD6", status:"active" },
];

function daysLeft(returnBy: Date): number {
  return Math.ceil((returnBy.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function returnStatusBadge(days: number) {
  if (days < 0)   return { label:`${Math.abs(days)}d overdue`, bg:"#FFF5F5",  text:"#991B1B", border:"#EF4444" };
  if (days === 0) return { label:"Due today",                  bg:"#FEF9C3",  text:"#92400E", border:"#EAB308" };
  if (days <= 2)  return { label:`${days}d left`,              bg:"#FEF3C7",  text:"#92400E", border:"#F59E0B" };
  return               { label:`${days} days left`,            bg:"#D1FAE5",  text:"#065F46", border:"#10B981" };
}

function adminBtn(variant: "red" | "orange" | "dim"): React.CSSProperties {
  const map = {
    red:    { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
    orange: { bg: "rgba(196,68,10,0.1)", color: "#C4440A", border: "rgba(196,68,10,0.25)" },
    dim:    { bg: "#F3F4F6", color: "#9CA3AF", border: A.border },
  };
  const v = map[variant];
  return {
    fontFamily: "var(--font-jost)", fontWeight: 700,
    fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "0.3rem 0.7rem", cursor: "pointer",
    background: v.bg, color: v.color, border: `1px solid ${v.border}`,
  };
}

type Outcome = "release_all" | "retain_part" | "retain_all";

interface ResolveDrawerState {
  rental: AdminRental;
  outcome: Outcome | "";
  retainPartAmount: string; // dollars
  reason: string;
  submitting: boolean;
  error: string | null;
  photoIndex: number;
}

export default function AdminRentalsPage() {
  const [rentals, setRentals] = useState(RENTALS);
  const [resolveDrawer, setResolveDrawer] = useState<ResolveDrawerState | null>(null);

  const damageClaimed = rentals.filter(r => r.status === "damage_claimed");
  const overdue       = rentals.filter(r => r.status === "active" && daysLeft(r.returnBy) < 0);

  function openResolveDrawer(rental: AdminRental) {
    setResolveDrawer({ rental, outcome: "", retainPartAmount: "", reason: "", submitting: false, error: null, photoIndex: 0 });
  }

  async function submitResolution() {
    if (!resolveDrawer) return;
    const { rental, outcome, retainPartAmount, reason } = resolveDrawer;
    if (!outcome) return;

    let retainAmountCents: number | undefined;
    if (outcome === "retain_part") {
      retainAmountCents = Math.round(parseFloat(retainPartAmount) * 100);
      if (isNaN(retainAmountCents) || retainAmountCents <= 0) {
        setResolveDrawer(d => d ? { ...d, error: "Enter a valid retain amount." } : d);
        return;
      }
      if (retainAmountCents >= rental.deposit) {
        setResolveDrawer(d => d ? { ...d, error: `For "retain all", use that option instead. Amount must be less than $${(rental.deposit / 100).toFixed(2)}.` } : d);
        return;
      }
    }
    if (!reason.trim()) {
      setResolveDrawer(d => d ? { ...d, error: "Reason is required." } : d);
      return;
    }

    setResolveDrawer(d => d ? { ...d, submitting: true, error: null } : d);

    try {
      const res = await fetch(`/api/rentals/${rental.id}/resolve-damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, retainAmount: retainAmountCents, reason: reason.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        setResolveDrawer(d => d ? { ...d, submitting: false, error: error ?? "Something went wrong." } : d);
        return;
      }
      setRentals(prev => prev.map(r =>
        r.id === rental.id ? { ...r, status: "deposit_resolved" } : r
      ));
      setResolveDrawer(null);
    } catch {
      setResolveDrawer(d => d ? { ...d, submitting: false, error: "Network error. Please try again." } : d);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Rentals
        </h1>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <p style={{ ...muted, fontSize: "0.78rem" }}>{rentals.length} rentals</p>
          {overdue.length > 0      && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#991B1B" }}>· {overdue.length} overdue</p>}
          {damageClaimed.length > 0 && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#92400E", fontWeight: 700 }}>· {damageClaimed.length} damage claim{damageClaimed.length !== 1 ? "s" : ""} to review</p>}
        </div>
      </div>

      {/* Damage claims — surfaced at top */}
      {damageClaimed.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#991B1B", marginBottom: "0.75rem" }}>
            ⚑ Damage claims requiring review
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {damageClaimed.map(rental => (
              <div key={rental.id} style={{ background: "#FFF5F5", border: "1px solid #FECACA", borderLeft: "3px solid #EF4444", padding: "1.1rem 1.25rem" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <p style={{ ...dark, fontSize: "0.85rem", fontWeight: 600 }}>{rental.item}</p>
                      <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.2rem 0.55rem", background: "#FEE2E2", color: "#991B1B" }}>
                        Damage claimed
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.5rem", marginBottom: "0.75rem" }}>
                      {[
                        { k:"Buyer",   v:`@${rental.buyer}`  },
                        { k:"Seller",  v:`@${rental.seller}` },
                        { k:"Period",  v:`${rental.start} – ${rental.end}` },
                        { k:"Deposit", v:`$${(rental.deposit / 100).toFixed(2)}` },
                      ].map(({ k, v }) => (
                        <span key={k} style={{ ...muted, fontSize: "0.72rem" }}>
                          <span style={{ ...lbl, marginRight: "0.3rem", display: "inline" }}>{k}</span>{v}
                        </span>
                      ))}
                    </div>
                    {rental.damageClaim && (
                      <>
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#991B1B", lineHeight: 1.6, marginBottom: "0.75rem", background: "#FEF2F2", padding: "0.6rem 0.75rem" }}>
                          <strong>Seller&apos;s claim:</strong> {rental.damageClaim.description}
                        </p>
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem", fontWeight: 700 }}>
                          Requesting to retain: ${(rental.damageClaim.retainAmount / 100).toFixed(2)} of ${(rental.deposit / 100).toFixed(2)} deposit
                        </p>
                        {rental.damageClaim.photos.length > 0 && (
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                            {rental.damageClaim.photos.map((url, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={i} src={url} alt={`Damage photo ${i + 1}`} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "2px", border: "1px solid #FECACA" }} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <button onClick={() => openResolveDrawer(rental)} style={adminBtn("red")}>
                      Resolve claim
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All rentals */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {rentals.filter(r => r.status !== "damage_claimed").map(rental => {
          const days = daysLeft(rental.returnBy);
          const si   = returnStatusBadge(days);
          const statusLabel: Record<AdminRentalStatus, string> = {
            active: "", return_pending: "Return pending",
            damage_claimed: "Damage claimed", deposit_released: "Deposit released", deposit_resolved: "Resolved",
          };
          return (
            <div key={rental.id} style={{
              background: A.card,
              border: `1px solid ${A.border}`,
              borderLeft: `3px solid ${rental.status === "deposit_released" || rental.status === "deposit_resolved" ? "#10B981" : si.border}`,
              padding: "1.1rem 1.25rem",
            }}>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <p style={{ ...dark, fontSize: "0.85rem", fontWeight: 600 }}>{rental.item}</p>
                    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      {rental.status === "active" && (
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.2rem 0.55rem", background: si.bg, color: si.text }}>
                          {si.label}
                        </span>
                      )}
                      {rental.status !== "active" && (
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.2rem 0.55rem", background: "#D1FAE5", color: "#065F46" }}>
                          {statusLabel[rental.status]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.5rem", marginBottom: "0.6rem" }}>
                    {[
                      { k:"Buyer",   v:`@${rental.buyer}`  },
                      { k:"Seller",  v:`@${rental.seller}` },
                      { k:"Period",  v:`${rental.start} – ${rental.end}` },
                      { k:"Rate",    v:`$${rental.dailyRate}/day` },
                      { k:"Deposit", v:`$${(rental.deposit / 100).toFixed(2)}` },
                    ].map(({ k, v }) => (
                      <span key={k} style={{ ...muted, fontSize: "0.72rem" }}>
                        <span style={{ ...lbl, marginRight: "0.3rem", display: "inline" }}>{k}</span>{v}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {rental.status === "active" && days < 0 && <button style={adminBtn("red")}>Escalate</button>}
                    {rental.buyerId && <MessageButton recipientId={rental.buyerId} orderId={rental.id} label="Message buyer" style={{ fontSize: "0.58rem", padding: "0.3rem 0.7rem" }} />}
                    {rental.sellerId && <MessageButton recipientId={rental.sellerId} orderId={rental.id} label="Message seller" style={{ fontSize: "0.58rem", padding: "0.3rem 0.7rem" }} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolve damage claim drawer */}
      {resolveDrawer && (
        <>
          <div onClick={() => !resolveDrawer.submitting && setResolveDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,9,6,0.35)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: A.card, zIndex: 70,
            padding: "2rem", borderTop: `1px solid ${A.border}`,
            maxWidth: "560px", margin: "0 auto",
            maxHeight: "80vh", overflowY: "auto",
            paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 80px))",
            boxShadow: "0 -8px 32px rgba(13,9,6,0.12)",
          }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: A.dark, marginBottom: "0.25rem" }}>
              Resolve damage claim
            </h2>
            <p style={{ ...muted, fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              {resolveDrawer.rental.item} · @{resolveDrawer.rental.buyer} vs @{resolveDrawer.rental.seller}
            </p>

            {/* Claim summary */}
            {resolveDrawer.rental.damageClaim && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ ...lbl, marginBottom: "0.5rem" }}>Seller&apos;s claim</p>
                <div style={{ background: "#FEF2F2", padding: "0.85rem", border: "1px solid #FECACA", marginBottom: "0.75rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#991B1B", lineHeight: 1.65, margin: 0 }}>
                    {resolveDrawer.rental.damageClaim.description}
                  </p>
                </div>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem" }}>
                  Requesting to retain: ${(resolveDrawer.rental.damageClaim.retainAmount / 100).toFixed(2)} of ${(resolveDrawer.rental.deposit / 100).toFixed(2)} deposit
                </p>

                {/* Photos with navigation */}
                {resolveDrawer.rental.damageClaim.photos.length > 0 && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <p style={{ ...lbl, marginBottom: "0.5rem" }}>Photos ({resolveDrawer.rental.damageClaim.photos.length})</p>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveDrawer.rental.damageClaim.photos[resolveDrawer.photoIndex]}
                        alt="Damage"
                        style={{ width: "100%", maxWidth: "320px", height: "220px", objectFit: "cover", display: "block", borderRadius: "2px" }}
                      />
                      {resolveDrawer.rental.damageClaim.photos.length > 1 && (
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", maxWidth: "320px" }}>
                          <button
                            onClick={() => setResolveDrawer(d => d ? { ...d, photoIndex: Math.max(0, d.photoIndex - 1) } : d)}
                            disabled={resolveDrawer.photoIndex === 0}
                            style={{ ...adminBtn("dim"), opacity: resolveDrawer.photoIndex === 0 ? 0.4 : 1 }}
                          >
                            ← Prev
                          </button>
                          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: A.muted, alignSelf: "center" }}>
                            {resolveDrawer.photoIndex + 1} / {resolveDrawer.rental.damageClaim.photos.length}
                          </span>
                          <button
                            onClick={() => setResolveDrawer(d => d ? { ...d, photoIndex: Math.min(d.rental.damageClaim!.photos.length - 1, d.photoIndex + 1) } : d)}
                            disabled={resolveDrawer.photoIndex === resolveDrawer.rental.damageClaim.photos.length - 1}
                            style={{ ...adminBtn("dim"), opacity: resolveDrawer.photoIndex === resolveDrawer.rental.damageClaim.photos.length - 1 ? 0.4 : 1 }}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Outcome selector */}
            <p style={{ ...lbl, marginBottom: "0.75rem" }}>Decision</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {([
                { value: "release_all",  label: "Release full deposit to buyer",          sub: `Return $${(resolveDrawer.rental.deposit / 100).toFixed(2)} to buyer` },
                { value: "retain_part",  label: "Retain part — release remainder to buyer", sub: "You specify how much to retain" },
                { value: "retain_all",   label: "Retain full deposit (seller's claim upheld)", sub: `Keep $${(resolveDrawer.rental.deposit / 100).toFixed(2)} on platform` },
              ] as { value: Outcome; label: string; sub: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setResolveDrawer(d => d ? { ...d, outcome: opt.value } : d)}
                  style={{
                    textAlign: "left", padding: "0.75rem 1rem", cursor: "pointer",
                    background: resolveDrawer.outcome === opt.value ? "rgba(196,68,10,0.08)" : A.bg,
                    border: `1px solid ${resolveDrawer.outcome === opt.value ? A.accent : A.border}`,
                    display: "flex", flexDirection: "column", gap: "0.2rem",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.72rem", color: resolveDrawer.outcome === opt.value ? A.accent : A.dark }}>
                    {opt.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: A.muted }}>
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Retain part — amount input */}
            {resolveDrawer.outcome === "retain_part" && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ ...lbl, marginBottom: "0.5rem" }}>Amount to retain ($)</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "1rem", color: A.dark }}>$</span>
                  <input
                    type="number"
                    min={1}
                    max={(resolveDrawer.rental.deposit / 100) - 0.01}
                    step={0.01}
                    placeholder={`Max $${((resolveDrawer.rental.deposit / 100) - 0.01).toFixed(2)}`}
                    value={resolveDrawer.retainPartAmount}
                    onChange={e => setResolveDrawer(d => d ? { ...d, retainPartAmount: e.target.value } : d)}
                    style={{ flex: 1, padding: "0.65rem 0.75rem", background: A.bg, border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: A.dark, outline: "none" }}
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ ...lbl, marginBottom: "0.5rem" }}>Reason / internal note <span style={{ color: "#991B1B" }}>*</span></p>
              <textarea
                rows={3}
                placeholder="Document your decision for the audit log…"
                value={resolveDrawer.reason}
                onChange={e => setResolveDrawer(d => d ? { ...d, reason: e.target.value } : d)}
                style={{ width: "100%", padding: "0.75rem", background: A.bg, border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark, outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#92400E", lineHeight: 1.6, margin: 0 }}>
                <strong>This moves real money.</strong> Confirming will immediately refund the renter and (if the seller has a connected Stripe account) transfer any retained amount to the seller. Any applicable late fee is deducted automatically. The action is logged to the admin audit log.
              </p>
            </div>

            {resolveDrawer.error && (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{resolveDrawer.error}</p>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={submitResolution}
                disabled={resolveDrawer.submitting || !resolveDrawer.outcome}
                style={{
                  flex: 1, padding: "0.75rem",
                  fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.68rem",
                  letterSpacing: "0.16em", textTransform: "uppercase",
                  background: resolveDrawer.submitting || !resolveDrawer.outcome ? "#F3F4F6" : A.accent,
                  color: resolveDrawer.submitting || !resolveDrawer.outcome ? "#D1D5DB" : "#fff",
                  border: "none", cursor: resolveDrawer.submitting || !resolveDrawer.outcome ? "not-allowed" : "pointer",
                }}
              >
                {resolveDrawer.submitting ? "Saving…" : "Confirm resolution"}
              </button>
              <button
                onClick={() => setResolveDrawer(null)}
                disabled={resolveDrawer.submitting}
                style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: A.muted, border: `1px solid ${A.border}`, cursor: "pointer" }}
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
