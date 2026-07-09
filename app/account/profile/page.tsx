"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  email: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface SavedListing {
  id: string;
  listing_id: string;
  title: string;
  price: number;
  rent_price: number | null;
  type: string;
  images: string[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const [profile, setProfile]   = useState<ProfileData | null>(null);
  const [saved, setSaved]       = useState<SavedListing[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      // Fetch seller profile for username / display_name
      const { data: sp } = await supabase
        .from("seller_profiles")
        .select("username, display_name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile({
        email:        user.email ?? "",
        display_name: sp?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "You",
        username:     sp?.username ?? "",
        avatar_url:   sp?.avatar_url ?? null,
      });

      // Fetch saved listings
      const { data: savedRows } = await supabase
        .from("saved_listings")
        .select("id, listing_id")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (savedRows?.length) {
        const ids = savedRows.map(r => r.listing_id);
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, price, rent_price, type, images")
          .in("id", ids);

        const merged: SavedListing[] = savedRows.map(r => {
          const l = listings?.find(x => x.id === r.listing_id);
          return {
            id:         r.id,
            listing_id: r.listing_id,
            title:      l?.title ?? "Item",
            price:      l?.price ?? 0,
            rent_price: l?.rent_price ?? null,
            type:       l?.type ?? "sale",
            images:     l?.images ?? [],
          };
        }).filter(r => r.title !== "Item" || r.price > 0);

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

  return (
    <div style={{ maxWidth: "760px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem", paddingBottom: "2rem", borderBottom: "1px solid var(--warm-tan)" }}>
        {/* Avatar */}
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "#C4440A", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "1.25rem", color: "#fff" }}>
              {initials}
            </span>
          )}
        </div>

        {/* Name + meta */}
        <div>
          <h1 style={{
            fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
            fontSize: "1.75rem", color: "#1A1A18", margin: "0 0 0.2rem",
          }}>
            {profile?.display_name ?? "Your Profile"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {profile?.username && (
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.7 }}>
                @{profile.username}
              </span>
            )}
            {saved.length > 0 && (
              <span style={{
                fontFamily: "var(--font-jost)", fontSize: "0.78rem",
                color: "#C4440A", opacity: 0.85,
              }}>
                {saved.length} saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Saved items ── */}
      <div>
        <h2 style={{
          fontFamily: "var(--font-jost)", fontWeight: 600,
          fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--muted)", opacity: 0.6, marginBottom: "1.25rem",
        }}>
          Saved items
        </h2>

        {saved.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "1.35rem", color: "#1A1A18", marginBottom: "0.4rem",
            }}>
              Nothing saved yet
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
              Tap the heart on items you love to save them here.
            </p>
            <Link
              href="/listings"
              style={{
                fontFamily: "var(--font-jost)", fontWeight: 600,
                fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase",
                padding: "0.65rem 1.4rem", textDecoration: "none",
                background: "var(--burnt-orange)", color: "var(--cream)",
                display: "inline-block",
              }}
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1rem",
          }}>
            {saved.map(item => (
              <Link
                key={item.id}
                href={`/listings/${item.listing_id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{ background: "#fff", border: "1px solid var(--warm-tan)", overflow: "hidden", transition: "box-shadow 0.2s" }}
                  onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")}
                  onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  {/* Image */}
                  <div style={{ aspectRatio: "3/4", background: "#EDE6DE", overflow: "hidden" }}>
                    {item.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "0.65rem 0.75rem 0.75rem" }}>
                    <p style={{
                      fontFamily: "var(--font-jost)", fontWeight: 500,
                      fontSize: "0.82rem", color: "#1A1A18",
                      lineHeight: 1.3, marginBottom: "0.25rem",
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {item.title}
                    </p>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "#C4440A", margin: 0 }}>
                      {item.type === "rent"
                        ? `$${item.rent_price}/day`
                        : `$${item.price.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
