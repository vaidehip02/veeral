import Link from "next/link";

const linkStyle = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.88rem", letterSpacing: "0.18em",
  textTransform: "uppercase" as const, color: "#1A1410",
  textDecoration: "none", display: "block", marginBottom: "0.75rem",
};

const headingStyle = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.7rem", letterSpacing: "0.22em",
  textTransform: "uppercase" as const, color: "var(--burnt-orange)",
  marginBottom: "1.2rem",
};

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--warm-tan)", background: "var(--cream)" }}>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <p style={headingStyle}>Shop</p>
          {[
            ["Lehengas", "/listings?category=lehenga"],
            ["Sarees", "/listings?category=saree"],
            ["Accessories", "/listings?category=accessories"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={linkStyle}>{label}</Link>
          ))}
        </div>
        <div>
          <p style={headingStyle}>Sell</p>
          {[
            ["Create listing", "/listings/new"],
            ["Dashboard", "/dashboard"],
            ["Seller guide", "/help"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={linkStyle}>{label}</Link>
          ))}
        </div>
        <div>
          <p style={headingStyle}>Rent</p>
          {[
            ["Browse rentals", "/listings?type=rent"],
            ["How renting works", "/help#renting"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={linkStyle}>{label}</Link>
          ))}
        </div>
        <div>
          <p style={headingStyle}>Company</p>
          {[
            ["About", "/help"],
            ["Contact", "/help"],
            ["Help Center", "/help"],
            ["Instagram", "https://www.instagram.com/shopveeral"],
            ["TikTok", "https://www.tiktok.com/@shopveeral"],
          ].map(([label, href]) => (
            <Link key={href} href={href} style={linkStyle}>{label}</Link>
          ))}
        </div>
      </div>

      {/* US-only notice */}
      <div style={{ borderTop: "1px solid var(--warm-tan)", background: "#FAF6F1", padding: "0.65rem 1.5rem", textAlign: "center" }}>
        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#7A6A62", letterSpacing: "0.04em" }}>
          🇺🇸 Currently available for US-based transactions only. Payments, seller payouts, and shipping are US-only at this time.
        </span>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex justify-between items-center"
        style={{ borderTop: "1px solid var(--warm-tan)" }}
      >
        <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", letterSpacing: "0.12em", color: "#1A1410" }}>
          © 2026 Veeral
        </span>
        <div className="flex gap-6">
          {[["Instagram", "https://www.instagram.com/shopveeral"], ["TikTok", "https://www.tiktok.com/@shopveeral"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ ...linkStyle, marginBottom: 0 }}>{label}</Link>
          ))}
        </div>
      </div>

    </footer>
  );
}
