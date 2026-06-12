"use client";

import { useState } from "react";

const TODAY = new Date("2026-06-11");

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

interface AdminRental {
  id: string; buyer: string; seller: string; item: string;
  start: string; end: string; returnBy: Date;
  dailyRate: number; deposit: number; bg: string;
  dispute: boolean; disputeNote?: string;
}

const RENTALS: AdminRental[] = [
  { id:"R201", buyer:"ananya_m",    seller:"priya_sharma", item:"Mirror-work Lehenga (Bridal)",   start:"Jun 6",  end:"Jun 14", returnBy:new Date("2026-06-14"), dailyRate:160, deposit:800,  bg:"#D4C5B5", dispute:false },
  { id:"R200", buyer:"kavitha_m",   seller:"priya_sharma", item:"Sequin Lehenga — Midnight Blue", start:"Jun 5",  end:"Jun 11", returnBy:new Date("2026-06-11"), dailyRate:95,  deposit:500,  bg:"#B8BFCC", dispute:false },
  { id:"R198", buyer:"sana.rents",  seller:"meera_b",      item:"Gold Tissue Lehenga",            start:"Jun 3",  end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:200, deposit:1000, bg:"#E0DDD8", dispute:false },
  { id:"R195", buyer:"riya.wears",  seller:"priya_sharma", item:"Banarasi Silk Lehenga",          start:"May 30", end:"Jun 7",  returnBy:new Date("2026-06-07"), dailyRate:120, deposit:600,  bg:"#D4C5B5", dispute:false },
  { id:"R192", buyer:"pooja_k",     seller:"meera_b",      item:"Sequin Lehenga",                 start:"May 28", end:"Jun 9",  returnBy:new Date("2026-06-09"), dailyRate:95,  deposit:500,  bg:"#B8BFCC", dispute:true,  disputeNote:"Buyer claims damage pre-existing. Seller disputes." },
  { id:"R189", buyer:"arjun.style", seller:"raj_styles",   item:"Navy Sherwani Brocade",          start:"May 25", end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:80,  deposit:400,  bg:"#C9CDD6", dispute:false },
];

function daysLeft(returnBy: Date): number {
  return Math.ceil((returnBy.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function statusInfo(days: number) {
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
    background: v.bg, color: v.color, border: `1px solid ${v.border}`, transition: "all 0.15s",
  };
}

export default function AdminRentalsPage() {
  const [rentals,     setRentals]     = useState(RENTALS);
  const [disputeOpen, setDisputeOpen] = useState<AdminRental | null>(null);
  const [resolution,  setResolution]  = useState("");

  const resolveDispute = () => {
    if (!disputeOpen) return;
    setRentals(prev => prev.map(r => r.id === disputeOpen.id ? { ...r, dispute: false } : r));
    setDisputeOpen(null);
    setResolution("");
  };

  const overdue  = rentals.filter(r => daysLeft(r.returnBy) < 0);
  const disputes = rentals.filter(r => r.dispute);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Rentals
        </h1>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <p style={{ ...muted, fontSize: "0.78rem" }}>{rentals.length} active rentals</p>
          {overdue.length > 0  && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#991B1B" }}>· {overdue.length} overdue</p>}
          {disputes.length > 0 && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#92400E" }}>· {disputes.length} open dispute{disputes.length !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {rentals.map(rental => {
          const days = daysLeft(rental.returnBy);
          const si   = statusInfo(days);
          return (
            <div key={rental.id} style={{
              background: rental.dispute ? "#FFFBEB" : A.card,
              border: `1px solid ${rental.dispute ? "#FDE68A" : A.border}`,
              borderLeft: `3px solid ${si.border}`,
              padding: "1.1rem 1.25rem",
            }}>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <p style={{ ...dark, fontSize: "0.85rem", fontWeight: 600 }}>{rental.item}</p>
                    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700,
                        fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.2rem 0.55rem", background: si.bg, color: si.text }}>
                        {si.label}
                      </span>
                      {rental.dispute && (
                        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700,
                          fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                          padding: "0.2rem 0.55rem", background: "#FEF3C7", color: "#92400E" }}>
                          Dispute open
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
                      { k:"Deposit", v:`$${rental.deposit}` },
                    ].map(({ k, v }) => (
                      <span key={k} style={{ ...muted, fontSize: "0.72rem" }}>
                        <span style={{ ...lbl, marginRight: "0.3rem", display: "inline" }}>{k}</span>{v}
                      </span>
                    ))}
                  </div>
                  {rental.dispute && rental.disputeNote && (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                      color: "#92400E", background: "#FEF9C3",
                      padding: "0.5rem 0.75rem", borderLeft: "2px solid #EAB308",
                      marginBottom: "0.6rem", lineHeight: 1.6 }}>
                      {rental.disputeNote}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {days < 0 && <button style={adminBtn("red")}>Escalate</button>}
                    {rental.dispute && (
                      <button onClick={() => { setDisputeOpen(rental); setResolution(""); }} style={adminBtn("orange")}>
                        Resolve dispute
                      </button>
                    )}
                    <button style={adminBtn("dim")}>Message buyer</button>
                    <button style={adminBtn("dim")}>Message seller</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispute drawer */}
      {disputeOpen && (
        <>
          <div onClick={() => setDisputeOpen(null)} style={{ position: "fixed", inset: 0, background: "rgba(13,9,6,0.3)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: A.card, zIndex: 70,
            padding: "2rem", borderTop: `1px solid ${A.border}`,
            maxWidth: "520px", margin: "0 auto",
            maxHeight: "80vh", overflowY: "auto",
            boxShadow: "0 -8px 32px rgba(13,9,6,0.1)",
          }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: A.dark, marginBottom: "0.25rem" }}>
              Resolve dispute
            </h2>
            <p style={{ ...muted, fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              {disputeOpen.item} · @{disputeOpen.buyer} vs @{disputeOpen.seller}
            </p>
            {disputeOpen.disputeNote && (
              <div style={{ padding: "0.85rem", background: "#FEF9C3", border: `1px solid #FDE68A`, marginBottom: "1.5rem" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#92400E", lineHeight: 1.65 }}>
                  {disputeOpen.disputeNote}
                </p>
              </div>
            )}
            <p style={{ ...lbl, marginBottom: "0.75rem" }}>Resolution</p>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              {["Release deposit to buyer","Release deposit to seller","Split deposit 50/50","Escalate to manual review"].map(opt => (
                <button key={opt} onClick={() => setResolution(opt)} style={{
                  fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.1em",
                  padding: "0.45rem 0.9rem", cursor: "pointer",
                  background: resolution === opt ? "rgba(196,68,10,0.1)" : "#F3F4F6",
                  color: resolution === opt ? A.accent : A.muted,
                  border: `1px solid ${resolution === opt ? "rgba(196,68,10,0.25)" : A.border}`,
                  transition: "all 0.15s" }}>
                  {opt}
                </button>
              ))}
            </div>
            <textarea placeholder="Add an internal note (optional)…" rows={3}
              style={{ width: "100%", padding: "0.75rem", background: A.bg, border: `1px solid ${A.border}`,
                fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark,
                outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "1.25rem" }}
              onFocus={e => (e.target.style.borderColor = A.accent)}
              onBlur={e => (e.target.style.borderColor = A.border)}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={resolveDispute} disabled={!resolution} style={{
                flex: 1, padding: "0.75rem",
                fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.68rem",
                letterSpacing: "0.16em", textTransform: "uppercase",
                background: resolution ? A.accent : "#F3F4F6",
                color: resolution ? "#fff" : "#D1D5DB",
                border: "none", cursor: resolution ? "pointer" : "not-allowed" }}>
                Confirm resolution
              </button>
              <button onClick={() => setDisputeOpen(null)} style={{
                padding: "0.75rem 1.25rem",
                fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.68rem",
                letterSpacing: "0.14em", textTransform: "uppercase",
                background: "transparent", color: A.muted, border: `1px solid ${A.border}`, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
