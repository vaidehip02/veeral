"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RentalDrawerProps {
  listingId: string;
  title: string;
  pricePerDay: number;       // dollars
  salePrice: number;         // dollars — for deposit calc
  maxDays: number;
  careInstructions?: string;
  onClose: () => void;
}

const DEPOSIT_RATE = 0.40;

function formatPrice(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function RentalDrawer({
  listingId, title, pricePerDay, salePrice, maxDays, careInstructions, onClose
}: RentalDrawerProps) {
  const router = useRouter();
  const [days, setDays] = useState(Math.min(3, maxDays));
  const [open, setOpen] = useState(false);

  useEffect(() => { setTimeout(() => setOpen(true), 10); }, []);

  const startDate  = new Date();
  const returnDate = addDays(startDate, days);
  const rentalCost = pricePerDay * days;
  const deposit    = Math.round(salePrice * DEPOSIT_RATE);
  const totalDue   = rentalCost + deposit;

  function handleClose() {
    setOpen(false);
    setTimeout(onClose, 300);
  }

  function handleConfirm() {
    const params = new URLSearchParams({
      type: "rent",
      days: String(days),
      returnDate: returnDate.toISOString(),
    });
    router.push(`/checkout/${listingId}?${params}`);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-jost)", fontWeight: 300,
    fontSize: "0.55rem", letterSpacing: "0.2em",
    textTransform: "uppercase", color: "var(--muted)",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between",
    alignItems: "baseline", padding: "0.7rem 0",
    borderBottom: "1px solid var(--warm-tan)",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(26,20,16,0.45)",
          opacity: open ? 1 : 0, transition: "opacity 0.3s",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(440px, 100vw)",
        background: "var(--cream)",
        borderLeft: "1px solid var(--warm-tan)",
        display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "1.8rem", borderBottom: "1px solid var(--warm-tan)", flexShrink: 0,
        }}>
          <div>
            <p style={labelStyle}>Rental options</p>
            <h3 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
              fontSize: "1.3rem", color: "var(--dark)", marginTop: "0.3rem",
              lineHeight: 1.2,
            }}>
              {title}
            </h3>
          </div>
          <button onClick={handleClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "1.1rem", color: "var(--muted)", flexShrink: 0, marginLeft: "1rem"
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "1.8rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Duration picker */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <span style={labelStyle}>Duration</span>
              <span style={{
                fontFamily: "var(--font-cormorant)", fontWeight: 400,
                fontSize: "1.4rem", color: "var(--dark)"
              }}>
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>

            {/* +/- stepper */}
            <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "0.8rem" }}>
              <button
                onClick={() => setDays(d => Math.max(1, d - 1))}
                disabled={days <= 1}
                style={{
                  width: "44px", height: "44px", border: "1px solid var(--warm-tan)",
                  background: "transparent", cursor: days <= 1 ? "not-allowed" : "pointer",
                  fontSize: "1.2rem", color: days <= 1 ? "var(--warm-tan)" : "var(--dark)",
                  transition: "all 0.15s",
                }}
              >−</button>
              <div style={{
                flex: 1, height: "44px", border: "1px solid var(--warm-tan)",
                borderLeft: "none", borderRight: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-jost)", fontWeight: 400,
                fontSize: "0.9rem", color: "var(--dark)",
              }}>
                {days} {days === 1 ? "day" : "days"}
              </div>
              <button
                onClick={() => setDays(d => Math.min(maxDays, d + 1))}
                disabled={days >= maxDays}
                style={{
                  width: "44px", height: "44px", border: "1px solid var(--warm-tan)",
                  background: "transparent", cursor: days >= maxDays ? "not-allowed" : "pointer",
                  fontSize: "1.2rem", color: days >= maxDays ? "var(--warm-tan)" : "var(--dark)",
                  transition: "all 0.15s",
                }}
              >+</button>
            </div>

            <input
              type="range" min={1} max={maxDays} value={days}
              onChange={e => setDays(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#C4440A" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", color: "var(--warm-tan)" }}>1 day</span>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", color: "var(--warm-tan)" }}>Max {maxDays} days</span>
            </div>
          </div>

          {/* Dates */}
          <div style={{ background: "#EDE8E2", padding: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div>
                <p style={{ ...labelStyle, marginBottom: "0.3rem" }}>Rental starts</p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.78rem", color: "var(--dark)" }}>
                  {fmtDate(startDate)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ ...labelStyle, marginBottom: "0.3rem" }}>Return by</p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", color: "#C4440A" }}>
                  {fmtDate(returnDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div>
            <p style={{ ...labelStyle, marginBottom: "0.5rem" }}>Cost breakdown</p>
            <div style={rowStyle}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.78rem", color: "var(--muted)" }}>
                {formatPrice(pricePerDay)} × {days} days
              </span>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.78rem", color: "var(--dark)" }}>
                {formatPrice(rentalCost)}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.78rem", color: "var(--muted)" }}>
                Security deposit (40% of sale price, refundable)
              </span>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.78rem", color: "var(--dark)" }}>
                {formatPrice(deposit)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "0.8rem" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dark)" }}>
                Total due now
              </span>
              <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "1.6rem", color: "#C4440A" }}>
                {formatPrice(totalDue)}
              </span>
            </div>
          </div>

          {/* Care instructions */}
          {careInstructions && (
            <div style={{ background: "#EDE8E2", padding: "1.2rem" }}>
              <p style={{ ...labelStyle, marginBottom: "0.5rem" }}>Seller care instructions</p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.75rem", lineHeight: 1.7, color: "var(--dark)" }}>
                {careInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ padding: "1.5rem 1.8rem", borderTop: "1px solid var(--warm-tan)", flexShrink: 0 }}>
          <button
            onClick={handleConfirm}
            style={{
              width: "100%", padding: "1rem",
              background: "#C4440A", border: "none", cursor: "pointer",
              fontFamily: "var(--font-jost)", fontWeight: 400,
              fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--cream)", transition: "opacity 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            Confirm rental — {formatPrice(totalDue)}
          </button>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 300,
            fontSize: "0.58rem", letterSpacing: "0.06em",
            color: "var(--muted)", textAlign: "center", marginTop: "0.75rem",
          }}>
            Deposit refunded within 3 days of return
          </p>
        </div>
      </div>
    </>
  );
}
