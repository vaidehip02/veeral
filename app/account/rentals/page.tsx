"use client";

import { useState } from "react";

const TODAY = new Date("2026-06-11");

interface BuyerRental {
  id: string;
  item: string;
  seller: string;
  rentalStart: string;
  rentalEnd: string;
  returnBy: Date;
  dailyRate: number;
  deposit: number;
  bg: string;
  active: boolean;
}

const MOCK_RENTALS: BuyerRental[] = [
  {
    id:"R201", item:"Mirror-work Lehenga (Bridal)", seller:"priya_sharma",
    rentalStart:"Jun 6, 2026", rentalEnd:"Jun 14, 2026",
    returnBy: new Date("2026-06-14"), dailyRate:160, deposit:800, bg:"#D4C5B5", active:true,
  },
  {
    id:"R188", item:"Gold Tissue Lehenga",           seller:"priya_sharma",
    rentalStart:"May 1, 2026",  rentalEnd:"May 8, 2026",
    returnBy: new Date("2026-05-08"), dailyRate:200, deposit:1000, bg:"#E0DDD8", active:false,
  },
  {
    id:"R175", item:"Sequin Lehenga — Midnight Blue", seller:"priya_sharma",
    rentalStart:"Apr 10, 2026", rentalEnd:"Apr 16, 2026",
    returnBy: new Date("2026-04-16"), dailyRate:95, deposit:500, bg:"#B8BFCC", active:false,
  },
];

function getDaysLeft(returnBy: Date): number {
  return Math.ceil((returnBy.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function getReturnColor(days: number) {
  if (days < 0)  return { bg:"#FDECEA", text:"#C62828", border:"#C62828", label:`${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 2) return { bg:"#FFF8E1", text:"#E65100", border:"#E65100", label:`${days} day${days !== 1 ? "s" : ""} left` };
  return           { bg:"#E8F5E9", text:"#2D6A4F", border:"#2D6A4F", label:`${days} days left` };
}

export default function BuyerRentalsPage() {
  const [instructionsId, setInstructionsId] = useState<string | null>(null);

  const active = MOCK_RENTALS.filter(r => r.active);
  const past   = MOCK_RENTALS.filter(r => !r.active);

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem",
        }}>
          Rentals
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {active.length} active rental{active.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Active rentals */}
      {active.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem",
          fontFamily: "var(--font-jost)", fontSize: "0.85rem",
          color: "var(--muted)", opacity: 0.5,
        }}>
          No active rentals right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
          {active.map(rental => {
            const days  = getDaysLeft(rental.returnBy);
            const color = getReturnColor(days);
            return (
              <div
                key={rental.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--warm-tan)",
                  borderLeft: `3px solid ${color.border}`,
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  {/* Thumbnail */}
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + countdown */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>
                        {rental.item}
                      </p>
                      <span style={{
                        padding: "0.22rem 0.65rem",
                        background: color.bg, color: color.text,
                        fontFamily: "var(--font-jost)", fontWeight: 700,
                        fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        flexShrink: 0,
                      }}>
                        {color.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                      {[
                        { k:"Seller",      v:`@${rental.seller}` },
                        { k:"Period",      v:`${rental.rentalStart} – ${rental.rentalEnd}` },
                        { k:"Rate",        v:`$${rental.dailyRate}/day` },
                        { k:"Deposit",     v:`$${rental.deposit}` },
                      ].map(({ k, v }) => (
                        <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                          <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.6rem" }}>{k} </span>
                          {v}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => setInstructionsId(rental.id)}
                      style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "0.4rem 0.9rem",
                        background: "transparent", color: "var(--muted)",
                        border: "1px solid var(--warm-tan)", cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
                      onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
                    >
                      Return instructions
                    </button>
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
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--muted)", opacity: 0.55, marginBottom: "1rem",
          }}>
            Past rentals
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
            {past.map(rental => (
              <div key={rental.id} style={{ background: "var(--cream)", padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", flexShrink: 0, background: rental.bg, borderRadius: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18", marginBottom: "0.2rem" }}>
                      {rental.item}
                    </p>
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6 }}>
                      @{rental.seller} · {rental.rentalStart} – {rental.rentalEnd}
                    </p>
                  </div>
                  <span style={{
                    padding: "0.18rem 0.55rem",
                    background: "#F5F5F5", color: "#555",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    flexShrink: 0,
                  }}>
                    Returned
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return instructions drawer */}
      {instructionsId && (
        <>
          <div onClick={() => setInstructionsId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--cream)", zIndex: 70,
            padding: "2rem", borderTop: "1px solid var(--warm-tan)",
            maxWidth: "520px", margin: "0 auto",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.5rem", color: "#1A1A18", marginBottom: "1.5rem",
            }}>
              How to return your rental
            </h2>

            {[
              { n:1, title:"Pack carefully", body:"Fold the garment gently and use the original garment bag if provided. Do not return without protective packaging." },
              { n:2, title:"Ship within the return window", body:"Drop off at any USPS, UPS, or FedEx location before your return date. Keep your receipt." },
              { n:3, title:"Share your tracking number", body:"Message the seller your tracking number through the Messages tab so they know it's on the way." },
              { n:4, title:"Deposit release", body:"Your deposit will be released within 2–3 business days after the seller confirms the item is returned in good condition." },
            ].map(step => (
              <div key={step.n} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: "rgba(201,92,26,0.1)", color: "var(--burnt-orange)",
                  fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {step.n}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18", marginBottom: "0.2rem" }}>
                    {step.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, lineHeight: 1.65 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={() => setInstructionsId(null)}
              style={{
                width: "100%", padding: "0.75rem",
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase",
                background: "var(--burnt-orange)", color: "var(--cream)",
                border: "none", cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
