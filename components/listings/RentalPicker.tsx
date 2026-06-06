"use client";

import { useState } from "react";

interface RentalPickerProps {
  pricePerDay: number;
  maxDays: number;
  onClose: () => void;
}

const DEPOSIT_RATE = 0.40; // 40% deposit

function formatPrice(dollars: number) {
  return `$${dollars.toLocaleString("en-US")}`;
}

export default function RentalPicker({ pricePerDay, maxDays, onClose }: RentalPickerProps) {
  const [days, setDays] = useState(3);

  const startDate = new Date();
  const returnDate = new Date();
  returnDate.setDate(startDate.getDate() + days);

  const total = pricePerDay * days;
  const deposit = Math.round(total * DEPOSIT_RATE);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(26,20,16,0.5)", display: "flex",
      alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: "480px", background: "var(--cream)",
          padding: "2rem", borderTop: "1px solid var(--warm-tan)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.8rem" }}>
          <h3 style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
            fontSize: "1.4rem", color: "var(--dark)"
          }}>
            Choose rental duration
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--muted)" }}>✕</button>
        </div>

        {/* Day slider */}
        <div style={{ marginBottom: "1.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
            <label style={{
              fontFamily: "var(--font-jost)", fontWeight: 300,
              fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)"
            }}>
              Duration
            </label>
            <span style={{
              fontFamily: "var(--font-cormorant)", fontWeight: 400,
              fontSize: "1.2rem", color: "var(--dark)"
            }}>
              {days} {days === 1 ? "day" : "days"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={maxDays}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--burnt-orange)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", color: "var(--warm-tan)" }}>1 day</span>
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.55rem", color: "var(--warm-tan)" }}>{maxDays} days</span>
          </div>
        </div>

        {/* Summary */}
        <div style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            ["Rental period", `${fmt(startDate)} → ${fmt(returnDate)}`],
            ["Return by", fmt(returnDate)],
            ["Rental cost", formatPrice(total)],
            ["Refundable deposit (40%)", formatPrice(deposit)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", letterSpacing: "0.05em", color: "var(--muted)" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.78rem", color: "var(--dark)" }}>{value}</span>
            </div>
          ))}
          <div style={{ borderTop: "1px solid var(--warm-tan)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dark)" }}>Total due now</span>
            <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "1.3rem", color: "#C4440A" }}>{formatPrice(Math.round(total + deposit))}</span>
          </div>
        </div>

        <button
          style={{
            width: "100%", padding: "0.95rem",
            background: "#C4440A", border: "none", cursor: "pointer",
            fontFamily: "var(--font-jost)", fontWeight: 400,
            fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--cream)", transition: "opacity 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Confirm rental — {formatPrice(total + deposit)}
        </button>
      </div>
    </div>
  );
}
