"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function SavedItemsPage() {
  const [items,   setItems]   = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: savedRows } = await supabase
        .from("saved_listings")
        .select("id, listing_id")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (!savedRows?.length) { setLoading(false); return; }

      const listingIds = savedRows.map(r => r.listing_id);

      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, price, rent_price, type, images, seller_id, status")
        .in("id", listingIds);

      const sellerIds = [...new Set((listings ?? []).map(l => l.seller_id).filter(Boolean))];
      const { data: sellerProfiles } = sellerIds.length
        ? await supabase.from("seller_profiles").select("id, username").in("id", sellerIds)
        : { data: [] };

      setItems(savedRows.map(r => {
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
      }));

      setLoading(false);
    });
  }, []);

  const remove = (savedId: string) => setItems(prev => prev.filter(i => i.saved_id !== savedId));

  return (
    <div style={{ maxWidth: "860px" }}>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Saved Items
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : `${items.length} saved item${items.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading saved items…
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
            Nothing saved yet
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
            Heart any listing to save it here
          </p>
          <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", textDecoration: "none", background: "var(--burnt-orange)", color: "var(--cream)", display: "inline-block" }}>
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="saved-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.1rem" }}>
          {items.map(item => (
            <div key={item.saved_id} style={{ background: "#fff", border: "1px solid var(--warm-tan)", overflow: "hidden", position: "relative" }}>

              <div style={{ aspectRatio: "3/4", background: "#EDE6DE", position: "relative", overflow: "hidden" }}>
                {item.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.images[0]} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}

                {/* Remove button */}
                <button
                  onClick={() => remove(item.saved_id)}
                  title="Remove from saved"
                  style={{ position: "absolute", top: "0.6rem", right: "0.6rem", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#C4440A", transition: "background 0.15s" }}
                  onMouseOver={e => (e.currentTarget.style.background = "#fff")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.9)")}
                >
                  ♥
                </button>

                {/* Unavailable overlay */}
                {!item.available && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,24,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", textAlign: "center" }}>
                      No longer available
                    </p>
                    <Link href="/listings" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.35rem 0.75rem", background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)", textDecoration: "none" }}>
                      Shop similar
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ padding: "0.8rem 0.9rem 0.75rem" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: item.available ? "#1A1A18" : "#999", lineHeight: 1.35, marginBottom: "0.3rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.title}
                </p>

                {item.available ? (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.05rem", color: "#C4440A" }}>
                      {item.type === "rent" && item.rent_price ? `$${item.rent_price}/day` : `$${item.price.toLocaleString()}`}
                    </span>
                    {item.rent_price && item.type === "both" && (
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7 }}>
                        · ${item.rent_price}/day
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#999", marginBottom: "0.25rem" }}>—</p>
                )}

                {item.seller_username && (
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.55 }}>
                    @{item.seller_username}
                  </p>
                )}
              </div>

              {item.available && (
                <Link href={`/listings/${item.listing_id}`} style={{ display: "block", padding: "0.55rem", borderTop: "1px solid var(--warm-tan)", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)", textAlign: "center", textDecoration: "none", transition: "background 0.15s, color 0.15s" }}
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

      <style>{`
        @media (max-width: 640px) {
          .saved-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}
