"use client";

import { useState } from "react";

const SUMMARY = [
  { label: "Total earned to date", value: "$42,500", sub: "across 12 transactions" },
  { label: "Pending payouts",      value: "$18,900", sub: "2 sales awaiting release" },
];

const PAYOUT_HISTORY = [
  { date: "Jun 7, 2026",  item: "Zardozi Saree — Ivory & Gold",   type: "Sale",   net: 10800 },
  { date: "Jun 2, 2026",  item: "Indo-Western Sherwani Set",       type: "Sale",   net: 8550  },
  { date: "May 28, 2026", item: "Embroidered Chanderi Saree",      type: "Sale",   net: 7020  },
  { date: "May 22, 2026", item: "Mirror-work Lehenga (Rental)",    type: "Rental", net: 21600 },
  { date: "May 14, 2026", item: "Silk Sharara Set",                type: "Sale",   net: 7740  },
  { date: "May 5, 2026",  item: "Banarasi Silk Lehenga (Rental)",  type: "Rental", net: 9000  },
];

export default function EarningsPage() {
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  async function handleConnectStripe() {
    setConnecting(true);
    setConnectError("");
    try {
      const res  = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectError(data.error ?? "Failed to start Stripe onboarding");
        setConnecting(false);
      }
    } catch {
      setConnectError("Something went wrong. Please try again.");
      setConnecting(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem"
        }}>
          Earnings
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          Your financial summary and payout history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: "2.5rem" }}>
        {SUMMARY.map((card) => (
          <div key={card.label} style={{
            background: "#fff", border: "1px solid var(--warm-tan)",
            padding: "1.4rem 1.25rem", borderRadius: "2px",
          }}>
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.62rem", fontWeight: 600,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--burnt-orange)", marginBottom: "0.6rem"
            }}>
              {card.label}
            </p>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "2rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1, marginBottom: "0.3rem"
            }}>
              {card.value}
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.65 }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Bank note */}
      <div style={{
        background: "rgba(201,92,26,0.06)", border: "1px solid rgba(201,92,26,0.2)",
        padding: "1rem 1.25rem", marginBottom: "2.5rem",
        display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--burnt-orange)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", flex: 1 }}>
          Payouts go to your connected bank account via Stripe.{" "}
          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            style={{
              background: "none", border: "none", padding: 0, cursor: connecting ? "not-allowed" : "pointer",
              color: "var(--burnt-orange)", textDecoration: "underline", textUnderlineOffset: "2px",
              fontFamily: "var(--font-jost)", fontSize: "0.78rem", opacity: connecting ? 0.6 : 1,
            }}
          >
            {connecting ? "Redirecting…" : "Update bank details"}
          </button>
        </p>
        {connectError && (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#C62828", width: "100%" }}>
            {connectError}
          </p>
        )}
      </div>

      {/* Payout history */}
      <div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1.25rem"
        }}>
          Payout history
        </p>

        {/* Table header */}
        <div className="hidden md:grid" style={{
          gridTemplateColumns: "110px 1fr 80px 110px",
          padding: "0.6rem 1rem",
          borderBottom: "2px solid var(--warm-tan)",
          fontFamily: "var(--font-jost)", fontWeight: 600,
          fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--muted)", opacity: 0.6,
        }}>
          <span>Date</span>
          <span>Item</span>
          <span>Type</span>
          <span style={{ textAlign: "right" }}>Net payout</span>
        </div>

        {PAYOUT_HISTORY.map((row, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--warm-tan)" }}>
            {/* Desktop row */}
            <div className="hidden md:grid items-center" style={{
              gridTemplateColumns: "110px 1fr 80px 110px",
              padding: "0.9rem 1rem",
              background: i % 2 === 0 ? "#fff" : "transparent",
              gap: "0.5rem",
            }}>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", opacity: 0.6 }}>
                {row.date}
              </span>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", fontWeight: 500, color: "#1A1A18" }}>
                {row.item}
              </span>
              <span style={{
                display: "inline-block", width: "fit-content",
                padding: "0.15rem 0.5rem",
                background: row.type === "Rental" ? "#E3F2FD" : "#F5F5F5",
                color: row.type === "Rental" ? "#1D4E89" : "#555",
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                borderRadius: "2px",
              }}>
                {row.type}
              </span>
              <span style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "1rem", fontWeight: 500, color: "#2D6A4F", textAlign: "right"
              }}>
                ${row.net.toLocaleString()}
              </span>
            </div>

            {/* Mobile row */}
            <div className="md:hidden" style={{ padding: "0.9rem 0", background: i % 2 === 0 ? "#fff" : "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#1A1A18" }}>
                    {row.item}
                  </p>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.6 }}>
                    {row.date} · {row.type}
                  </p>
                </div>
                <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "#2D6A4F" }}>
                  ${row.net.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Total row */}
        <div className="hidden md:grid" style={{
          gridTemplateColumns: "110px 1fr 80px 110px",
          padding: "1rem 1rem",
          borderTop: "2px solid var(--warm-tan)",
          background: "rgba(201,92,26,0.04)",
          gap: "0.5rem",
        }}>
          <span />
          <span style={{
            fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.7rem",
            letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)"
          }}>
            Total
          </span>
          <span />
          <span style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic",
            fontSize: "1.1rem", color: "#2D6A4F", textAlign: "right", fontWeight: 500
          }}>
            ${PAYOUT_HISTORY.reduce((s, r) => s + r.net, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
