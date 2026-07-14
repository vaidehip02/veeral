"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ListingStatus = "active" | "draft" | "sold" | "rented" | "archived";

interface SellerListing {
  id: string;
  title: string | null;
  price: number | null;
  rent_price: number | null;
  status: ListingStatus;
  images: string[];
  category: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<ListingStatus, { bg: string; text: string; label: string }> = {
  active:   { bg: "#E8F5E9", text: "#2D6A4F", label: "Active" },
  draft:    { bg: "#F5F0EB", text: "#7A5C3A", label: "Draft" },
  sold:     { bg: "#FFF3E0", text: "#E65100", label: "Sold" },
  rented:   { bg: "#E3F2FD", text: "#1D4E89", label: "On rent" },
  archived: { bg: "#F5F5F5", text: "#757575", label: "Archived" },
};

type FilterTab = "all" | ListingStatus;

const FILTERS: { label: string; value: FilterTab }[] = [
  { label: "All",      value: "all" },
  { label: "Active",   value: "active" },
  { label: "Drafts",   value: "draft" },
  { label: "Sold",     value: "sold" },
  { label: "Archived", value: "archived" },
];

export default function ListingsPage() {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterTab>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("listings")
        .select("id, title, price, rent_price, status, images, category, created_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      setListings((data ?? []) as SellerListing[]);
      setLoading(false);
    });
  }, []);

  async function deleteDraft(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/listings/draft/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListings(prev => prev.filter(l => l.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  const visible = listings.filter(l =>
    filter === "all" || l.status === filter
  );

  const draftCount  = listings.filter(l => l.status === "draft").length;
  const activeCount = listings.filter(l => l.status === "active").length;

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
            Your Listings
          </h1>
          {!loading && (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
              {activeCount} active{draftCount > 0 ? ` · ${draftCount} draft${draftCount !== 1 ? "s" : ""}` : ""}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/listings/new"
          style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", textDecoration: "none", background: "var(--burnt-orange)", color: "var(--cream)", transition: "opacity 0.2s" }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          + Create new listing
        </Link>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.65rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.4rem 1rem", border: "1px solid", borderColor: filter === f.value ? "var(--burnt-orange)" : "var(--warm-tan)", background: filter === f.value ? "var(--burnt-orange)" : "transparent", color: filter === f.value ? "var(--cream)" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}
          >
            {f.label}
            {f.value === "draft" && draftCount > 0 && (
              <span style={{ marginLeft: "0.4rem", background: filter === "draft" ? "rgba(255,255,255,0.25)" : "#C4440A", color: filter === "draft" ? "var(--cream)" : "#fff", borderRadius: "999px", padding: "0.05rem 0.45rem", fontSize: "0.6rem", fontWeight: 700 }}>
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading listings…
        </div>
      )}

      {/* Empty */}
      {!loading && visible.length === 0 && (
        <div style={{ padding: "4rem 2rem", textAlign: "center", border: "1px dashed var(--warm-tan)" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.4rem", color: "#1A1A18", marginBottom: "0.4rem" }}>
            {filter === "draft" ? "No drafts yet" : "No listings here yet"}
          </p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6, marginBottom: "1.5rem" }}>
            {filter === "draft"
              ? "Start a listing and click \"Save as draft\" to pick it up later."
              : "Create your first listing to get started."}
          </p>
          <Link href="/dashboard/listings/new" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem", textDecoration: "none", background: "var(--burnt-orange)", color: "var(--cream)", display: "inline-block" }}>
            Create a listing
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(listing => {
            const badge = STATUS_BADGE[listing.status] ?? STATUS_BADGE.active;
            const thumb = listing.images?.[0] ?? null;
            const isDraft = listing.status === "draft";

            return (
              <div
                key={listing.id}
                style={{ background: "#fff", border: `1px solid ${isDraft ? "#D4C4A8" : "var(--warm-tan)"}`, overflow: "hidden", position: "relative" }}
              >
                {/* Draft diagonal stripe indicator */}
                {isDraft && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "repeating-linear-gradient(90deg, #C4440A 0px, #C4440A 8px, transparent 8px, transparent 16px)" }} />
                )}

                {/* Thumbnail */}
                <div style={{ aspectRatio: "4/3", background: "#EDE6DE", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={listing.title ?? "Draft"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--muted)", opacity: 0.4, textTransform: "uppercase" }}>
                      {listing.category ?? "No photo yet"}
                    </span>
                  )}
                </div>

                <div style={{ padding: "0.9rem 1rem 0.85rem" }}>
                  {/* Status badge */}
                  <span style={{ display: "inline-block", marginBottom: "0.45rem", padding: "0.18rem 0.6rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    {badge.label}
                  </span>

                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: isDraft ? "#9A8A7E" : "#1A1A18", marginBottom: "0.35rem", lineHeight: 1.35, fontStyle: isDraft && !listing.title ? "italic" : "normal" }}>
                    {listing.title ?? "Untitled draft"}
                  </p>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.85rem", minHeight: "1.4rem" }}>
                    {listing.price != null ? (
                      <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.1rem", color: isDraft ? "#9A8A7E" : "#1A1A18" }}>
                        ${(listing.price / 100).toLocaleString()}
                      </span>
                    ) : isDraft ? (
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.5, fontStyle: "italic" }}>Price not set</span>
                    ) : null}
                    {listing.rent_price != null && (
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.65 }}>
                        · ${(listing.rent_price / 100).toLocaleString()}/day
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--warm-tan)", paddingTop: "0.75rem" }}>
                    {isDraft ? (
                      <>
                        {/* Resume — goes back into the create form pre-filled */}
                        <Link
                          href={`/dashboard/listings/new?draft=${listing.id}`}
                          style={{ flex: 2, textAlign: "center", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.5rem 0", color: "var(--cream)", background: "#C4440A", border: "1px solid #C4440A", textDecoration: "none", transition: "opacity 0.15s" }}
                          onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                        >
                          Resume draft
                        </Link>
                        <button
                          onClick={() => deleteDraft(listing.id)}
                          disabled={deleting === listing.id}
                          style={{ flex: 1, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.5rem 0", color: "#C0392B", border: "1px solid #FADADD", background: "transparent", cursor: deleting === listing.id ? "not-allowed" : "pointer", opacity: deleting === listing.id ? 0.5 : 1, transition: "border-color 0.15s" }}
                          onMouseOver={e => { if (deleting !== listing.id) e.currentTarget.style.borderColor = "#C0392B"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "#FADADD"; }}
                        >
                          {deleting === listing.id ? "…" : "Delete"}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/listings/${listing.id}`}
                          style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.45rem 0", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none", transition: "border-color 0.15s" }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = "var(--muted)"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "var(--warm-tan)"; }}
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/listings/new?edit=${listing.id}`}
                          style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.45rem 0", color: "#C4440A", border: "1px solid #C4440A", textDecoration: "none", transition: "opacity 0.15s" }}
                          onMouseOver={e => { e.currentTarget.style.opacity = "0.75"; }}
                          onMouseOut={e => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Edit
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
