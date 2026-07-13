"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Listings",
    href: "/dashboard/listings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    label: "Rentals",
    href: "/dashboard/rentals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="m9 16 2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: "Earnings",
    href: "/dashboard/earnings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto flex items-start" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* ── Desktop sidebar ──────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: "220px",
            flexShrink: 0,
            borderRight: "1px solid var(--warm-tan)",
            padding: "2.5rem 0",
            position: "sticky",
            top: "0",
            alignSelf: "flex-start",
            minHeight: "100vh",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
              fontFamily: "var(--font-jost)", fontWeight: 800, fontSize: "0.6rem",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--burnt-orange)", background: "rgba(196,68,10,0.1)",
              padding: "0.35rem 0.8rem", textDecoration: "none",
              border: "1px solid rgba(196,68,10,0.25)",
              transition: "background 0.15s",
            }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(196,68,10,0.18)")}
              onMouseOut={e => (e.currentTarget.style.background = "rgba(196,68,10,0.1)")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 6H2M2 6L6 2M2 6L6 10"/>
              </svg>
              Home
            </Link>
          </div>
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--burnt-orange)", padding: "0 1.75rem", marginBottom: "1.25rem"
          }}>
            Seller Dashboard
          </p>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {TABS.map((tab) => {
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.7rem 1.75rem",
                    fontFamily: "var(--font-jost)", fontWeight: active ? 600 : 400,
                    fontSize: "0.82rem", letterSpacing: "0.04em",
                    color: active ? "var(--burnt-orange)" : "var(--muted)",
                    background: active ? "rgba(201,92,26,0.07)" : "transparent",
                    borderRight: active ? "2px solid var(--burnt-orange)" : "2px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <main style={{ flex: 1, padding: "2.5rem 2rem 5rem", minWidth: 0 }}>
          {children}
        </main>
      </div>

    </div>
  );
}
