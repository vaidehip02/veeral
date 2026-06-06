import Link from "next/link";

// Auth pages get their own layout — no navbar/footer, just the wordmark
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}
    >
      {/* Top wordmark */}
      <header style={{ padding: "1.8rem 2rem", textAlign: "center" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-cormorant-logo)",
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: "2.2rem",
            letterSpacing: "-0.02em",
            color: "#C4440A",
            textDecoration: "none",
            userSelect: "none",
          }}
        >
          veeral
        </Link>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        {children}
      </main>

      {/* Footer note */}
      <footer style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid var(--warm-tan)" }}>
        <span style={{
          fontFamily: "var(--font-jost)", fontWeight: 300,
          fontSize: "0.55rem", letterSpacing: "0.15em",
          color: "var(--warm-tan)"
        }}>
          © 2026 Veeral
        </span>
      </footer>
    </div>
  );
}
