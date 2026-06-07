"use client";

import Link from "next/link";
import HeroCarousel from "@/components/home/HeroCarousel";

const CATEGORIES = [
  { label: "Lehengas", slug: "lehenga" },
  { label: "Sarees", slug: "saree" },
  { label: "Salwar Kameez", slug: "salwar_kameez" },
  { label: "Sherwanis", slug: "sherwani" },
  { label: "Indo-Western", slug: "indo_western" },
  { label: "Jewellery", slug: "jewellery" },
];

const MARQUEE_ITEMS = [
  "Buy & Sell", "Rent & Discover", "South Asian Fashion",
  "New Arrivals", "Wedding Season", "Daily Wear",
];

// Placeholder listing cards — replace with real Supabase data
const TRENDING = [
  { id: 1, title: "Red Bridal Lehenga", price: "$450", type: "Sale", bg: "#DDD0C5" },
  { id: 2, title: "Silk Banarasi Saree", price: "$120 / day", type: "Rent", bg: "#D5C9BE" },
  { id: 3, title: "Anarkali Suit", price: "$280", type: "Sale", bg: "#CABDB1" },
  { id: 4, title: "Sherwani Set", price: "$90 / day", type: "Rent", bg: "#C3B5A8" },
];

export default function HomePage() {
  return (
    <div style={{ background: "var(--cream)" }}>

      {/* ── Hero Carousel ─────────────────────────────────────── */}
      <HeroCarousel />

      {/* ── Categories ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center gap-4 mb-8">
          <h2 style={{
            fontFamily: "var(--font-cormorant)", fontWeight: 500,
            fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "0.03em",
            color: "var(--dark)", whiteSpace: "nowrap"
          }}>
            Shop by category
          </h2>
          <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/listings?category=${cat.slug}`}
              className="flex flex-col items-center py-5 px-2 text-center"
              style={{ border: "1px solid var(--warm-tan)", background: "transparent", transition: "background 0.2s" }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--warm-tan)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{
                fontFamily: "var(--font-cormorant)", fontWeight: 600,
                fontSize: "0.95rem", letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--dark)"
              }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--warm-tan)", borderBottom: "1px solid var(--warm-tan)",
        padding: "1rem 0", overflow: "hidden"
      }}>
        <div className="marquee-track flex w-max">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-8 px-8 whitespace-nowrap">
              <span style={{
                fontFamily: "var(--font-cormorant)", fontWeight: 500,
                fontSize: "clamp(1rem, 2.2vw, 1.6rem)", letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--dark)"
              }}>
                {item}
              </span>
              <span style={{
                width: "4px", height: "4px", borderRadius: "50%",
                background: "var(--burnt-orange)", display: "inline-block", flexShrink: 0
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Trending Now ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center gap-4 mb-8">
          <h2 style={{
            fontFamily: "var(--font-cormorant)", fontWeight: 500,
            fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "0.03em",
            color: "var(--dark)", whiteSpace: "nowrap"
          }}>
            Trending now
          </h2>
          <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
          <Link
            href="/listings"
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--burnt-orange)", whiteSpace: "nowrap", transition: "opacity 0.2s"
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.6")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRENDING.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="group block"
              style={{ textDecoration: "none" }}
            >
              {/* Photo placeholder */}
              <div
                style={{
                  background: item.bg, aspectRatio: "3/4",
                  position: "relative", overflow: "hidden",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                {/* Type badge */}
                <span style={{
                  position: "absolute", top: "0.75rem", left: "0.75rem",
                  fontFamily: "var(--font-jost)", fontWeight: 500,
                  fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--cream)", background: item.type === "Rent" ? "var(--dark)" : "var(--burnt-orange)",
                  padding: "0.3rem 0.6rem"
                }}>
                  {item.type}
                </span>
                {/* Add photo hint */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{
                    fontFamily: "var(--font-jost)", fontSize: "0.5rem",
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "var(--muted)", opacity: 0.5
                  }}>
                    Add photo
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "0.75rem 0" }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontWeight: 500,
                  fontSize: "0.75rem", letterSpacing: "0.05em",
                  color: "var(--dark)", marginBottom: "0.2rem"
                }}>
                  {item.title}
                </p>
                <p style={{
                  fontFamily: "var(--font-cormorant)", fontWeight: 600,
                  fontSize: "1rem", color: "var(--burnt-orange)"
                }}>
                  {item.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI Assistant ──────────────────────────────────────── */}
      <section style={{ background: "#EDE8E2", padding: "5rem 1.5rem", textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1rem"
        }}>
          ✦ AI Assistant
        </p>
        <h2 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "var(--dark)",
          letterSpacing: "0.03em", marginBottom: "1rem"
        }}>
          Not sure where to start?
        </h2>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 500,
          fontSize: "0.82rem", letterSpacing: "0.06em", lineHeight: 1.8,
          color: "var(--muted)", maxWidth: "400px", margin: "0 auto 2rem"
        }}>
          Ask about pricing, styling tips, tailors near you,<br />
          or how to create your first listing.
        </p>
        <button
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--cream)", background: "var(--burnt-orange)",
            padding: "0.85rem 2rem", border: "none", cursor: "pointer", transition: "opacity 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Chat with Veeral AI
        </button>
      </section>

    </div>
  );
}
