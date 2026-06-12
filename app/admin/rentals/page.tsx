"use client";

import { useState } from "react";

const TODAY = new Date("2026-06-11");

interface AdminRental {
  id: string;
  buyer: string;
  seller: string;
  item: string;
  start: string;
  end: string;
  returnBy: Date;
  dailyRate: number;
  deposit: number;
  bg: string;
  dispute: boolean;
  disputeNote?: string;
}

const RENTALS: AdminRental[] = [
  { id:"R201", buyer:"ananya_m",    seller:"priya_sharma",  item:"Mirror-work Lehenga (Bridal)",  start:"Jun 6",  end:"Jun 14", returnBy:new Date("2026-06-14"), dailyRate:160, deposit:800,  bg:"#D4C5B5", dispute:false },
  { id:"R200", buyer:"kavitha_m",   seller:"priya_sharma",  item:"Sequin Lehenga — Midnight Blue",start:"Jun 5",  end:"Jun 11", returnBy:new Date("2026-06-11"), dailyRate:95,  deposit:500,  bg:"#B8BFCC", dispute:false },
  { id:"R198", buyer:"sana.rents",  seller:"meera_b",       item:"Gold Tissue Lehenga",           start:"Jun 3",  end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:200, deposit:1000, bg:"#E0DDD8", dispute:false },
  { id:"R195", buyer:"riya.wears",  seller:"priya_sharma",  item:"Banarasi Silk Lehenga",         start:"May 30", end:"Jun 7",  returnBy:new Date("2026-06-07"), dailyRate:120, deposit:600,  bg:"#D4C5B5", dispute:false },
  { id:"R192", buyer:"pooja_k",     seller:"meera_b",       item:"Sequin Lehenga",                start:"May 28", end:"Jun 9",  returnBy:new Date("2026-06-09"), dailyRate:95,  deposit:500,  bg:"#B8BFCC", dispute:true,  disputeNote:"Buyer claims damage pre-existing. Seller disputes." },
  { id:"R189", buyer:"arjun.style", seller:"raj_styles",    item:"Navy Sherwani Brocade",         start:"May 25", end:"Jun 10", returnBy:new Date("2026-06-10"), dailyRate:80,  deposit:400,  bg:"#C9CDD6", dispute:false },
];

function daysLeft(returnBy: Date): number {
  return Math.ceil((returnBy.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function statusInfo(days: number) {
  if (days < 0)  return { label:`${Math.abs(days)}d overdue`, bg:"rgba(198,40,40,0.15)",   text:"#EF9A9A", border:"#C62828" };
  if (days === 0) return { label:"Due today",                  bg:"rgba(230,81,0,0.15)",    text:"#FFAB40", border:"#E65100" };
  if (days <= 2) return { label:`${days}d left`,              bg:"rgba(255,193,7,0.12)",   text:"#FFC107", border:"#E65100" };
  return               { label:`${days} days left`,           bg:"rgba(45,106,79,0.12)",   text:"#81C995", border:"#2D6A4F" };
}

const dark:  React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.9)" };
const muted: React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.4)" };
const lbl:   React.CSSProperties = { fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(250,246,241,0.35)" };

export default function AdminRentalsPage() {
  const [rentals,       setRentals]       = useState(RENTALS);
  const [disputeOpen,   setDisputeOpen]   = useState<AdminRental | null>(null);
  const [resolution,    setResolution]    = useState("");

  const resolveDispute = () => {
    if (!disputeOpen) return;
    setRentals(prev => prev.map(r => r.id === disputeOpen.id ? { ...r, dispute:false } : r));
    setDisputeOpen(null);
    setResolution("");
  };

  const overdue  = rentals.filter(r => daysLeft(r.returnBy) < 0);
  const disputes = rentals.filter(r => r.dispute);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
          Rentals
        </h1>
        <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
          <p style={{ ...muted, fontSize:"0.78rem" }}>{rentals.length} active rentals</p>
          {overdue.length > 0  && <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#EF9A9A" }}>· {overdue.length} overdue</p>}
          {disputes.length > 0 && <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#FFC107" }}>· {disputes.length} open dispute{disputes.length !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {/* Rentals list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {rentals.map(rental => {
          const days = daysLeft(rental.returnBy);
          const si   = statusInfo(days);
          return (
            <div
              key={rental.id}
              style={{
                background: rental.dispute ? "rgba(255,193,7,0.05)" : "rgba(255,255,255,0.03)",
                border:`1px solid ${rental.dispute ? "rgba(255,193,7,0.25)" : "rgba(255,255,255,0.08)"}`,
                borderLeft:`3px solid ${si.border}`,
                padding:"1.1rem 1.25rem",
              }}
            >
              <div style={{ display:"flex", gap:"0.85rem", alignItems:"flex-start" }}>
                {/* Thumbnail */}
                <div style={{ width:"48px", height:"48px", flexShrink:0, background:rental.bg, borderRadius:"2px" }} />

                <div style={{ flex:1, minWidth:0 }}>
                  {/* Title row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.4rem" }}>
                    <p style={{ ...dark, fontSize:"0.85rem", fontWeight:600 }}>{rental.item}</p>
                    <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                      <span style={{
                        fontFamily:"var(--font-jost)", fontWeight:700,
                        fontSize:"0.58rem", letterSpacing:"0.1em", textTransform:"uppercase",
                        padding:"0.2rem 0.55rem",
                        background:si.bg, color:si.text,
                      }}>
                        {si.label}
                      </span>
                      {rental.dispute && (
                        <span style={{
                          fontFamily:"var(--font-jost)", fontWeight:700,
                          fontSize:"0.58rem", letterSpacing:"0.1em", textTransform:"uppercase",
                          padding:"0.2rem 0.55rem",
                          background:"rgba(255,193,7,0.15)", color:"#FFC107",
                        }}>
                          Dispute open
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem 1.5rem", marginBottom:"0.6rem" }}>
                    {[
                      { k:"Buyer",   v:`@${rental.buyer}`    },
                      { k:"Seller",  v:`@${rental.seller}`   },
                      { k:"Period",  v:`${rental.start} – ${rental.end}` },
                      { k:"Rate",    v:`$${rental.dailyRate}/day` },
                      { k:"Deposit", v:`$${rental.deposit}`  },
                    ].map(({ k, v }) => (
                      <span key={k} style={{ ...muted, fontSize:"0.72rem" }}>
                        <span style={{ ...lbl, marginRight:"0.3rem" }}>{k}</span>{v}
                      </span>
                    ))}
                  </div>

                  {/* Dispute note */}
                  {rental.dispute && rental.disputeNote && (
                    <p style={{
                      fontFamily:"var(--font-jost)", fontSize:"0.75rem",
                      color:"#FFC107", opacity:0.8,
                      background:"rgba(255,193,7,0.06)", padding:"0.5rem 0.75rem",
                      borderLeft:"2px solid #FFC107", marginBottom:"0.6rem",
                      lineHeight:1.6,
                    }}>
                      {rental.disputeNote}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                    {days < 0 && (
                      <button style={adminBtn("red")}>Escalate</button>
                    )}
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

      {/* Dispute resolution drawer */}
      {disputeOpen && (
        <>
          <div onClick={() => setDisputeOpen(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:60 }} />
          <div style={{
            position:"fixed", bottom:0, left:0, right:0,
            background:"#1A1410", zIndex:70,
            padding:"2rem", borderTop:"1px solid rgba(255,255,255,0.1)",
            maxWidth:"520px", margin:"0 auto",
            maxHeight:"80vh", overflowY:"auto",
          }}>
            <h2 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"1.5rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
              Resolve dispute
            </h2>
            <p style={{ ...muted, fontSize:"0.75rem", marginBottom:"1.5rem" }}>
              {disputeOpen.item} · @{disputeOpen.buyer} vs @{disputeOpen.seller}
            </p>

            {disputeOpen.disputeNote && (
              <div style={{ padding:"0.85rem", background:"rgba(255,193,7,0.08)", border:"1px solid rgba(255,193,7,0.2)", marginBottom:"1.5rem" }}>
                <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#FFC107", lineHeight:1.65 }}>
                  {disputeOpen.disputeNote}
                </p>
              </div>
            )}

            {/* Quick decisions */}
            <p style={{ ...lbl, marginBottom:"0.75rem" }}>Resolution</p>
            <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
              {[
                "Release deposit to buyer",
                "Release deposit to seller",
                "Split deposit 50/50",
                "Escalate to manual review",
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => setResolution(opt)}
                  style={{
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.62rem", letterSpacing:"0.1em",
                    padding:"0.45rem 0.9rem", cursor:"pointer",
                    background: resolution === opt ? "rgba(201,92,26,0.25)" : "rgba(255,255,255,0.05)",
                    color: resolution === opt ? "var(--burnt-orange)" : "rgba(250,246,241,0.45)",
                    border:`1px solid ${resolution === opt ? "rgba(201,92,26,0.4)" : "rgba(255,255,255,0.1)"}`,
                    transition:"all 0.15s",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Add an internal note (optional)…"
              rows={3}
              style={{
                width:"100%", padding:"0.75rem",
                background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#FAF6F1",
                outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:"1.25rem",
              }}
            />

            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button
                onClick={resolveDispute}
                disabled={!resolution}
                style={{
                  flex:1, padding:"0.75rem",
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.68rem", letterSpacing:"0.16em", textTransform:"uppercase",
                  background: resolution ? "var(--burnt-orange)" : "rgba(255,255,255,0.08)",
                  color: resolution ? "var(--cream)" : "rgba(250,246,241,0.3)",
                  border:"none", cursor: resolution ? "pointer" : "not-allowed",
                }}
              >
                Confirm resolution
              </button>
              <button onClick={() => setDisputeOpen(null)} style={{
                padding:"0.75rem 1.25rem",
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.68rem", letterSpacing:"0.14em", textTransform:"uppercase",
                background:"transparent", color:"rgba(250,246,241,0.4)",
                border:"1px solid rgba(255,255,255,0.1)", cursor:"pointer",
              }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function adminBtn(variant: "red" | "orange" | "dim"): React.CSSProperties {
  const map = {
    red:    { bg:"rgba(198,40,40,0.15)",   color:"#EF9A9A", border:"rgba(198,40,40,0.25)"      },
    orange: { bg:"rgba(201,92,26,0.2)",    color:"var(--burnt-orange)", border:"rgba(201,92,26,0.3)" },
    dim:    { bg:"rgba(255,255,255,0.05)", color:"rgba(250,246,241,0.35)", border:"rgba(255,255,255,0.1)" },
  };
  const v = map[variant];
  return {
    fontFamily:"var(--font-jost)", fontWeight:600,
    fontSize:"0.58rem", letterSpacing:"0.1em", textTransform:"uppercase",
    padding:"0.3rem 0.7rem", cursor:"pointer",
    background:v.bg, color:v.color, border:`1px solid ${v.border}`,
    transition:"all 0.15s",
  };
}
