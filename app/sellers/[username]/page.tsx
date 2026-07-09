"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SellerProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
}

interface ActiveListing {
  id: string;
  title: string;
  price: number;
  rent_price: number | null;
  type: "sale" | "rent" | "both";
  images: string[];
  condition: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_username: string | null;
  listing_title: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span style={{ color: "#C4440A", fontSize: size === "lg" ? "1.25rem" : "0.85rem", letterSpacing: "0.05em" }}>
      {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(empty)}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

type FilterTab = "all" | "sale" | "rent";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellerProfilePage({ params }: { params: { username: string } }) {
  const [profile,      setProfile]      = useState<SellerProfile | null>(null);
  const [listings,     setListings]     = useState<ActiveListing[]>([]);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [salesCount,   setSalesCount]   = useState(0);
  const [rentalsCount, setRentalsCount] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [activeTab,    setActiveTab]    = useState<FilterTab>("all");
  const [showAll,      setShowAll]      = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // 1. Look up seller profile by username
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("id, username, display_name, avatar_url, bio, location, created_at")
        .eq("username", params.username)
        .single();

      if (!sp) { setNotFound(true); setLoading(false); return; }
      setProfile(sp as SellerProfile);

      // 2. Active listings (public — only active status)
      const { data: listingRows } = await supabase
        .from("listings")
        .select("id, title, price, rent_price, type, images, condition")
        .eq("seller_id", sp.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setListings((listingRows ?? []) as ActiveListing[]);

      // 3. Completed order counts — sales vs rentals (seller perspective only)
      const { data: orderRows } = await supabase
        .from("orders")
        .select("id, rental_start, status")
        .eq("seller_id", sp.id)
        .in("status", ["delivered", "deposit_released", "deposit_resolved"]);

      if (orderRows) {
        setSalesCount(orderRows.filter(o => o.rental_start === null).length);
        setRentalsCount(orderRows.filter(o => o.rental_start !== null).length);
      }

      // 4. Reviews for this seller
      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id, listing_id")
        .eq("seller_id", sp.id)
        .order("created_at", { ascending: false });

      if (reviewRows?.length) {
        const reviewerIds = Array.from(new Set(reviewRows.map(r => r.reviewer_id).filter(Boolean)));
        const listingIds  = Array.from(new Set(reviewRows.map(r => r.listing_id).filter(Boolean)));

        const [{ data: reviewerProfiles }, { data: reviewListings }] = await Promise.all([
          supabase.from("seller_profiles").select("id, username").in("id", reviewerIds),
          supabase.from("listings").select("id, title").in("id", listingIds),
        ]);

        setReviews(reviewRows.map(r => ({
          id:               r.id,
          rating:           r.rating,
          comment:          r.comment,
          created_at:       r.created_at,
          reviewer_username: reviewerProfiles?.find(p => p.id === r.reviewer_id)?.username ?? null,
          listing_title:    reviewListings?.find(l => l.id === r.listing_id)?.title ?? null,
        })));
      }

      setLoading(false);
    }

    load();
  }, [params.username]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <div style={{ height: "220px", background: "#E8DDD3" }} />
        <div className="max-w-5xl mx-auto" style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6 }}>
          Loading…
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────────

  if (notFound || !profile) {
    return (
      <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
        <div style={{ height: "220px", background: "#E8DDD3" }} />
        <div className="max-w-5xl mx-auto" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.75rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
            User not found
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
            @{params.username} doesn&apos;t exist or has been removed.
          </p>
          <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", background: "var(--burnt-orange)", color: "var(--cream)", textDecoration: "none", display: "inline-block" }}>
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;

  const initials = profile.display_name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const filteredListings = listings.filter(l => {
    if (activeTab === "sale") return l.type === "sale" || l.type === "both";
    if (activeTab === "rent") return l.type === "rent" || l.type === "both";
    return true;
  });

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all",  label: "All" },
    { id: "sale", label: "For Sale" },
    { id: "rent", label: "For Rent" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>

      {/* Banner */}
      <div style={{ width: "100%", height: "200px", background: "#E8DDD3" }} />

      <div className="max-w-5xl mx-auto" style={{ padding: "0 1.5rem" }}>

        {/* Avatar row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginTop: "-48px", marginBottom: "1.5rem" }}>
          <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: profile.avatar_url ? "transparent" : "#C4440A", border: "4px solid var(--cream)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1.5rem", color: "#fff" }}>{initials}</span>
            )}
          </div>
          <Link
            href={`/account/messages`}
            style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.6rem 1.4rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none", marginBottom: "0.25rem", transition: "border-color 0.15s", display: "inline-block" }}
          >
            Message
          </Link>
        </div>

        {/* Name */}
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "#1A1A18", lineHeight: 1.1, marginBottom: "0.2rem" }}>
          {profile.display_name}
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "0.75rem", letterSpacing: "0.04em" }}>
          @{profile.username}
        </p>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75, maxWidth: "520px", marginBottom: "0.75rem" }}>
            {profile.bio}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem", alignItems: "center" }}>
          {profile.location && (
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
              📍 {profile.location}
            </span>
          )}
          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
            Member since {memberSince(profile.created_at)}
          </span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 0, flexWrap: "wrap", borderTop: "1px solid var(--warm-tan)", borderBottom: "1px solid var(--warm-tan)", marginBottom: "3rem" }}>
          {[
            { value: listings.length,   label: "Listings" },
            { value: salesCount > 0 || rentalsCount > 0
                ? `${salesCount > 0 ? `${salesCount} sold` : ""}${salesCount > 0 && rentalsCount > 0 ? " · " : ""}${rentalsCount > 0 ? `${rentalsCount} rented` : ""}`
                : "—",
              label: "Completed" },
            { value: avgRating !== null ? `${avgRating} ★` : "—", label: `${reviews.length} review${reviews.length !== 1 ? "s" : ""}` },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ flex: "1 1 100px", minWidth: "100px", padding: "1.25rem 1rem", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid var(--warm-tan)" : "none" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: typeof stat.value === "string" && stat.value.length > 6 ? "1.1rem" : "1.6rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1, wordBreak: "break-word" }}>
                {stat.value}
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginTop: "0.3rem" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Listings ── */}
        <section style={{ marginBottom: "4rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.6rem", color: "#1A1A18" }}>
              Listings
            </h2>
            {listings.length > 0 && (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.4rem 1rem", border: "1px solid", borderColor: activeTab === tab.id ? "var(--burnt-orange)" : "var(--warm-tan)", background: activeTab === tab.id ? "var(--burnt-orange)" : "transparent", color: activeTab === tab.id ? "var(--cream)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {listings.length === 0 ? (
            <div style={{ padding: "3rem 0", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.25rem", color: "#1A1A18", marginBottom: "0.35rem" }}>No listings yet</p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6 }}>This seller hasn&apos;t posted anything yet.</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5, textAlign: "center", padding: "3rem 0" }}>No listings in this category.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
              {filteredListings.map(l => (
                <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid var(--warm-tan)", overflow: "hidden", transition: "box-shadow 0.2s" }}
                    onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
                    onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div style={{ aspectRatio: "3/4", background: "#EDE6DE", overflow: "hidden", position: "relative" }}>
                      {l.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.images[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      <span style={{ position: "absolute", top: "0.5rem", left: "0.5rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.2rem 0.5rem", background: l.type === "rent" ? "#E3F2FD" : l.type === "both" ? "rgba(201,92,26,0.9)" : "rgba(26,26,24,0.75)", color: l.type === "rent" ? "#1D4E89" : "var(--cream)" }}>
                        {l.type === "both" ? "Sale + Rent" : l.type === "rent" ? "Rent only" : "For Sale"}
                      </span>
                    </div>
                    <div style={{ padding: "0.75rem 0.85rem 0.85rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18", lineHeight: 1.35, marginBottom: "0.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {l.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", flexWrap: "wrap" }}>
                        {(l.type === "sale" || l.type === "both") && (
                          <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem", color: "#C4440A" }}>
                            ${l.price.toLocaleString()}
                          </span>
                        )}
                        {l.rent_price && (l.type === "rent" || l.type === "both") && (
                          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7 }}>
                            {l.type === "both" ? "· " : ""}${l.rent_price}/day
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

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <section style={{ marginBottom: "4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.6rem", color: "#1A1A18", whiteSpace: "nowrap" }}>Reviews</h2>
              <div style={{ flex: 1, height: "1px", background: "var(--warm-tan)" }} />
            </div>

            {/* Aggregate card */}
            <div style={{ display: "flex", alignItems: "center", gap: "2.5rem", background: "#fff", border: "1px solid var(--warm-tan)", padding: "1.75rem 2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "3.5rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1, marginBottom: "0.3rem" }}>
                  {avgRating}
                </p>
                {avgRating !== null && <Stars rating={avgRating} size="lg" />}
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.55, marginTop: "0.3rem" }}>
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: "160px" }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => Math.round(r.rating) === star).length;
                  const pct = (count / reviews.length) * 100;
                  return (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.65, minWidth: "10px", textAlign: "right" }}>{star}</span>
                      <span style={{ color: "#C4440A", fontSize: "0.7rem" }}>★</span>
                      <div style={{ flex: 1, height: "5px", background: "var(--warm-tan)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--burnt-orange)" }} />
                      </div>
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.5, minWidth: "12px" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual reviews */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {visibleReviews.map((r, i) => (
                <div key={r.id} style={{ padding: "1.5rem 0", borderBottom: i < visibleReviews.length - 1 ? "1px solid var(--warm-tan)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: "#1A1A18", marginBottom: "0.2rem" }}>
                        @{r.reviewer_username ?? "buyer"}
                      </p>
                      <Stars rating={r.rating} />
                    </div>
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.5 }}>
                      {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.75, marginBottom: "0.4rem" }}>
                    {r.comment}
                  </p>
                  {r.listing_title && (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.5 }}>
                      Purchased: {r.listing_title}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {reviews.length > 3 && (
              <button onClick={() => setShowAll(v => !v)} style={{ marginTop: "1.5rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}
                onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
                onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
              >
                {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
