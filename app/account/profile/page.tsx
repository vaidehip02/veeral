"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface SavedItem {
  saved_id: string;
  listing_id: string;
  title: string;
  price: number;
  rent_price: number | null;
  type: string;
  images: string[];
  seller_username: string | null;
  available: boolean;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const [profile,       setProfile]       = useState<ProfileData | null>(null);
  const [saved,         setSaved]         = useState<SavedItem[]>([]);
  const [activeOrders,  setActiveOrders]  = useState(0);
  const [activeRentals, setActiveRentals] = useState(0);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      // Fetch in parallel: seller profile, active order counts, saved listings
      const [
        { data: sp },
        { data: orderRows },
        { data: savedRows },
      ] = await Promise.all([
        supabase
          .from("seller_profiles")
          .select("display_name, username, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("orders")
          .select("id, rental_start, status")
          .eq("buyer_id", user.id)
          .not("status", "in", '("delivered","deposit_released","deposit_resolved","cancelled","refunded")'),
        supabase
          .from("saved_listings")
          .select("id, listing_id")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false }),
      ]);

      setProfile({
        display_name: sp?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You",
        username:     sp?.username ?? "",
        avatar_url:   sp?.avatar_url ?? null,
      });

      if (orderRows) {
        setActiveOrders(orderRows.filter(o => o.rental_start === null).length);
        setActiveRentals(orderRows.filter(o => o.rental_start !== null).length);
      }

      if (savedRows?.length) {
        const listingIds = savedRows.map(r => r.listing_id);

        // Fetch without status filter — RLS will return active ones; missing = unavailable
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, price, rent_price, type, images, seller_id, status")
          .in("id", listingIds);

        // Also get seller usernames for available listings
        const sellerIds = [...new Set((listings ?? []).map(l => l.seller_id).filter(Boolean))];
        const { data: sellerProfiles } = sellerIds.length
          ? await supabase.from("seller_profiles").select("id, username").in("id", sellerIds)
          : { data: [] };

        const merged: SavedItem[] = savedRows.map(r => {
          const l = listings?.find(x => x.id === r.listing_id);
          const s = sellerProfiles?.find(x => x.id === l?.seller_id);
          return {
            saved_id:        r.id,
            listing_id:      r.listing_id,
            title:           l?.title ?? "Item",
            price:           l?.price ?? 0,
            rent_price:      l?.rent_price ?? null,
            type:            l?.type ?? "sale",
            images:          l?.images ?? [],
            seller_username: s?.username ?? null,
            available:       !!(l && l.status === "active"),
          };
        });

        setSaved(merged);
      }

      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6, padding: "3rem 0" }}>
        Loading…
      </div>
    );
  }

  const initials = profile ? getInitials(profile.display_name) : "?";

  const STAT_TILES = [
    { label: "Active Orders",  value: activeOrders,  href: "/account/orders"  },
    { label: "Active Rentals", value: activeRentals, href: "/account/rentals" },
    { label: "Saved Items",    value: saved.length,  href: "/account/saved"   },
  ];

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* ── Profile header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--warm-tan)" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#C4440A", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1.25rem", color: "#fff" }}>{initials}</span>
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.75rem", color: "#1A1A18", margin: "0 0 0.2rem" }}>
            {profile?.display_name ?? "Your Profile"}
          </h1>
          {profile?.username && (
            <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.7 }}>
              @{profile.username}
            </span>
          )}
        </div>
      </div>

      {/* ── Stat tiles ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
        {STAT_TILES.map(tile => (
          <Link key={tile.label} href={tile.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "#fff", border: "1px solid var(--warm-tan)", padding: "1.25rem 1rem", transition: "box-shadow 0.2s", cursor: "pointer" }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)")}
              onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "0.5rem" }}>
                {tile.label}
              </p>
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "2rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1 }}>
                {tile.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Saved items ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.6 }}>
            Saved Items
          </p>
          {saved.length > 0 && (
            <Link href="/account/saved" style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--burnt-orange)", textDecoration: "none", letterSpacing: "0.04em" }}>
              View all →
            </Link>
          )}
        </div>

        {saved.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.35rem", color: "#1A1A18", marginBottom: "0.4rem" }}>
              Nothing saved yet
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
              Tap the heart on items you love to save them here.
            </p>
            <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", textDecoration: "none", background: "var(--burnt-orange)", color: "var(--cream)", display: "inline-block" }}>
              Browse listings
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {saved.map(item => (
              <div key={item.saved_id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", overflow: "hidden", position: "relative" }}>
                <div style={{ aspectRatio: "3/4", background: "#EDE6DE", overflow: "hidden", position: "relative" }}>
                  {item.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                  {!item.available && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,24,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#fff", textAlign: "center" }}>
                        No longer available
                      </p>
                      <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.13em", textTransform: "uppercase", padding: "0.32rem 0.7rem", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)", textDecoration: "none" }}>
                        Shop similar
                      </Link>
                    </div>
                  )}
                </div>
                <div style={{ padding: "0.75rem 0.85rem 0.85rem" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: item.available ? "#1A1A18" : "#999", lineHeight: 1.3, marginBottom: "0.25rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {item.title}
                  </p>
                  {item.available ? (
                    <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "#C4440A", margin: "0 0 0.2rem" }}>
                      {item.type === "rent" && item.rent_price ? `$${item.rent_price}/day` : `$${item.price.toLocaleString()}`}
                    </p>
                  ) : (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#999", margin: "0 0 0.2rem" }}>—</p>
                  )}
                  {item.seller_username && (
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.55 }}>@{item.seller_username}</p>
                  )}
                </div>
                {item.available && (
                  <Link href={`/listings/${item.listing_id}`} style={{ display: "block", padding: "0.5rem", borderTop: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", textAlign: "center", textDecoration: "none", transition: "background 0.15s, color 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "var(--burnt-orange)"; e.currentTarget.style.color = "var(--cream)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
                  >
                    View listing
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
