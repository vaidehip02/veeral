"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface FeedListing {
  id: string;
  title: string;
  price: number;
  rent_price: number | null;
  type: "sale" | "rent" | "both";
  images: string[];
  condition: string;
  created_at: string;
  seller_id: string;
  seller_username: string | null;
  seller_display_name: string | null;
}

interface FollowedSeller {
  id: string;
  username: string;
  display_name: string;
}

export default function FollowingPage() {
  const [listings, setListings] = useState<FeedListing[]>([]);
  const [sellers, setSellers] = useState<FollowedSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [feedRes, followRes] = await Promise.all([
        fetch("/api/follows/feed"),
        fetch("/api/follows"),
      ]);
      const { listings: feedListings } = await feedRes.json();
      const { following: sellerIds } = await followRes.json();

      setListings(feedListings ?? []);

      // Fetch seller profiles for the people they follow
      if (sellerIds?.length) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("seller_profiles")
          .select("id, username, display_name")
          .in("id", sellerIds);
        setSellers(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5, paddingTop: "3rem" }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.6rem, 3vw, 2rem)", color: "#1A1A18", marginBottom: "0.25rem" }}>
        Following
      </h1>
      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "2rem" }}>
        New listings from sellers you follow
      </p>

      {/* Followed sellers chips */}
      {sellers.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
          {sellers.map(s => (
            <Link key={s.id} href={`/sellers/${s.username}`}
              style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", fontWeight: 500, padding: "0.35rem 0.85rem", border: "1px solid var(--warm-tan)", color: "var(--muted)", textDecoration: "none", background: "transparent", transition: "border-color 0.15s" }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--burnt-orange)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
            >
              @{s.username}
            </Link>
          ))}
        </div>
      )}

      {listings.length === 0 ? (
        <div style={{ paddingTop: "4rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.4rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
            {sellers.length === 0 ? "You aren't following anyone yet" : "No new listings from people you follow"}
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
            {sellers.length === 0
              ? "Visit a seller's profile and click Follow to see their new listings here."
              : "Check back when they post something new."}
          </p>
          <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", background: "var(--burnt-orange)", color: "var(--cream)", textDecoration: "none", display: "inline-block" }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.25rem" }}>
          {listings.map(l => (
            <Link key={l.id} href={`/listings/${l.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{ background: "#fff", border: "1px solid var(--warm-tan)", overflow: "hidden", transition: "box-shadow 0.2s" }}
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
                  {l.seller_username && (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--burnt-orange)", opacity: 0.8, marginBottom: "0.2rem", letterSpacing: "0.04em" }}>
                      @{l.seller_username}
                    </p>
                  )}
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18", lineHeight: 1.35, marginBottom: "0.4rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {l.title}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", flexWrap: "wrap" }}>
                    {(l.type === "sale" || l.type === "both") && (
                      <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem", color: "#C4440A" }}>
                        ${(l.price / 100).toLocaleString()}
                      </span>
                    )}
                    {l.rent_price && (l.type === "rent" || l.type === "both") && (
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7 }}>
                        {l.type === "both" ? "· " : ""}${(l.rent_price / 100).toLocaleString()}/day
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
