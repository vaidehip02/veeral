import Link from "next/link";

// In production, fetch real order details from Supabase using the order ID
const ORDER = {
  id: "VRL-2026-00142",
  type: "rent" as "purchase" | "rent",
  title: "Red Bridal Lehenga with Gold Embroidery",
  category: "Lehenga",
  us_size: "6",
  seller_username: "priya_sharma",
  bg: "#DDD0C5",
  price: 4500,
  days: 5,
  rent_price: 120,
  returnDate: "2026-06-18T00:00:00.000Z",
  deposit: 1800,
};

function formatPrice(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 300,
  fontSize: "0.52rem", letterSpacing: "0.22em",
  textTransform: "uppercase", color: "var(--muted)",
};

export default function CheckoutSuccessPage() {
  const o = ORDER;
  const isRental = o.type === "rent";
  const rentalCost = o.rent_price * o.days;
  const total = isRental ? rentalCost + o.deposit : o.price;

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid var(--warm-tan)", padding: "1.2rem 2rem", textAlign: "center" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-cormorant-logo)", fontWeight: 500, fontStyle: "italic",
          fontSize: "1.8rem", letterSpacing: "-0.02em", color: "#C4440A", textDecoration: "none"
        }}>
          veeral
        </Link>
      </div>

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>

          {/* Confirmation header */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "rgba(196,68,10,0.1)", border: "1px solid #C4440A",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.2rem", fontSize: "1.4rem"
            }}>
              ✦
            </div>
            <h1 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 300,
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "var(--dark)",
              letterSpacing: "0.02em", marginBottom: "0.6rem"
            }}>
              Your order is confirmed!
            </h1>
            <p style={{
              fontFamily: "var(--font-jost)", fontWeight: 200,
              fontSize: "0.82rem", letterSpacing: "0.06em", color: "var(--muted)", lineHeight: 1.7
            }}>
              Order <strong style={{ color: "var(--dark)", fontWeight: 400 }}>{o.id}</strong>
              <br />The seller has been notified and will ship your item soon.
            </p>
          </div>

          {/* Order summary card */}
          <div style={{ border: "1px solid var(--warm-tan)", marginBottom: "1.5rem" }}>

            {/* Item row */}
            <div style={{ display: "flex", gap: "1rem", padding: "1.2rem", borderBottom: "1px solid var(--warm-tan)" }}>
              <div style={{ width: "72px", aspectRatio: "3/4", background: o.bg, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.82rem", color: "var(--dark)", marginBottom: "0.25rem", lineHeight: 1.3 }}>
                  {o.title}
                </p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.2rem" }}>
                  {o.category} · US {o.us_size}
                </p>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.65rem", color: "var(--muted)", marginBottom: "0.4rem" }}>
                  @{o.seller_username}
                </p>
                <span style={{
                  fontFamily: "var(--font-jost)", fontWeight: 400,
                  fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase",
                  color: isRental ? "var(--dark)" : "#C4440A",
                  border: `1px solid ${isRental ? "var(--warm-tan)" : "#C4440A"}`,
                  padding: "0.2rem 0.5rem"
                }}>
                  {isRental ? `Rental · ${o.days} days` : "Purchase"}
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {isRental ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Rental ({o.days} days)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(rentalCost)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Deposit (refundable)</span>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(o.deposit)}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)" }}>Item price</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.72rem", color: "var(--dark)" }}>{formatPrice(o.price)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--warm-tan)", paddingTop: "0.6rem", marginTop: "0.3rem", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--dark)" }}>Total charged</span>
                <span style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, fontSize: "1.5rem", color: "#C4440A" }}>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Rental return instructions */}
          {isRental && (
            <div style={{
              background: "rgba(196,68,10,0.06)",
              border: "1px solid rgba(196,68,10,0.25)",
              padding: "1.2rem", marginBottom: "1.5rem"
            }}>
              <p style={{ ...labelStyle, marginBottom: "0.8rem", color: "#C4440A" }}>
                ✦ Return instructions
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.75rem", color: "var(--dark)" }}>Return by</span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.82rem", color: "#C4440A" }}>
                    {fmtDate(o.returnDate)}
                  </span>
                </div>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.7, marginTop: "0.3rem" }}>
                  A prepaid return shipping label will be emailed to you 2 days before your return date. Your {formatPrice(o.deposit)} deposit will be refunded within 3 business days of the seller receiving and inspecting the item.
                </p>
              </div>
            </div>
          )}

          {/* What's next */}
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ ...labelStyle, marginBottom: "0.8rem" }}>What happens next</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                ["1", "The seller ships your item within 2–3 business days"],
                ["2", "You'll receive a tracking number by email once shipped"],
                isRental ? ["3", `Return the item by ${fmtDate(o.returnDate)} using the prepaid label we'll email you`] : ["3", "Leave a review once your item arrives to help other buyers"],
              ].map(([n, text]) => (
                <div key={n} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <span style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: "#C4440A", color: "var(--cream)",
                    fontFamily: "var(--font-jost)", fontWeight: 400, fontSize: "0.6rem",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {n}
                  </span>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.75rem", letterSpacing: "0.04em", color: "var(--dark)", lineHeight: 1.6, paddingTop: "0.1rem" }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/listings" style={{
              flex: 1, padding: "0.9rem", textAlign: "center",
              background: "#C4440A", textDecoration: "none",
              fontFamily: "var(--font-jost)", fontWeight: 400,
              fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--cream)", transition: "opacity 0.2s", display: "block"
            }}
              onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = "0.85")}
              onMouseOut={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.opacity = "1")}
            >
              Continue shopping
            </Link>
            <Link href="/dashboard" style={{
              flex: 1, padding: "0.9rem", textAlign: "center",
              border: "1px solid var(--warm-tan)", textDecoration: "none",
              fontFamily: "var(--font-jost)", fontWeight: 300,
              fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--muted)", display: "block"
            }}>
              My orders
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
