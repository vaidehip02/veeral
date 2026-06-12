"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── Light-mode tokens ────────────────────────────────────────────────────────
const A = {
  bg:           "#FAF6F1",   // cream page background
  card:         "#FFFFFF",   // card / table background
  border:       "#EDE6DE",   // warm border
  sidebar:      "#FFFFFF",   // sidebar background
  dark:         "#0D0906",   // primary text
  muted:        "#6B5E52",   // secondary text
  label:        "#9C8B7E",   // all-caps micro-label
  accent:       "#C4440A",   // terracotta on light bg (slightly deeper than --burnt-orange)
  accentBg:     "rgba(196,68,10,0.08)",
  accentBorder: "rgba(196,68,10,0.25)",
};


const TABS = [
  {
    label: "Overview", href: "/admin",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Users", href: "/admin/users",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: "Listings", href: "/admin/listings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    label: "Orders", href: "/admin/orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    label: "Rentals", href: "/admin/rentals",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="m9 16 2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: "Settings", href: "/admin/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

function getDisplayName(u: User) {
  return (
    u.user_metadata?.full_name ||
    u.user_metadata?.name ||
    u.email?.split("@")[0] ||
    "Admin"
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div style={{ background: A.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Slim top bar ─────────────────────────────────────────────── */}
      <header style={{
        background: A.card,
        borderBottom: `1px solid ${A.border}`,
        padding: "0 2rem",
        height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
        position: "sticky", top: 0, zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic",
            fontSize: "1.2rem", color: A.dark, letterSpacing: "0.04em",
          }}>
            Veeral
          </span>
          <span style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: A.accent,
          }}>
            Admin
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {user && (
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: A.muted }}>
              {getDisplayName(user)}
            </span>
          )}
          <Link href="/" style={{
            fontFamily: "var(--font-jost)", fontSize: "0.72rem",
            color: A.muted, textDecoration: "none",
            display: "flex", alignItems: "center", gap: "0.3rem",
            transition: "color 0.15s",
          }}
            onMouseOver={e => (e.currentTarget.style.color = A.accent)}
            onMouseOut={e => (e.currentTarget.style.color = A.muted)}
          >
            ← Back to site
          </Link>
        </div>
      </header>

      {/* ── Body row ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* Sidebar */}
        <aside style={{
          width: "200px", flexShrink: 0,
          background: A.sidebar,
          borderRight: `1px solid ${A.border}`,
          padding: "1.5rem 0",
          position: "sticky", top: "52px",
          alignSelf: "flex-start", minHeight: "calc(100vh - 52px)",
        }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.7rem",
                    padding: "0.65rem 1.5rem",
                    fontFamily: "var(--font-jost)", fontWeight: active ? 600 : 400,
                    fontSize: "0.8rem", letterSpacing: "0.04em",
                    color: active ? A.accent : A.muted,
                    background: active ? A.accentBg : "transparent",
                    borderLeft: `2px solid ${active ? A.accent : "transparent"}`,
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                  onMouseOver={e => { if (!active) { e.currentTarget.style.color = A.dark; e.currentTarget.style.background = "#F5EFE8"; } }}
                  onMouseOut={e => { if (!active) { e.currentTarget.style.color = A.muted; e.currentTarget.style.background = "transparent"; } }}
                >
                  <span style={{ opacity: active ? 1 : 0.55 }}>{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2.5rem 2.5rem 4rem", minWidth: 0, overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
