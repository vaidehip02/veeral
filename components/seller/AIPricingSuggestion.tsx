"use client";

import { useState } from "react";

interface PricingResult {
  saleLow: number;
  saleHigh: number;
  rentLow: number;
  rentHigh: number;
  explanation: string;
}

interface AIPricingSuggestionProps {
  garmentType: string;
  condition: string;
  fabric: string;
  embellishments: string[];
  brand: string;
  onApply: (salePrice: string, rentPrice: string) => void;
}

export default function AIPricingSuggestion({
  garmentType, condition, fabric, embellishments, brand, onApply
}: AIPricingSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<PricingResult | null>(null);
  const [error, setError]     = useState("");
  const [dismissed, setDismissed] = useState(false);

  async function getSuggestion() {
    setLoading(true); setError(""); setResult(null); setDismissed(false);
    try {
      const res  = await fetch("/api/seller/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentType, condition, fabric, embellishments, brand }),
      });
      const data = await res.json();
      if (data.error) setError("Could not generate a suggestion right now.");
      else setResult(data);
    } catch {
      setError("Could not generate a suggestion right now.");
    } finally {
      setLoading(false);
    }
  }

  const canSuggest = garmentType && condition;

  if (dismissed) return null;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {/* Trigger link */}
      {!result && !loading && (
        <button
          type="button"
          onClick={getSuggestion}
          disabled={!canSuggest}
          style={{
            background: "none", border: "none", cursor: canSuggest ? "pointer" : "not-allowed",
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.75rem", letterSpacing: "0.08em",
            color: canSuggest ? "#C4440A" : "var(--warm-tan)",
            textDecoration: canSuggest ? "underline" : "none",
            textUnderlineOffset: "3px", padding: 0,
            transition: "opacity 0.2s", display: "flex", alignItems: "center", gap: "0.35rem"
          }}
          title={!canSuggest ? "Select garment type and condition first" : ""}
        >
          ✦ Get AI pricing suggestion
        </button>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.78rem", color: "var(--muted)", fontStyle: "italic" }}>
          Analysing similar listings…
        </p>
      )}

      {/* Error */}
      {error && (
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.78rem", color: "#C4440A", marginTop: "0.3rem" }}>
          {error}
        </p>
      )}

      {/* Result card */}
      {result && (
        <div style={{
          marginTop: "0.75rem", border: "1px solid rgba(196,68,10,0.25)",
          background: "rgba(196,68,10,0.04)", padding: "1.1rem 1.2rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C4440A" }}>
              ✦ AI Pricing Suggestion
            </p>
            <button
              onClick={() => setDismissed(true)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "var(--muted)", padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem 1.5rem", marginBottom: "0.8rem" }}>
            <div>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2A2118", marginBottom: "0.15rem" }}>
                Sale price
              </p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500, fontSize: "1.3rem", color: "#1A1A18" }}>
                ${result.saleLow.toLocaleString()} – ${result.saleHigh.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2A2118", marginBottom: "0.15rem" }}>
                Rental / day
              </p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500, fontSize: "1.3rem", color: "#1A1A18" }}>
                ${result.rentLow} – ${result.rentHigh}
              </p>
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.8rem", color: "#2A2118", lineHeight: 1.7, marginBottom: "0.9rem" }}>
            {result.explanation}
          </p>

          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.68rem", color: "var(--muted)", fontStyle: "italic", marginBottom: "0.9rem" }}>
            AI suggestions are estimates based on similar listings — not a guarantee of sale price.
          </p>

          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={() => {
                const midSale = Math.round((result.saleLow + result.saleHigh) / 2);
                const midRent = Math.round((result.rentLow + result.rentHigh) / 2);
                onApply(String(midSale), String(midRent));
                setDismissed(true);
              }}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 700,
                fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
                color: "var(--cream)", background: "#C4440A",
                border: "none", padding: "0.6rem 1.2rem", cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Apply midpoint prices
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--muted)", background: "none",
                border: "1px solid var(--warm-tan)", padding: "0.6rem 1rem", cursor: "pointer"
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
