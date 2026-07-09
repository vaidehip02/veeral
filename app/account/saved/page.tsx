"use client";

import { useState } from "react";
import Link from "next/link";

interface SavedItem {
  id: string;
  title: string;
  price: number;
  rent_price?: number;
  seller: string;
  bg: string;
  available: boolean;
}

const INITIAL_SAVED: SavedItem[] = [
  { id:"10", title:"Gold Tissue Lehenga",                      price:5100, rent_price:200, seller:"priya_sharma",  bg:"#E0DDD8", available:true  },
  { id:"7",  title:"Sequin Lehenga — Midnight Blue",           price:2200, rent_price:95,  seller:"priya_sharma",  bg:"#B8BFCC", available:true  },
  { id:"15", title:"Organza Lehenga — Blush",                  price:1850, rent_price:85,  seller:"meera_b",       bg:"#E0CECC", available:true  },
  { id:"6",  title:"Blue Banarasi Silk Saree",                 price:1200,                 seller:"priya_sharma",  bg:"#C3B5A8", available:false },
  { id:"17", title:"Indo-Western Jumpsuit — Emerald",          price:490,                  seller:"ananya_m",      bg:"#B5C4B1", available:true  },
  { id:"14", title:"Yellow Bandhani Saree",                    price:340,                  seller:"kavitha_wears", bg:"#E5DCC6", available:false },
];

export default function SavedItemsPage() {
  const [items, setItems] = useState(INITIAL_SAVED);

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem",
        }}>
          Saved Items
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
            Nothing saved yet
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
            Heart any listing to save it here
          </p>
          <Link
            href="/listings"
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "0.65rem 1.4rem", textDecoration: "none",
              background: "var(--burnt-orange)", color: "var(--cream)",
            }}
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div
          className="saved-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.1rem" }}
        >
          {items.map(item => (
            <div
              key={item.id}
              style={{
                background: "#fff", border: "1px solid var(--warm-tan)",
                overflow: "hidden", position: "relative",
              }}
            >
              {/* Photo */}
              <div style={{ aspectRatio: "3/4", background: item.bg, position: "relative" }}>
                {/* Remove button */}
                <button
                  onClick={() => remove(item.id)}
                  title="Remove from saved"
                  style={{
                    position: "absolute", top: "0.6rem", right: "0.6rem",
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "0.8rem",
                    color: "#C4440A", transition: "background 0.15s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#fff")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
                >
                  ♥
                </button>

                {/* Unavailable overlay */}
                {!item.available && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(26,26,24,0.6)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "0.6rem",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase",
                      color: "#fff", textAlign: "center",
                    }}>
                      No longer available
                    </p>
                    <Link
                      href="/listings"
                      style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "0.35rem 0.75rem",
                        background: "transparent", color: "#fff",
                        border: "1px solid rgba(255,255,255,0.6)",
                        textDecoration: "none", transition: "border-color 0.15s",
                      }}
                    >
                      Shop similar
                    </Link>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "0.8rem 0.9rem" }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontWeight: 500,
                  fontSize: "0.82rem", color: item.available ? "#1A1A18" : "#999",
                  lineHeight: 1.35, marginBottom: "0.35rem",
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {item.title}
                </p>

                {item.available ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem", color: "#C4440A" }}>
                      ${item.price.toLocaleString()}
                    </span>
                    {item.rent_price && (
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.7 }}>
                        · ${item.rent_price}/day
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#999", marginBottom: "0.35rem" }}>
                    —
                  </p>
                )}

                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.55 }}>
                  @{item.seller}
                </p>
              </div>

              {/* View listing link — only if available */}
              {item.available && (
                <Link
                  href={`/listings/${item.id}`}
                  style={{
                    display: "block", padding: "0.55rem",
                    borderTop: "1px solid var(--warm-tan)",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase",
                    color: "var(--muted)", textAlign: "center", textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = "var(--burnt-orange)"; e.currentTarget.style.color = "var(--cream)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                >
                  View listing
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .saved-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}
