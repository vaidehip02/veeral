"use client";

import Link from "next/link";

const STAT_CARDS = [
  { label: "Total earnings", value: "$42,500", sub: "across 12 sales" },
  { label: "Active listings", value: "8", sub: "3 for rent, 5 for sale" },
  { label: "Pending orders", value: "2", sub: "awaiting shipment" },
  { label: "Active rentals", value: "1", sub: "return due Jun 14" },
];

const QUICK_ACTIONS = [
  { label: "Create new listing", href: "/dashboard/listings/new", primary: true },
  { label: "View all orders", href: "/dashboard/orders", primary: false },
  { label: "View all rentals", href: "/dashboard/rentals", primary: false },
];

const ACTIVITY = [
  { icon: "✦", label: "New order received", detail: "Ananya M. purchased Banarasi Silk Lehenga", time: "2h ago", color: "#2D6A4F" },
  { icon: "↗", label: "Item shipped", detail: "Tracking added for Zardozi Saree (Order #1042)", time: "Yesterday", color: "var(--burnt-orange)" },
  { icon: "↩", label: "Rental returned", detail: "Mirror-work Lehenga returned in good condition", time: "2 days ago", color: "#1D4E89" },
  { icon: "$", label: "Payout received", detail: "$8,100 deposited to your bank account", time: "3 days ago", color: "#2D6A4F" },
  { icon: "✦", label: "New order received", detail: "Priya K. purchased Indo-Western Sherwani", time: "4 days ago", color: "#2D6A4F" },
];

const btnBase: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
  padding: "0.65rem 1.4rem", textDecoration: "none", transition: "opacity 0.2s",
  display: "inline-block",
};

export default function DashboardOverview() {
  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Welcome */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1A1A18", lineHeight: 1.1,
          marginBottom: "0.4rem",
        }}>
          Hi, Priya
        </h1>
        <p style={{
          fontFamily: "var(--font-jost)", fontSize: "0.85rem", fontWeight: 400,
          color: "var(--muted)", letterSpacing: "0.04em", opacity: 0.7,
        }}>
          Here&apos;s what&apos;s happening with your shop today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: "2.5rem" }}>
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff", border: "1px solid var(--warm-tan)",
              padding: "1.4rem 1.2rem", borderRadius: "2px",
            }}
          >
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
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.65
            }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "3rem" }}>
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            style={{
              ...btnBase,
              background: a.primary ? "var(--burnt-orange)" : "transparent",
              color: a.primary ? "var(--cream)" : "var(--muted)",
              border: a.primary ? "1px solid var(--burnt-orange)" : "1px solid var(--warm-tan)",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1.25rem"
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
                background: `${item.color === "var(--burnt-orange)" ? "#C95C1A" : item.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                color: item.color, fontWeight: 700,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.8rem", color: "#1A1A18", marginBottom: "0.15rem"
                }}>
                  {item.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                  color: "var(--muted)", opacity: 0.7, letterSpacing: "0.02em"
                }}>
                  {item.detail}
                </p>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.68rem",
                color: "var(--muted)", opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap"
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
