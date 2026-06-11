"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    label: "Overview",
    href: "/account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/account/orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    label: "Rentals",
    href: "/account/rentals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="m9 16 2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: "Saved",
    href: "/account/saved",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/account/messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    badge: 2,
  },
  {
    label: "Settings",
    href: "/account/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto flex items-start" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* ── Desktop sidebar ── */}
        <aside
          className="hidden md:flex flex-col"
          style={{
            width: "220px", flexShrink: 0,
            borderRight: "1px solid var(--warm-tan)",
            padding: "2.5rem 0",
            position: "sticky", top: "0",
            alignSelf: "flex-start", minHeight: "100vh",
          }}
        >
          <p style={{
            fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--burnt-orange)", padding: "0 1.75rem", marginBottom: "1.25rem",
          }}>
            My Account
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
                    textDecoration: "none", transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
                  {tab.label}
                  {"badge" in tab && tab.badge ? (
                    <span style={{
                      marginLeft: "auto",
                      minWidth: "18px", height: "18px", borderRadius: "9px",
                      background: "var(--burnt-orange)", color: "var(--cream)",
                      fontFamily: "var(--font-jost)", fontWeight: 700,
                      fontSize: "0.6rem", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      padding: "0 0.3rem",
                    }}>
                      {tab.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "2.5rem 2rem 6rem", minWidth: 0 }}>
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0"
        style={{
          background: "var(--cream)", borderTop: "1px solid var(--warm-tan)",
          display: "flex", zIndex: 40,
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "0.2rem", padding: "0.55rem 0",
                color: active ? "var(--burnt-orange)" : "var(--muted)",
                textDecoration: "none", fontSize: "0.52rem",
                fontFamily: "var(--font-jost)", fontWeight: active ? 600 : 400,
                letterSpacing: "0.06em", textTransform: "uppercase",
                position: "relative",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.55, position: "relative" }}>
                {tab.icon}
                {"badge" in tab && tab.badge ? (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-6px",
                    minWidth: "14px", height: "14px", borderRadius: "7px",
                    background: "var(--burnt-orange)", color: "var(--cream)",
                    fontFamily: "var(--font-jost)", fontWeight: 700,
                    fontSize: "0.5rem", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {tab.badge}
                  </span>
                ) : null}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
