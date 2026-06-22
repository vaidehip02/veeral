"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ─── Mock data ────────────────────────────────────────────────────────────────

const SELLER = {
  username: "priya_sharma",
  display_name: "Priya Sharma",
  bio: "Curating a wardrobe of heirlooms and modern South Asian fashion. Every piece has a story — find yours here.",
  location: "New York, NY",
  member_since: "March 2024",
  avatar_color: "#D4C5B5",   // placeholder until real photo
  banner_color: "#E8DDD3",   // placeholder until real banner
  total_listings: 12,
  total_sales: 47,
  avg_rating: 4.8,
  review_count: 31,
  follower_count: 214,
  following_count: 38,
  verified: true,
};

type ListingType = "sale" | "rent" | "both";

interface MockListing {
  id: string;
  title: string;
  price: number;
  rent_price?: number;
  type: ListingType;
  bg: string;
  category: string;
}

const LISTINGS: MockListing[] = [
  { id: "1",  title: "Red Bridal Lehenga with Gold Embroidery", price: 4500, rent_price: 120, type: "both", bg: "#D4C5B5", category: "lehenga" },
  { id: "2",  title: "Zardozi Saree — Ivory & Gold",            price: 980,  rent_price: 65,  type: "both", bg: "#E8DDD3", category: "saree"   },
  { id: "3",  title: "Pink Anarkali Kurta Set",                 price: 320,                   type: "sale", bg: "#DDD0C5", category: "kurta"   },
  { id: "4",  title: "Mirror-work Lehenga (Bridal)",            price: 3800, rent_price: 160, type: "both", bg: "#C8B9A8", category: "lehenga" },
  { id: "5",  title: "Silk Sharara Set — Olive Green",          price: 540,                   type: "sale", bg: "#CFC0AF", category: "salwar"  },
  { id: "6",  title: "Blue Banarasi Silk Saree",                price: 1200,                  type: "sale", bg: "#C3B5A8", category: "saree"   },
  { id: "7",  title: "Sequin Lehenga — Midnight Blue",          price: 2200, rent_price: 95,  type: "both", bg: "#B8BFCC", category: "lehenga" },
  { id: "8",  title: "Embroidered Chanderi Saree",              price: 780,  rent_price: 45,  type: "both", bg: "#DDD5CA", category: "saree"   },
  { id: "9",  title: "Cream Sharara Set",                       price: 460,                   type: "sale", bg: "#CABDB1", category: "salwar"  },
  { id: "10", title: "Gold Tissue Lehenga",                     price: 5100, rent_price: 200, type: "both", bg: "#E0DDD8", category: "lehenga" },
  { id: "11", title: "Dusty Pink Anarkali — Georgette",         price: 290,                   type: "sale", bg: "#D9C9C4", category: "kurta"   },
  { id: "12", title: "Bridal Dupatta — Red & Gold",             price: 180,  rent_price: 30,  type: "rent", bg: "#E3D5CA", category: "other"   },
];

interface Review {
  id: string;
  buyer: string;
  rating: number;
  text: string;
  item: string;
  date: string;
}

const REVIEWS: Review[] = [
  {
    id: "r1",
    buyer: "ananya_m",
    rating: 5,
    text: "Absolutely stunning lehenga — the photos don't do it justice. Priya was incredibly communicative and packed it beautifully. Would 100% buy from her again.",
    item: "Red Bridal Lehenga with Gold Embroidery",
    date: "Jun 3, 2026",
  },
  {
    id: "r2",
    buyer: "kavitha_wears",
    rating: 5,
    text: "The saree arrived in perfect condition, exactly as described. Shipping was fast and Priya even included a handwritten note. This is what shopping should feel like.",
    item: "Zardozi Saree — Ivory & Gold",
    date: "May 28, 2026",
  },
  {
    id: "r3",
    buyer: "meera_b",
    rating: 4,
    text: "Lovely piece, great quality. Slight colour difference from photos but honestly it looked even better in person. Very smooth transaction.",
    item: "Blue Banarasi Silk Saree",
    date: "May 19, 2026",
  },
  {
    id: "r4",
    buyer: "sana.rents",
    rating: 5,
    text: "Rented the Mirror-work Lehenga for a wedding and received so many compliments. Returned without any issues. Highly recommend renting from Priya!",
    item: "Mirror-work Lehenga (Bridal)",
    date: "May 12, 2026",
  },
  {
    id: "r5",
    buyer: "divya.looks",
    rating: 5,
    text: "Fast shipping, accurate description, beautiful garment. Priya answered all my questions quickly before I purchased. A+ seller.",
    item: "Silk Sharara Set — Sage Green",
    date: "May 2, 2026",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const fontSize = size === "lg" ? "1.25rem" : "0.78rem";
  return (
    <span style={{ color: "#C4440A", fontSize, letterSpacing: "0.05em" }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      {"☆".repeat(5 - Math.ceil(rating))}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "sale" | "rent";

interface LiveReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { username: string } | null;
  listing: { title: string } | null;
}

export default function SellerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const [followed, setFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState(SELLER.follower_count);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [liveReviews, setLiveReviews] = useState<LiveReview[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reviews")
      .select(`
        id, rating, comment, created_at,
        reviewer:reviewer_id ( username:id ),
        listing:order_id ( title:listing_id )
      `)
      .eq("seller_id", SELLER.username) // will be replaced when seller data is live
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Supabase returns joined rows as arrays — normalise to single objects
          const normalised: LiveReview[] = (data as unknown[]).map((r: unknown) => {
            const row = r as Record<string, unknown>;
            const rev = Array.isArray(row.reviewer) ? row.reviewer[0] : row.reviewer;
            const lst = Array.isArray(row.listing)  ? row.listing[0]  : row.listing;
            return {
              id:         row.id as string,
              rating:     row.rating as number,
              comment:    row.comment as string,
              created_at: row.created_at as string,
              reviewer:   rev ? { username: (rev as Record<string,string>).username } : null,
              listing:    lst ? { title:    (lst as Record<string,string>).title    } : null,
            };
          });
          setLiveReviews(normalised);
        }
      });
  }, []);

  // Use live reviews when available, fall back to mock
  const activeReviews = liveReviews ?? REVIEWS.map(r => ({
    id: r.id, rating: r.rating, comment: r.text, created_at: r.date,
    reviewer: { username: r.buyer },
    listing: { title: r.item },
  }));

  const avgRating = activeReviews.length > 0
    ? Math.round((activeReviews.reduce((s, r) => s + r.rating, 0) / activeReviews.length) * 10) / 10
    : SELLER.avg_rating;

  const handleFollow = () => {
    setFollowed(f => !f);
    setFollowerCount(c => (followed ? c - 1 : c + 1));
  };

  const filteredListings = LISTINGS.filter(l => {
    if (activeTab === "sale") return l.type === "sale" || l.type === "both";
    if (activeTab === "rent") return l.type === "rent" || l.type === "both";
    return true;
  });

  const visibleReviews = showAllReviews ? activeReviews : activeReviews.slice(0, 3);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all",  label: "All" },
    { id: "sale", label: "For Sale" },
    { id: "rent", label: "For Rent" },
  ];

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* ── Banner ── */}
      <div style={{
        width: "100%", height: "220px",
        background: SELLER.banner_color,
        position: "relative",
      }} />

      {/* ── Profile header ── */}
      <div className="max-w-5xl mx-auto" style={{ padding: "0 1.5rem" }}>

        {/* Avatar row */}
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", flexWrap: "wrap",
          gap: "1rem", marginTop: "-52px", marginBottom: "1.5rem",
        }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: "104px", height: "104px", borderRadius: "50%",
              background: SELLER.avatar_color,
              border: "4px solid var(--cream)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "2.5rem", color: "var(--muted)",
            }}>
              {SELLER.display_name[0]}
            </div>
            {SELLER.verified && (
              <div style={{
                position: "absolute", bottom: "4px", right: "4px",
                width: "24px", height: "24px", borderRadius: "50%",
                background: "var(--burnt-orange)", border: "2px solid var(--cream)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.65rem", color: "var(--cream)",
              }} title="Verified seller">
                ✓
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "0.65rem", marginBottom: "0.25rem" }}>
            <button
              onClick={handleFollow}
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "0.6rem 1.4rem",
                background: followed ? "var(--burnt-orange)" : "transparent",
                color: followed ? "var(--cream)" : "var(--muted)",
                border: `1px solid ${followed ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {followed ? "Following" : "Follow"}
            </button>
            <button style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
              padding: "0.6rem 1.4rem",
              background: "transparent", color: "var(--muted)",
              border: "1px solid var(--warm-tan)", cursor: "pointer",
              transition: "border-color 0.15s",
            }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
            >
              Message
            </button>
          </div>
        </div>

        {/* Name + handle + verified */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            <h1 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "#1A1A18", lineHeight: 1.1,
            }}>
              {SELLER.display_name}
            </h1>
            {SELLER.verified && (
              <span style={{
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase",
                padding: "0.22rem 0.6rem",
                background: "rgba(201,92,26,0.1)", color: "var(--burnt-orange)",
                border: "1px solid rgba(201,92,26,0.25)",
              }}>
                Verified seller
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "var(--font-jost)", fontSize: "0.82rem",
            color: "var(--muted)", opacity: 0.6, marginTop: "0.2rem",
            letterSpacing: "0.04em",
          }}>
            @{params.username}
          </p>
        </div>

        {/* Bio */}
        <p style={{
          fontFamily: "var(--font-jost)", fontSize: "0.88rem",
          color: "var(--muted)", lineHeight: 1.75, maxWidth: "520px",
          marginBottom: "1rem",
        }}>
          {SELLER.bio}
        </p>

        {/* Meta row: location, member since, socials */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "1.25rem",
          marginBottom: "1.75rem", alignItems: "center",
        }}>
          {SELLER.location && (
            <span style={{
              fontFamily: "var(--font-jost)", fontSize: "0.78rem",
              color: "var(--muted)", opacity: 0.65,
              display: "flex", alignItems: "center", gap: "0.35rem",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {SELLER.location}
            </span>
          )}
          <span style={{
            fontFamily: "var(--font-jost)", fontSize: "0.78rem",
            color: "var(--muted)", opacity: 0.65,
            display: "flex", alignItems: "center", gap: "0.35rem",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Member since {SELLER.member_since}
          </span>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "0", flexWrap: "wrap",
          borderTop: "1px solid var(--warm-tan)",
          borderBottom: "1px solid var(--warm-tan)",
          marginBottom: "3rem",
        }}>
          {[
            { value: SELLER.total_listings, label: "Listings" },
            { value: SELLER.total_sales, label: "Sales" },
            { value: followerCount, label: "Followers" },
            { value: SELLER.following_count, label: "Following" },
            { value: `${SELLER.avg_rating} ★`, label: `${SELLER.review_count} reviews` },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: "1 1 80px", minWidth: "80px",
                padding: "1.25rem 1rem", textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid var(--warm-tan)" : "none",
              }}
            >
              <p style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "1.6rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1,
              }}>
                {stat.value}
              </p>
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.58rem", fontWeight: 600,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--muted)", opacity: 0.55, marginTop: "0.3rem",
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Listings section ── */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap",
            gap: "1rem", marginBottom: "1.5rem",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.6rem", color: "#1A1A18",
            }}>
              Listings
            </h2>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
                    padding: "0.4rem 1rem", border: "1px solid",
                    borderColor: activeTab === tab.id ? "var(--burnt-orange)" : "var(--warm-tan)",
                    background: activeTab === tab.id ? "var(--burnt-orange)" : "transparent",
                    color: activeTab === tab.id ? "var(--cream)" : "var(--muted)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.85rem",
              color: "var(--muted)", opacity: 0.5, textAlign: "center",
              padding: "3rem 0",
            }}>
              No listings in this category.
            </p>
          ) : (
            <div
              className="listings-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.25rem",
              }}
            >
              {filteredListings.map(listing => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{
                    background: "#fff",
                    border: "1px solid var(--warm-tan)",
                    overflow: "hidden",
                    transition: "box-shadow 0.2s",
                  }}
                    onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
                    onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Photo placeholder */}
                    <div style={{
                      aspectRatio: "3/4",
                      background: listing.bg,
                    }} />

                    <div style={{ padding: "0.85rem 0.9rem 0.9rem" }}>
                      {/* Type badge */}
                      <span style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.55rem", letterSpacing: "0.16em", textTransform: "uppercase",
                        padding: "0.18rem 0.5rem",
                        background: listing.type === "rent"
                          ? "#E3F2FD"
                          : listing.type === "both"
                            ? "rgba(201,92,26,0.08)"
                            : "#F5F5F5",
                        color: listing.type === "rent"
                          ? "#1D4E89"
                          : listing.type === "both"
                            ? "var(--burnt-orange)"
                            : "#555",
                        display: "inline-block", marginBottom: "0.5rem",
                      }}>
                        {listing.type === "both" ? "Sale + Rent" : listing.type === "rent" ? "Rent only" : "For Sale"}
                      </span>

                      <p style={{
                        fontFamily: "var(--font-jost)", fontWeight: 500,
                        fontSize: "0.82rem", color: "#1A1A18",
                        lineHeight: 1.35, marginBottom: "0.5rem",
                      }}>
                        {listing.title}
                      </p>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", flexWrap: "wrap" }}>
                        {(listing.type === "sale" || listing.type === "both") && (
                          <span style={{
                            fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                            fontSize: "1.1rem", color: "#C4440A",
                          }}>
                            ${listing.price.toLocaleString()}
                          </span>
                        )}
                        {listing.rent_price && (listing.type === "rent" || listing.type === "both") && (
                          <span style={{
                            fontFamily: "var(--font-jost)", fontSize: "0.7rem",
                            color: "var(--muted)", opacity: 0.65,
                          }}>
                            {listing.type === "both" ? "· " : ""}${listing.rent_price}/day
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Reviews section ── */}
        <section style={{ marginBottom: "4rem" }}>

          {/* Section header with aggregate rating */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: "1rem", marginBottom: "2rem", flexWrap: "wrap",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.6rem", color: "#1A1A18", whiteSpace: "nowrap",
            }}>
              Reviews
            </h2>
            <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
          </div>

          {/* Aggregate rating card */}
          <div style={{
            display: "flex", alignItems: "center", gap: "2.5rem",
            background: "#fff", border: "1px solid var(--warm-tan)",
            padding: "1.75rem 2rem", marginBottom: "2rem",
            flexWrap: "wrap",
          }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <p style={{
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "3.5rem", fontWeight: 400, color: "#1A1A18",
                lineHeight: 1, marginBottom: "0.3rem",
              }}>
                {avgRating}
              </p>
              <Stars rating={avgRating} size="lg" />
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.68rem",
                color: "var(--muted)", opacity: 0.55, marginTop: "0.3rem",
                letterSpacing: "0.08em",
              }}>
                {activeReviews.length} reviews
              </p>
            </div>

            <div style={{ flex: 1, minWidth: "160px" }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = activeReviews.filter(r => Math.round(r.rating) === star).length;
                const pct = activeReviews.length > 0 ? (count / activeReviews.length) * 100 : 0;
                return (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                    <span style={{
                      fontFamily: "var(--font-jost)", fontSize: "0.7rem",
                      color: "var(--muted)", opacity: 0.65, minWidth: "10px", textAlign: "right",
                    }}>
                      {star}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#C4440A">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div style={{
                      flex: 1, height: "5px",
                      background: "var(--warm-tan)", borderRadius: "2px", overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: "var(--burnt-orange)", transition: "width 0.4s ease",
                      }} />
                    </div>
                    <span style={{
                      fontFamily: "var(--font-jost)", fontSize: "0.68rem",
                      color: "var(--muted)", opacity: 0.5, minWidth: "12px",
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual reviews */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {visibleReviews.map((review, i) => (
              <div
                key={review.id}
                style={{
                  padding: "1.5rem 0",
                  borderBottom: i < visibleReviews.length - 1 ? "1px solid var(--warm-tan)" : "none",
                }}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "flex-start", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem",
                }}>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.82rem", color: "#1A1A18", marginBottom: "0.25rem",
                    }}>
                      @{review.reviewer?.username ?? "buyer"}
                    </p>
                    <Stars rating={review.rating} />
                  </div>
                  <p style={{
                    fontFamily: "var(--font-jost)", fontSize: "0.7rem",
                    color: "var(--muted)", opacity: 0.5,
                  }}>
                    {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.85rem",
                  color: "var(--muted)", lineHeight: 1.75,
                  marginBottom: "0.5rem",
                }}>
                  {review.comment}
                </p>

                {review.listing?.title && (
                  <p style={{
                    fontFamily: "var(--font-jost)", fontSize: "0.7rem",
                    color: "var(--muted)", opacity: 0.5,
                    letterSpacing: "0.04em",
                  }}>
                    Purchased: {review.listing.title}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Show more / less */}
          {activeReviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(v => !v)}
              style={{
                marginTop: "1.5rem",
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "0.65rem 1.4rem",
                background: "transparent", color: "var(--muted)",
                border: "1px solid var(--warm-tan)", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
            >
              {showAllReviews
                ? `Show less`
                : `Show all ${activeReviews.length} reviews`}
            </button>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .listings-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
