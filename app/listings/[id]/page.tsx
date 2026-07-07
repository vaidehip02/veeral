"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PhotoGallery from "@/components/listings/PhotoGallery";
import SellerCard from "@/components/listings/SellerCard";
import SizeChart from "@/components/listings/SizeChart";
import RentalDrawer from "@/components/listings/RentalDrawer";
import Reviews from "@/components/listings/Reviews";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rent_price: number | null;
  rent_duration_days: number | null;
  deposit_pct: number;
  type: "sale" | "rent" | "both";
  category: string;
  condition: string;
  size: string | null;
  color: string | null;
  brand: string | null;
  original_price: number | null;
  location: string | null;
  images: string[];
  tags: string[] | null;
  dry_clean_only: boolean | null;
  included: string[] | null;
  care_instructions: string | null;
  seller: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPrice(dollars: number) {
  return `$${dollars.toLocaleString("en-US")}`;
}

const CONDITION_LABEL: Record<string, string> = {
  new: "New with tags",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-jost)", fontWeight: 500,
      fontSize: "0.88rem", letterSpacing: "0.12em", textTransform: "uppercase",
      color: "var(--muted)", border: "1px solid var(--warm-tan)",
      padding: "0.3rem 0.7rem", display: "inline-block"
    }}>
      {children}
    </span>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListingPage({ params: _params }: { params: { id: string } }) {
  const [saved, setSaved] = useState(false);
  const [rentalOpen, setRentalOpen] = useState(false);
  const router = useRouter();
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("listings")
      .select(`
        id, title, description, price, rent_price, rent_duration_days,
        deposit_pct, type, category, condition, size, color, brand,
        location, images, seller_id
      `)
      .eq("id", _params.id)
      .single()
      .then(async ({ data, error: err }) => {
        if (err || !data) { setError("Listing not found."); setLoading(false); return; }
        // Fetch seller separately to avoid FK join dependency
        let seller = { id: "", username: "unknown", display_name: null as string | null, avatar_url: null as string | null };
        if (data.seller_id) {
          const { data: sp } = await supabase
            .from("seller_profiles")
            .select("id, username, display_name, avatar_url")
            .eq("id", data.seller_id)
            .single();
          if (sp) seller = sp;
        }
        const built: Listing = {
          ...data,
          original_price: null,
          tags: null,
          dry_clean_only: null,
          included: null,
          care_instructions: null,
          seller,
        };
        setListing(built);
        setLoading(false);
      });
  }, [_params.id]);

  if (loading) return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-jost)", color: "#6B5E52", fontSize: "0.85rem", letterSpacing: "0.1em" }}>Loading…</p>
    </div>
  );
  if (error || !listing) return (
    <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-jost)", color: "#991B1B", fontSize: "0.85rem" }}>{error ?? "Listing not found."}</p>
    </div>
  );

  const l = listing;
  const savings = l.original_price ? l.original_price - l.price : 0;

  const INCLUDED_OPTIONS = ["Lehenga skirt", "Blouse", "Dupatta", "Jacket/Shrug", "Belt/Kamarband"];

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">

        {/* Breadcrumb */}
        <nav style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", letterSpacing: "0.15em", color: "var(--muted)" }}>
            <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            {" / "}
            <Link href="/listings" style={{ color: "var(--muted)", textDecoration: "none" }}>Listings</Link>
            {" / "}
            <span style={{ color: "var(--dark)" }}>{l.title}</span>
          </span>
        </nav>

        {/* ── Main grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}
          className="listing-grid"
        >

          {/* LEFT — Photo gallery */}
          <div>
            <PhotoGallery images={l.images} title={l.title} />
          </div>

          {/* RIGHT — Product info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>

            {/* Title */}
            <div>
              <h1 style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", letterSpacing: "0.01em",
                color: "var(--dark)", lineHeight: 1.2, marginBottom: "1rem"
              }}>
                {l.title}
              </h1>

              {/* Seller inline */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--warm-tan)", flexShrink: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "var(--muted)"
                }}>
                  {(l.seller.display_name ?? l.seller.username)[0]}
                </div>
                <div>
                  <Link href={`/sellers/${l.seller.username}`} style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.82rem", color: "var(--dark)", textDecoration: "none",
                    letterSpacing: "0.04em"
                  }}>
                    @{l.seller.username}
                  </Link>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "var(--warm-tan)" }} />

            {/* Price */}
            <div>
              {(l.type === "sale" || l.type === "both") && (
                <p style={{
                  fontFamily: "var(--font-cormorant)", fontWeight: 600,
                  fontSize: "2rem", color: "#C4440A", lineHeight: 1
                }}>
                  {formatPrice(l.price)}
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", letterSpacing: "0.1em", color: "var(--muted)", marginLeft: "0.5rem" }}>
                    to buy
                  </span>
                </p>
              )}
              {(l.type === "rent" || l.type === "both") && l.rent_price && (
                <p style={{
                  fontFamily: "var(--font-cormorant)", fontWeight: 600,
                  fontSize: "1.3rem", color: "var(--dark)", marginTop: "0.3rem"
                }}>
                  {formatPrice(l.rent_price)}
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", letterSpacing: "0.1em", color: "var(--muted)", marginLeft: "0.5rem" }}>
                    / day to rent · up to {l.rent_duration_days} days
                  </span>
                </p>
              )}
              {/* Original price + savings */}
              {l.original_price && (
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.88rem", letterSpacing: "0.05em", color: "var(--muted)", marginTop: "0.4rem" }}>
                  Originally {formatPrice(l.original_price)} ·{" "}
                  <span style={{ color: "#5a8a5a" }}>You save {formatPrice(savings)}</span>
                </p>
              )}
            </div>

            {/* Condition + colour + brand + dry clean tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <Tag>{CONDITION_LABEL[l.condition]}</Tag>
              {l.color && <Tag>{l.color}</Tag>}
              {l.brand && <Tag>{l.brand}</Tag>}
              {(l.tags ?? []).map(t => <Tag key={t}>{t}</Tag>)}
              {l.dry_clean_only && (
                <span style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--cream)", background: "var(--muted)",
                  padding: "0.3rem 0.7rem", display: "inline-flex", alignItems: "center", gap: "0.35rem"
                }}>
                  🧺 Dry clean only
                </span>
              )}
            </div>

            {/* ── US Size (display only — one-of-a-kind items) ── */}
            {l.size && (
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Size
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.92rem", color: "#1A1A18", marginLeft: "0.75rem" }}>
                    US {l.size}
                  </span>
                </div>
                <button
                  onClick={() => setSizeChartOpen(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", letterSpacing: "0.08em", color: "#C4440A", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 }}
                >
                  Size chart
                </button>
              </div>
            )}

            {/* What's included */}
            <div>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
                color: "var(--muted)", marginBottom: "0.75rem"
              }}>
                What&apos;s included
              </p>
              {/* 3-column grid: row 1 = Lehenga skirt, Blouse, Dupatta | row 2 = Jacket/Shrug, Belt/Kamarband */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem 1rem" }}>
                {INCLUDED_OPTIONS.map(item => {
                  const included = (l.included ?? []).includes(item);
                  return (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{
                        width: "16px", height: "16px", borderRadius: "2px",
                        border: `1px solid ${included ? "#C4440A" : "var(--warm-tan)"}`,
                        background: included ? "rgba(196,68,10,0.1)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: "0.85rem", color: "#C4440A"
                      }}>
                        {included ? "✓" : ""}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-jost)", fontWeight: 500,
                        fontSize: "0.82rem", letterSpacing: "0.04em",
                        color: included ? "var(--dark)" : "#3D3830",
                        textDecoration: included ? "none" : "line-through"
                      }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase",
                color: "var(--muted)", marginBottom: "0.6rem"
              }}>
                Description
              </p>
              <p style={{
                fontFamily: "var(--font-jost)", fontWeight: 500,
                fontSize: "0.82rem", letterSpacing: "0.03em",
                lineHeight: 1.8, color: "var(--dark)"
              }}>
                {l.description}
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(l.type === "sale" || l.type === "both") && (
                <button
                  onClick={() => router.push(`/checkout/${l.id}?type=sale`)}
                  style={{
                    width: "100%", padding: "1rem",
                    background: "#C4440A", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "var(--cream)", transition: "opacity 0.2s"
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                >
                  Buy now — {formatPrice(l.price)}
                </button>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {(l.type === "sale" || l.type === "both") && (
                  <button
                    onClick={() => router.push(`/checkout/${l.id}?type=sale`)}
                    style={{
                      flex: 1, padding: "1rem",
                      background: "transparent", border: "1px solid #C4440A", cursor: "pointer",
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                      color: "#C4440A", transition: "opacity 0.2s"
                    }}
                    onMouseOver={e => (e.currentTarget.style.opacity = "0.65")}
                    onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Add to cart
                  </button>
                )}

                <button
                  onClick={() => setSaved(!saved)}
                  aria-label="Save listing"
                  style={{
                    width: "52px", padding: "1rem",
                    background: "transparent",
                    border: `1px solid ${saved ? "#C4440A" : "var(--warm-tan)"}`,
                    cursor: "pointer", fontSize: "1.1rem",
                    color: saved ? "#C4440A" : "#3D3830",
                    transition: "all 0.2s", flexShrink: 0,
                  }}
                >
                  {saved ? "♥" : "♡"}
                </button>
              </div>

              {(l.type === "rent" || l.type === "both") && l.rent_price && (
                <button
                  onClick={() => setRentalOpen(true)}
                  style={{
                    width: "100%", padding: "1rem",
                    background: "var(--dark)", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase",
                    color: "var(--cream)", transition: "opacity 0.2s"
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                  onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                >
                  Rent from {formatPrice(l.rent_price)} / day
                </button>
              )}
            </div>

            {l.location && (
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", letterSpacing: "0.08em", color: "var(--muted)" }}>
                📍 {l.location}
              </p>
            )}
          </div>
        </div>

        {/* ── Seller card ── */}
        <div style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontWeight: 500, fontSize: "1.4rem", letterSpacing: "0.03em", color: "var(--dark)", whiteSpace: "nowrap" }}>
              About the seller
            </h2>
            <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
          </div>
          <SellerCard
            sellerId={l.seller.id}
            username={l.seller.username}
            displayName={l.seller.display_name ?? l.seller.username}
            avatarUrl={l.seller.avatar_url ?? ""}
            totalListings={0}
            rating={0}
            listingId={l.id}
          />
        </div>

        {/* ── Reviews ── */}
        <div style={{ marginTop: "3rem" }}>
          <Reviews
            listingId={l.id}
            reviews={[]}
            canReview={false} // TODO: check if logged-in user has purchased this item
          />
        </div>

        {/* ── More from this seller ── */}
        <div style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontWeight: 500,
              fontSize: "1.4rem", letterSpacing: "0.03em", color: "var(--dark)", whiteSpace: "nowrap"
            }}>
              More from @{l.seller.username}
            </h2>
            <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
            <Link href={`/sellers/${l.seller.username}`} style={{
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#C4440A", whiteSpace: "nowrap", textDecoration: "none"
            }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
            {/* TODO: fetch other listings from this seller */}
          </div>
        </div>

        {/* ── Similar items ── */}
        <div style={{ marginTop: "3rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontWeight: 500,
              fontSize: "1.4rem", letterSpacing: "0.03em", color: "var(--dark)", whiteSpace: "nowrap"
            }}>
              Similar items
            </h2>
            <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
            <Link href="/listings?category=lehenga" style={{
              fontFamily: "var(--font-jost)", fontWeight: 500,
              fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#C4440A", whiteSpace: "nowrap", textDecoration: "none"
            }}>
              Browse all →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }} className="similar-grid">
            {/* TODO: fetch similar listings by category */}
          </div>
        </div>

      </div>

      {/* Rental drawer */}
      {rentalOpen && l.rent_price && (
        <RentalDrawer
          listingId={l.id}
          title={l.title}
          pricePerDay={l.rent_price}
          salePrice={l.price}
          depositPct={l.deposit_pct ?? 40}
          maxDays={l.rent_duration_days ?? 14}
          careInstructions={l.care_instructions ?? undefined}
          onClose={() => setRentalOpen(false)}
        />
      )}

      {sizeChartOpen && (
        <SizeChart
          garmentType={l.category as "lehenga" | "saree" | "salwar_kameez" | "sherwani" | "other"}
          onClose={() => setSizeChartOpen(false)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .listing-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
