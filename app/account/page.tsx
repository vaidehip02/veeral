"use client";

import Link from "next/link";

const STAT_CARDS = [
  { label: "Active Orders",  value: "2", sub: "1 shipped, 1 processing", href: "/account/orders"   },
  { label: "Active Rentals", value: "1", sub: "return due Jun 14",        href: "/account/rentals"  },
  { label: "Saved Items",    value: "6", sub: "across 4 sellers",          href: "/account/saved"    },
  { label: "Messages",       value: "2", sub: "unread messages",           href: "/account/messages" },
];

const ACTIVITY = [
  { icon: "↗", color: "#1D4E89", label: "Order shipped",       detail: "Your Zardozi Saree is on its way — UPS tracking added",      time: "2h ago"     },
  { icon: "✦", color: "#2D6A4F", label: "Order confirmed",     detail: "Red Bridal Lehenga purchase confirmed by priya_sharma",      time: "Yesterday"  },
  { icon: "♡", color: "#C95C1A", label: "Item saved",          detail: "You saved Gold Tissue Lehenga to your wishlist",             time: "2 days ago" },
  { icon: "↩", color: "#1D4E89", label: "Rental starts today", detail: "Mirror-work Lehenga rental period begins — return by Jun 14",time: "3 days ago" },
  { icon: "$", color: "#2D6A4F", label: "Refund processed",    detail: "$45 refund issued for returned item",                        time: "5 days ago" },
];

export default function AccountOverview() {
  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Welcome */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1A1A18",
          lineHeight: 1.1, marginBottom: "0.4rem",
        }}>
          Hi, Ananya
        </h1>
        <p style={{
          fontFamily: "var(--font-jost)", fontSize: "0.85rem",
          color: "var(--muted)", opacity: 0.7, letterSpacing: "0.04em",
        }}>
          Here&apos;s a look at your recent activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: "2.5rem" }}>
        {STAT_CARDS.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "#fff", border: "1px solid var(--warm-tan)",
                padding: "1.4rem 1.2rem", borderRadius: "2px",
                transition: "box-shadow 0.2s", cursor: "pointer",
              }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)")}
              onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.75rem", fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--burnt-orange)", marginBottom: "0.6rem",
              }}>
                {card.label}
              </p>
              <p style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "2rem", fontWeight: 400, color: "#1A1A18",
                lineHeight: 1, marginBottom: "0.3rem",
              }}>
                {card.value}
              </p>
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.72rem",
                color: "var(--muted)", opacity: 0.65,
              }}>
                {card.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1.25rem",
        }}>
          Recent activity
        </p>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {ACTIVITY.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1rem 0",
                borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--warm-tan)" : "none",
              }}
            >
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: `${item.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontFamily: "var(--font-jost)",
                fontSize: "0.75rem", color: item.color, fontWeight: 700,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.8rem", color: "#1A1A18", marginBottom: "0.15rem",
                }}>
                  {item.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                  color: "var(--muted)", opacity: 0.7, letterSpacing: "0.02em",
                }}>
                  {item.detail}
                </p>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.82rem",
                color: "var(--muted)", opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap",
              }}>
                {item.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
