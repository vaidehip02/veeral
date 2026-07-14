"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { label: "Browse", href: "/listings" },
  { label: "Sell",   href: "/listings/new" },
  { label: "Rent",   href: "/listings?type=rent" },
];

const DROPDOWN_ITEMS = [
  { label: "My Profile",   href: "/account/profile",   sellerOnly: false },
  { label: "Dashboard",    href: "/dashboard",         sellerOnly: true  },
  { label: "My Orders",    href: "/account/orders",    sellerOnly: false },
  { label: "My Rentals",   href: "/account/rentals",   sellerOnly: false },
  { label: "Messages",     href: "/account/messages",  sellerOnly: false },
  { label: "Saved Items",  href: "/account/saved",     sellerOnly: false },
  { label: "Settings",     href: "/account/settings",  sellerOnly: false },
];

function getInitials(user: User): string {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(user: User): string {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "You"
  );
}

function getAvatar(_user: User): string | null {
  return null; // always use initials, never pull profile photo
}

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [customBanner, setCustomBanner] = useState<{ text: string; active: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Read admin-set announcement banner from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("veeral_banner");
      if (raw) setCustomBanner(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const avatar = user ? getAvatar(user) : null;
  const initials = user ? getInitials(user) : "";
  const displayName = user ? getDisplayName(user) : "";
  // Check if user has seller role (stored in metadata or just always show dashboard for now)
  const isSeller = user?.user_metadata?.role === "seller" || true; // show for all logged-in users

  return (
    <nav style={{ background: "var(--cream)", position: "sticky", top: 0, zIndex: 50 }}>

      {/* ── Announcement bar ─────────────────────────────────── */}
      <div style={{
        background: "var(--burnt-orange)", color: "var(--cream)",
        textAlign: "center", padding: "0.45rem 1rem",
        fontFamily: "var(--font-jost)", fontWeight: 500,
        fontSize: "0.88rem", letterSpacing: "0.18em"
      }}>
        {customBanner?.active && customBanner.text
          ? customBanner.text
          : "New listings added daily — discover South Asian fashion ✦"}
      </div>

      {/* ── Main bar ──────────────────────────────────────────── */}
      <div
        style={{ borderBottom: "1px solid var(--warm-tan)" }}
        className="max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="flex items-center justify-between h-16 md:h-24 gap-6">

          {/* Left: nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.7rem", letterSpacing: "0.2em",
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
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Wishlist icon */}
            <Link href="/saved" aria-label="Saved" style={{ color: "var(--muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            <div style={{ width: "1px", height: "16px", background: "var(--warm-tan)" }} />

            {/* ── Logged in: avatar + dropdown ── */}
            {user ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                {/* Trigger button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                  aria-label="Account menu"
                >
                  {/* Avatar — links to profile page */}
                  <Link href="/account/profile" onClick={e => e.stopPropagation()} style={{ flexShrink: 0, display: "block" }}>
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        style={{
                          width: "32px", height: "32px", borderRadius: "50%",
                          objectFit: "cover", border: "1.5px solid var(--warm-tan)"
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "var(--burnt-orange)", color: "var(--cream)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.7rem",
                        letterSpacing: "0.05em",
                      }}>
                        {initials}
                      </div>
                    )}
                  </Link>
                  {/* Display name */}
                  <span style={{
                    fontFamily: "var(--font-jost)", fontWeight: 500,
                    fontSize: "0.78rem", color: "var(--muted)",
                    maxWidth: "100px", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {displayName.split(" ")[0]}
                  </span>
                  {/* Chevron */}
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="var(--muted)" strokeWidth="2"
                    style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
                  >
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 12px)", right: 0,
                    background: "var(--cream)", border: "1px solid var(--warm-tan)",
                    minWidth: "200px", zIndex: 100,
                    boxShadow: "0 8px 32px rgba(13,9,6,0.10)",
                  }}>
                    {/* User info header */}
                    <div style={{
                      padding: "1rem 1.1rem 0.75rem",
                      borderBottom: "1px solid var(--warm-tan)",
                    }}>
                      <p style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.82rem", color: "#1A1A18", marginBottom: "0.15rem"
                      }}>
                        {displayName}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-jost)", fontSize: "0.82rem",
                        color: "var(--muted)", opacity: 0.55,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: "0.4rem 0" }}>
                      {DROPDOWN_ITEMS.filter(item => !item.sellerOnly || isSeller).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "block",
                            padding: "0.6rem 1.1rem",
                            fontFamily: "var(--font-jost)", fontWeight: 400,
                            fontSize: "0.8rem", color: "var(--muted)",
                            textDecoration: "none", transition: "background 0.15s, color 0.15s",
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = "rgba(201,92,26,0.07)";
                            e.currentTarget.style.color = "var(--burnt-orange)";
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--muted)";
                          }}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div style={{ borderTop: "1px solid var(--warm-tan)", padding: "0.4rem 0" }}>
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: "block",
                          width: "100%", padding: "0.6rem 1.1rem",
                          fontFamily: "var(--font-jost)", fontWeight: 400,
                          fontSize: "0.8rem", color: "var(--muted)",
                          background: "none", border: "none", cursor: "pointer",
                          textAlign: "left", transition: "background 0.15s, color 0.15s",
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = "rgba(201,92,26,0.07)";
                          e.currentTarget.style.color = "var(--burnt-orange)";
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--muted)";
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Logged out: sign up button ── */
              <Link
                href="/signup"
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.88rem", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--cream)", background: "var(--burnt-orange)",
                  padding: "0.5rem 1.1rem", textDecoration: "none", transition: "opacity 0.2s"
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Sign up
              </Link>
            )}
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
          padding: "1.2rem 1.5rem", display: "flex", flexDirection: "column", gap: "0",
        }}>
          {/* Nav links */}
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.7rem", letterSpacing: "0.2em",
                textTransform: "uppercase", color: "var(--muted)",
                textDecoration: "none", padding: "0.65rem 0",
                borderBottom: "1px solid var(--warm-tan)",
              }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              {/* User info — tappable toggle */}
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "1rem 0 0.75rem", width: "100%",
                  background: "none", border: "none", borderBottom: "1px solid var(--warm-tan)",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                {avatar ? (
                  <img src={avatar} alt={displayName} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "var(--burnt-orange)", color: "var(--cream)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem",
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18" }}>
                    {displayName}
                  </p>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Collapsible account links */}
              {dropdownOpen && (
                <>
                  {DROPDOWN_ITEMS.filter(item => !item.sellerOnly || isSeller).map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setMenuOpen(false); setDropdownOpen(false); }}
                      style={{
                        fontFamily: "var(--font-jost)", fontWeight: 400,
                        fontSize: "0.78rem", color: "var(--muted)",
                        background: "none", border: "none", borderBottom: "1px solid var(--warm-tan)",
                        padding: "0.65rem 0 0.65rem 1rem", textAlign: "left",
                        display: "block", width: "100%", cursor: "pointer",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={handleSignOut}
                    style={{
                      fontFamily: "var(--font-jost)", fontWeight: 400,
                      fontSize: "0.78rem", color: "var(--muted)",
                      background: "none", border: "none", cursor: "pointer",
                      padding: "0.65rem 0 0.65rem 1rem", textAlign: "left",
                      display: "block",
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem",
                  letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)",
                  textDecoration: "none", padding: "0.65rem 0", borderBottom: "1px solid var(--warm-tan)",
                }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem",
                  letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)",
                  textDecoration: "none", padding: "0.65rem 0",
                }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
