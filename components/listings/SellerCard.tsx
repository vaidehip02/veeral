import Link from "next/link";
import Image from "next/image";

interface SellerCardProps {
  username: string;
  displayName: string;
  avatarUrl?: string;
  totalListings: number;
  rating?: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C4440A", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span style={{ fontFamily: "var(--font-jost)", fontWeight: 300, fontSize: "0.65rem", color: "var(--muted)", marginLeft: "0.4rem" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export default function SellerCard({ username, displayName, avatarUrl, totalListings, rating }: SellerCardProps) {
  return (
    <div style={{
      border: "1px solid var(--warm-tan)", padding: "1.5rem",
      display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap"
    }}>
      {/* Avatar */}
      <div style={{
        width: "56px", height: "56px", borderRadius: "50%",
        background: "var(--warm-tan)", flexShrink: 0, overflow: "hidden",
        position: "relative"
      }}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-cormorant)", fontSize: "1.4rem",
            color: "var(--muted)", fontStyle: "italic"
          }}>
            {displayName[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: "120px" }}>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 400,
          fontSize: "0.82rem", letterSpacing: "0.04em", color: "var(--dark)", marginBottom: "0.2rem"
        }}>
          {displayName}
        </p>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 300,
          fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.3rem"
        }}>
          @{username} · {totalListings} listings
        </p>
        {rating && <Stars rating={rating} />}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
        <Link
          href={`/sellers/${username}`}
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 400,
            fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--cream)", background: "#C4440A",
            padding: "0.6rem 1.2rem", textDecoration: "none", transition: "opacity 0.2s"
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          View shop
        </Link>
        <button style={{
          fontFamily: "var(--font-jost)", fontWeight: 400,
          fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#C4440A", background: "transparent",
          border: "1px solid #C4440A", padding: "0.6rem 1.2rem",
          cursor: "pointer", transition: "opacity 0.2s"
        }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.65")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Message
        </button>
      </div>
    </div>
  );
}
