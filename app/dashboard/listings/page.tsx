"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "active" | "draft" | "sold" | "rented";

interface MockListing {
  id: string;
  title: string;
  price: number;
  rent_price?: number;
  status: Status;
  image: string;
  category: string;
}

const MOCK_LISTINGS: MockListing[] = [
  { id: "1", title: "Banarasi Silk Lehenga", price: 18000, rent_price: 2500, status: "active", image: "", category: "Lehenga" },
  { id: "2", title: "Zardozi Saree — Ivory & Gold", price: 12000, status: "active", image: "", category: "Saree" },
  { id: "3", title: "Mirror-work Lehenga (Bridal)", price: 35000, rent_price: 4000, status: "rented", image: "", category: "Lehenga" },
  { id: "4", title: "Indo-Western Sherwani Set", price: 9500, status: "sold", image: "", category: "Sherwani" },
  { id: "5", title: "Anarkali Kurta — Sage Green", price: 4200, status: "draft", image: "", category: "Kurta" },
  { id: "6", title: "Embroidered Chanderi Saree", price: 7800, rent_price: 900, status: "active", image: "", category: "Saree" },
  { id: "7", title: "Sequin Lehenga — Midnight Blue", price: 22000, rent_price: 3200, status: "active", image: "", category: "Lehenga" },
  { id: "8", title: "Silk Sharara Set", price: 8600, status: "draft", image: "", category: "Salwar Kameez" },
];

const STATUS_COLORS: Record<Status, { bg: string; text: string; label: string }> = {
  active: { bg: "#E8F5E9", text: "#2D6A4F", label: "Active" },
  draft:  { bg: "#F5F5F5", text: "#666",    label: "Draft" },
  sold:   { bg: "#FFF3E0", text: "#E65100", label: "Sold" },
  rented: { bg: "#E3F2FD", text: "#1D4E89", label: "Rented" },
};

const FILTERS: { label: string; value: Status | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Sold", value: "sold" },
];

export default function ListingsPage() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [deleted, setDeleted] = useState<Set<string>>(new Set());

  const visible = MOCK_LISTINGS.filter(
    (l) => !deleted.has(l.id) && (filter === "all" || l.status === filter)
  );

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
            fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem"
          }}>
            Your Listings
          </h1>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
            {visible.length} listing{visible.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/listings/new"
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
            padding: "0.65rem 1.4rem", textDecoration: "none",
            background: "var(--burnt-orange)", color: "var(--cream)",
            border: "1px solid var(--burnt-orange)", transition: "opacity 0.2s",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          + Create new listing
        </Link>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase",
              padding: "0.4rem 1rem", border: "1px solid",
              borderColor: filter === f.value ? "var(--burnt-orange)" : "var(--warm-tan)",
              background: filter === f.value ? "var(--burnt-orange)" : "transparent",
              color: filter === f.value ? "var(--cream)" : "var(--muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          fontFamily: "var(--font-jost)", color: "var(--muted)", opacity: 0.5,
          fontSize: "0.85rem", letterSpacing: "0.04em"
        }}>
          No listings in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((listing) => {
            const badge = STATUS_COLORS[listing.status];
            return (
              <div
                key={listing.id}
                style={{
                  background: "#fff", border: "1px solid var(--warm-tan)",
                  overflow: "hidden",
                }}
              >
                {/* Image placeholder */}
                <div style={{
                  aspectRatio: "4/3", background: "var(--warm-tan)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--muted)", opacity: 0.4, fontSize: "0.7rem",
                  fontFamily: "var(--font-jost)", letterSpacing: "0.1em"
                }}>
                  {listing.category}
                </div>

                <div style={{ padding: "1rem 1rem 0.85rem" }}>
                  {/* Status badge */}
                  <span style={{
                    display: "inline-block", marginBottom: "0.5rem",
                    padding: "0.18rem 0.6rem",
                    background: badge.bg, color: badge.text,
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                    borderRadius: "2px",
                  }}>
                    {badge.label}
                  </span>

                  <p style={{
                    fontFamily: "var(--font-jost)", fontWeight: 500,
                    fontSize: "0.85rem", color: "#1A1A18",
                    marginBottom: "0.35rem", lineHeight: 1.35,
                  }}>
                    {listing.title}
                  </p>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.9rem" }}>
                    <span style={{
                      fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                      fontSize: "1.1rem", color: "#1A1A18"
                    }}>
                      ₹{listing.price.toLocaleString()}
                    </span>
                    {listing.rent_price && (
                      <span style={{
                        fontFamily: "var(--font-jost)", fontSize: "0.7rem",
                        color: "var(--muted)", opacity: 0.65
                      }}>
                        · ₹{listing.rent_price.toLocaleString()}/day rent
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: "flex", gap: "0.5rem",
                    borderTop: "1px solid var(--warm-tan)", paddingTop: "0.75rem"
                  }}>
                    <Link
                      href={`/dashboard/listings/${listing.id}/edit`}
                      style={{
                        flex: 1, textAlign: "center",
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "0.45rem 0", color: "var(--muted)",
                        border: "1px solid var(--warm-tan)", textDecoration: "none",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = "var(--muted)"; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = "var(--warm-tan)"; }}
                    >
                      Edit
                    </Link>
                    {listing.status === "active" && (
                      <button
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-jost)", fontWeight: 600,
                          fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                          padding: "0.45rem 0", color: "var(--muted)",
                          border: "1px solid var(--warm-tan)", background: "transparent",
                          cursor: "pointer", transition: "border-color 0.15s",
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = "var(--muted)"; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = "var(--warm-tan)"; }}
                      >
                        Mark sold
                      </button>
                    )}
                    <button
                      onClick={() => setDeleted(prev => new Set(Array.from(prev).concat(listing.id)))}
                      style={{
                        flex: 1,
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase",
                        padding: "0.45rem 0", color: "#C0392B",
                        border: "1px solid #FADADD", background: "transparent",
                        cursor: "pointer", transition: "border-color 0.15s",
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = "#C0392B"; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = "#FADADD"; }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
