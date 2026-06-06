"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Browse", href: "/listings" },
  { label: "Sell", href: "/listings/new" },
  { label: "Rent", href: "/listings?type=rent" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ background: "var(--cream)", position: "sticky", top: 0, zIndex: 50 }}>

      {/* ── Announcement bar ─────────────────────────────────── */}
      <div style={{
        background: "var(--burnt-orange)", color: "var(--cream)",
        textAlign: "center", padding: "0.45rem 1rem",
        fontFamily: "var(--font-jost)", fontWeight: 300,
        fontSize: "0.58rem", letterSpacing: "0.18em"
      }}>
        New listings added daily — discover South Asian fashion ✦
      </div>

      {/* ── Main bar ──────────────────────────────────────────── */}
      <div
        style={{ borderBottom: "1px solid var(--warm-tan)" }}
        className="max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="flex items-center justify-between h-24 gap-6">

          {/* Left: nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.6rem", letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "var(--muted)",
                  transition: "color 0.2s"
                }}
                onMouseOver={e => (e.currentTarget.style.color = "var(--burnt-orange)")}
                onMouseOut={e => (e.currentTarget.style.color = "var(--muted)")}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Center: wordmark logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              fontFamily: "var(--font-cormorant-logo)", fontWeight: 500,
              fontStyle: "italic",
              fontSize: "clamp(2.8rem, 5vw, 3.8rem)", letterSpacing: "-0.02em",
              color: "#C4440A", lineHeight: 1,
              textDecoration: "none", userSelect: "none"
            }}
          >
            veeral
          </Link>

          {/* Right: icons + auth */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            {/* Search icon */}
            <button
              aria-label="Search"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem", padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Wishlist icon */}
            <Link href="/dashboard" aria-label="Saved" style={{ color: "var(--muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            {/* Account icon */}
            <Link href="/login" aria-label="Account" style={{ color: "var(--muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>

            {/* Divider */}
            <div style={{ width: "1px", height: "16px", background: "var(--warm-tan)" }} />

            <Link
              href="/signup"
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 400,
                fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--cream)", background: "var(--burnt-orange)",
                padding: "0.5rem 1.1rem", textDecoration: "none", transition: "opacity 0.2s"
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-auto"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1.1rem" }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ───────────────────────────────────────── */}
      {menuOpen && (
        <div style={{
          background: "var(--cream)", borderBottom: "1px solid var(--warm-tan)",
          padding: "1.2rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.2rem"
        }}>
          {[...NAV_LINKS, { label: "Log in", href: "/login" }, { label: "Sign up", href: "/signup" }].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 300,
                fontSize: "0.6rem", letterSpacing: "0.2em",
                textTransform: "uppercase", color: "var(--muted)"
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
