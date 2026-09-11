"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateTrackingNumber } from "@/lib/rentals/validateTracking";
import MessageButton from "@/components/messages/MessageButton";
import { BUYER_LIST_STATUS } from "@/lib/orderStatus";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "all" | "purchases" | "rentals";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
type RentalStatus =
  | "pending" | "paid" | "shipped" | "delivered"
  | "return_pending" | "deposit_released" | "damage_claimed"
  | "deposit_resolved" | "cancelled" | "refunded";

interface PurchaseRow {
  id: string;
  listing_id: string;
  seller_id: string;
  amount: number;
  status: OrderStatus | RentalStatus;
  created_at: string;
  title: string;
  images: string[];
  size: string | null;
  seller_username: string;
  tracking?: string;
  // sale-only
  shipping_cents?: number | null;
  // rental-only
  isRental: boolean;
  rental_start?: string | null;
  rental_end?: string | null;
  deposit_amount?: number | null;
  listing_price?: number | null;
  deposit_held?: boolean;
  deposit_release_amount?: number | null;
  deposit_release_reason?: string | null;
  return_tracking_number?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function trackingUrl(num: string): string {
  const n = num.trim().replace(/\s+/g, "");
  if (/^1Z/i.test(n) || /^\d{18}$/.test(n)) return `https://www.ups.com/track?tracknum=${n}`;
  if (/^(94|92|93|95)\d{18,20}$/.test(n) || /^[0-9]{20,22}$/.test(n)) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
  if (/^\d{12}$/.test(n) || /^\d{15}$/.test(n) || /^\d{20}$/.test(n) || /^\d{22}$/.test(n)) return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${n}`;
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
}

function getDaysLeft(returnBy: string) {
  return Math.ceil((new Date(returnBy).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Badge { bg: string; text: string; label: string }

function getCountdownBadge(days: number): Badge {
  if (days < 0)  return { bg: "#FDECEA", text: "#C62828", label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue` };
  if (days <= 2) return { bg: "#FFF8E1", text: "#E65100", label: `${days} day${days !== 1 ? "s" : ""} left` };
  return               { bg: "#E8F5E9", text: "#2D6A4F", label: `${days} days left` };
}

function rentalStatusBadge(status: RentalStatus): Badge {
  switch (status) {
    case "pending":
    case "paid":
    case "shipped":
    case "delivered":        return { bg: "#E8F5E9", text: "#2D6A4F", label: "Active" };
    case "return_pending":   return { bg: "#FEF3C7", text: "#92400E", label: "Return pending" };
    case "deposit_released": return { bg: "#D1FAE5", text: "#065F46", label: "Deposit released" };
    case "damage_claimed":   return { bg: "#FFF5F5", text: "#991B1B", label: "Damage claim" };
    case "deposit_resolved": return { bg: "#EDE9FE", text: "#5B21B6", label: "Claim resolved" };
    case "cancelled":        return { bg: "#FEE2E2", text: "#991B1B", label: "Cancelled" };
    case "refunded":         return { bg: "#EDE9FE", text: "#5B21B6", label: "Refunded" };
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PurchasesContent() {
  const sp = useSearchParams();
  const [rows, setRows]               = useState<PurchaseRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<Tab>((sp.get("tab") as Tab) ?? "all");
  const [reviewDrawer, setReviewDrawer] = useState<{ orderId: string; title: string; sellerUsername: string; rating: number; text: string } | null>(null);
  const [submitted, setSubmitted]     = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [instructionsId, setInstructionsId] = useState<string | null>(null);
  const [returnDrawerId, setReturnDrawerId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput]   = useState("");
  const [trackingError, setTrackingError]   = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rawOrders } = await supabase
        .from("orders")
        .select(
          "id, listing_id, seller_id, amount, platform_fee, shipping_cents, status, created_at, " +
          "rental_start, rental_end, deposit_amount, deposit_held, deposit_release_amount, " +
          "deposit_release_reason, return_tracking_number, return_noted_at"
        )
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (!rawOrders?.length) { setLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = rawOrders as any[];
      const listingIds = Array.from(new Set(raw.map((o) => o.listing_id as string)));
      const sellerIds  = Array.from(new Set(raw.map((o) => o.seller_id as string)));

      const [{ data: listings }, { data: sellers }] = await Promise.all([
        supabase.from("listings").select("id, title, images, size, category, price, type").in("id", listingIds),
        supabase.from("seller_profiles").select("id, username").in("id", sellerIds),
      ]);

      const merged: PurchaseRow[] = raw.map((o) => {
        const l = listings?.find((x) => x.id === o.listing_id);
        const s = sellers?.find((x) => x.id === o.seller_id);
        const isRental = !!o.rental_start;
        return {
          id:              o.id,
          listing_id:      o.listing_id,
          seller_id:       o.seller_id,
          amount:          o.amount,
          status:          o.status,
          created_at:      o.created_at,
          title:           l?.title ?? "Item",
          images:          l?.images ?? [],
          size:            l?.size ?? null,
          seller_username: s?.username ?? "",
          isRental,
          ...(isRental ? {
            rental_start:           o.rental_start,
            rental_end:             o.rental_end,
            deposit_amount:         o.deposit_amount ?? null,
            deposit_held:           o.deposit_held ?? false,
            deposit_release_amount: o.deposit_release_amount ?? null,
            deposit_release_reason: o.deposit_release_reason ?? null,
            return_tracking_number: o.return_tracking_number ?? null,
            listing_price:          (l?.type === "sale" || l?.type === "both") ? (l?.price ?? null) : null,
          } : {
            shipping_cents: o.shipping_cents ?? null,
            tracking:       o.return_tracking_number ?? undefined,
          }),
        };
      });

      setRows(merged);
      setLoading(false);
    });
  }, []);

  async function submitReview() {
    if (!reviewDrawer) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: reviewDrawer.orderId, rating: reviewDrawer.rating, comment: reviewDrawer.text, reviewer_role: "buyer" }),
      });
      if (!res.ok) { const { error } = await res.json(); setSubmitError(error ?? "Something went wrong."); return; }
      setSubmitted((prev) => new Set(Array.from(prev).concat(reviewDrawer.orderId)));
      setReviewDrawer(null);
    } catch { setSubmitError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  async function markReturned(rentalId: string) {
    const validation = validateTrackingNumber(trackingInput);
    if (!validation.valid) { setTrackingError(validation.error ?? "Invalid tracking number."); return; }
    setSubmitting(true); setSubmitError(null); setTrackingError(null);
    try {
      const res = await fetch(`/api/rentals/${rentalId}/mark-returned`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_number: trackingInput.trim() || undefined }),
      });
      if (!res.ok) { const { error } = await res.json(); setSubmitError(error ?? "Something went wrong."); return; }
      setRows((prev) => prev.map((r) => r.id === rentalId ? { ...r, status: "return_pending" as RentalStatus } : r));
      setReturnDrawerId(null); setTrackingInput(""); setTrackingError(null);
    } catch { setSubmitError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  const filtered = rows.filter((r) =>
    tab === "all" ? true : tab === "rentals" ? r.isRental : !r.isRental
  );

  const activeCount = rows.filter((r) => !["delivered","cancelled","refunded","deposit_released","deposit_resolved"].includes(r.status)).length;

  const tabStyle = (t: Tab): React.CSSProperties => ({
    fontFamily: "var(--font-jost)", fontWeight: tab === t ? 600 : 400,
    fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase",
    color: tab === t ? "var(--burnt-orange)" : "var(--muted)",
    background: "none", border: "none", cursor: "pointer",
    borderBottom: tab === t ? "2px solid var(--burnt-orange)" : "2px solid transparent",
    paddingBottom: "0.5rem", paddingLeft: 0, paddingRight: 0,
    transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: "820px" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Purchases
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : `${activeCount} active`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1.75rem", borderBottom: "1px solid var(--warm-tan)", marginBottom: "1.75rem" }}>
        {(["all", "purchases", "rentals"] as Tab[]).map((t) => (
          <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
            {t === "all" ? "All" : t === "purchases" ? "Purchases" : "Rentals"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Nothing here yet.{" "}
          <Link href="/listings" style={{ color: "#C4440A", textDecoration: "underline" }}>Browse listings</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
          {filtered.map((row) => {
            const thumb = row.images[0] ?? null;

            if (row.isRental) {
              const rs = row.status as RentalStatus;
              const isActiveRental = ["pending","paid","shipped","delivered"].includes(rs);
              const isInTransit = isActiveRental && row.rental_start && new Date(row.rental_start) > new Date();
              const days = row.rental_end ? getDaysLeft(row.rental_end) : 999;
              const badge: Badge = isInTransit
                ? { bg: "#E3F2FD", text: "#1565C0", label: "In transit" }
                : isActiveRental ? getCountdownBadge(days)
                : rentalStatusBadge(rs);

              return (
                <div key={row.id} style={{ background: "#fff", padding: "1.25rem 1.5rem", borderLeft: isActiveRental ? `3px solid ${badge.text}` : "3px solid var(--warm-tan)" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                      {thumb && <img src={thumb} alt={row.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{row.title}</p>
                          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--burnt-orange)", background: "rgba(196,68,10,0.08)", padding: "0.1rem 0.4rem" }}>Rental</span>
                        </div>
                        <span style={{ padding: "0.2rem 0.6rem", background: badge.bg, color: badge.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
                          {badge.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                        {[
                          { k: "Seller", v: `@${row.seller_username}` },
                          { k: "Period", v: row.rental_start && row.rental_end ? `${fmtDate(row.rental_start)} – ${fmtDate(row.rental_end)}` : "—" },
                          ...(row.deposit_amount != null ? [{ k: "Deposit", v: `$${(row.deposit_amount / 100).toLocaleString()}` }] : []),
                        ].map(({ k, v }) => (
                          <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.75 }}>
                            <span style={{ fontWeight: 600, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.75rem" }}>{k} </span>{v}
                          </span>
                        ))}
                      </div>
                      {isActiveRental && row.rental_end && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                          <span style={{ fontWeight: 600, color: days <= 2 ? "#C62828" : "#1A1A18" }}>Ship back by {fmtDate(row.rental_end)}</span>
                        </p>
                      )}
                      {rs === "return_pending" && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#92400E", background: "#FEF3C7", padding: "0.4rem 0.75rem", marginBottom: "0.75rem", display: "inline-block" }}>
                          Return received — seller has 5 business days to inspect. Deposit auto-releases if no action.
                        </p>
                      )}
                      {rs === "damage_claimed" && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", background: "#FFF5F5", padding: "0.4rem 0.75rem", marginBottom: "0.75rem", display: "inline-block" }}>
                          The seller has filed a damage claim. Veeral admin will review and decide.
                        </p>
                      )}
                      {row.deposit_release_amount != null && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#6B5E52", marginBottom: "0.5rem" }}>
                          Deposit of <strong>${(row.deposit_release_amount / 100).toLocaleString()}</strong> released
                          {row.deposit_release_reason ? ` — ${row.deposit_release_reason}` : ""}.
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                        <Link href={`/account/orders/${row.id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}>
                          View order
                        </Link>
                        {isActiveRental && (
                          <>
                            <button onClick={() => setInstructionsId(row.id)} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>
                              Return instructions
                            </button>
                            <button onClick={() => { setReturnDrawerId(row.id); setTrackingInput(""); setSubmitError(null); }} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}>
                              Mark as returned
                            </button>
                            {row.listing_price != null && (
                              <Link
                                href={`/checkout/${row.listing_id}?buy_from_rental=1&deposit_credit=${row.deposit_amount ?? 0}`}
                                style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "#1A1A18", color: "var(--cream)", border: "none", textDecoration: "none", display: "inline-block" }}
                              >
                                Purchase — ${((row.listing_price - (row.deposit_amount ?? 0)) / 100).toLocaleString()} due
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                      {isActiveRental && row.listing_price != null && row.deposit_amount != null && (
                        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.6, marginTop: "0.5rem", lineHeight: 1.5 }}>
                          Love it? Your ${(row.deposit_amount / 100).toLocaleString()} deposit is credited toward the ${(row.listing_price / 100).toLocaleString()} purchase price.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // ── Sale order ───────────────────────────────────────────────────
            const os = row.status as OrderStatus;
            const cfg = BUYER_LIST_STATUS[os] ?? BUYER_LIST_STATUS.pending;
            const canReview = os === "delivered" && !submitted.has(row.id);
            const reviewed  = submitted.has(row.id);
            const total = (row.amount + (row.shipping_cents ?? 0)) / 100;

            return (
              <div key={row.id} style={{ background: "#fff", padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", borderRadius: "2px", overflow: "hidden" }}>
                    {thumb && <img src={thumb} alt={row.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18" }}>{row.title}</p>
                      <span style={{ padding: "0.2rem 0.6rem", background: cfg.bg, color: cfg.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.75rem" }}>
                      <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.7 }}>
                        <span style={{ fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.75rem" }}>Seller </span>
                        <Link href={`/sellers/${row.seller_username}`} style={{ color: "var(--burnt-orange)", textDecoration: "none" }}>@{row.seller_username}</Link>
                      </span>
                      {[
                        { k: "Size",  v: row.size ?? "—" },
                        { k: "Date",  v: fmtDate(row.created_at) },
                        { k: "Total", v: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
                      ].map(({ k, v }) => (
                        <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.7 }}>
                          <span style={{ fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.75rem" }}>{k} </span>{v}
                        </span>
                      ))}
                    </div>
                    {row.tracking && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                        <a href={trackingUrl(row.tracking)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--burnt-orange)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
                          Track package ↗
                        </a>
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                      <Link href={`/account/orders/${row.id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}>
                        View order
                      </Link>
                      <Link href={`/listings/${row.listing_id}`} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", textDecoration: "none" }}>
                        View listing
                      </Link>
                      {row.seller_id && (
                        <MessageButton recipientId={row.seller_id} listingId={row.listing_id} orderId={row.id} label="Message seller" style={{ fontSize: "0.75rem", padding: "0.4rem 0.9rem" }} />
                      )}
                      {canReview && (
                        <button onClick={() => setReviewDrawer({ orderId: row.id, title: row.title, sellerUsername: row.seller_username, rating: 5, text: "" })} style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}>
                          Leave a review
                        </button>
                      )}
                      {reviewed && (
                        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#2D6A4F", display: "flex", alignItems: "center", gap: "0.3rem" }}>✓ Review submitted</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review drawer */}
      {reviewDrawer && (
        <>
          <div onClick={() => setReviewDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--cream)", zIndex: 70, padding: "2rem", border: "1px solid var(--warm-tan)", width: "90%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.25rem" }}>Leave a review</h2>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.65, marginBottom: "1.75rem" }}>{reviewDrawer.title} · @{reviewDrawer.sellerUsername}</p>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.6rem" }}>Rating</p>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem" }}>
              {[1,2,3,4,5].map(n => <button key={n} onClick={() => setReviewDrawer({ ...reviewDrawer, rating: n })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.6rem", color: n <= reviewDrawer.rating ? "#C4440A" : "var(--warm-tan)", padding: 0, lineHeight: 1 }}>★</button>)}
            </div>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>Your review</p>
            <textarea placeholder="How was the item? Was it as described? How was the seller to work with?" value={reviewDrawer.text} onChange={e => setReviewDrawer({ ...reviewDrawer, text: e.target.value })} rows={4} style={{ width: "100%", padding: "0.75rem", border: "1px solid var(--warm-tan)", background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "1.5rem" }} />
            {submitError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{submitError}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={submitReview} disabled={!reviewDrawer.text.trim() || submitting} style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", background: reviewDrawer.text.trim() && !submitting ? "var(--burnt-orange)" : "var(--warm-tan)", color: reviewDrawer.text.trim() && !submitting ? "var(--cream)" : "var(--muted)", border: "none", cursor: reviewDrawer.text.trim() && !submitting ? "pointer" : "not-allowed" }}>
                {submitting ? "Submitting…" : "Submit review"}
              </button>
              <button onClick={() => setReviewDrawer(null)} style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* Return instructions drawer */}
      {instructionsId && (
        <>
          <div onClick={() => setInstructionsId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--cream)", padding: "2rem", border: "1px solid var(--warm-tan)", width: "90%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(13,9,6,0.18)" }}>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "1.5rem" }}>How to return your rental</h2>
              {[
                { n: 1, title: "Pack carefully", body: "Fold the garment gently and use the original garment bag if provided. Do not return without protective packaging." },
                { n: 2, title: "Ship back by your return date", body: "Drop off at any USPS, UPS, or FedEx location by your ship-back date. Late fees are based on the carrier postmark — not the delivery date." },
                { n: 3, title: 'Click "Mark as returned"', body: 'Once you\'ve dropped it off, click "Mark as returned" and enter your tracking number. This notifies the seller to expect the package.' },
                { n: 4, title: "Deposit release", body: "Your deposit is released within 5 business days after the seller confirms they received the item in good condition, or automatically if the seller takes no action." },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: "rgba(196,68,10,0.1)", color: "var(--burnt-orange)", fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{step.n}</div>
                  <div>
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18", marginBottom: "0.2rem" }}>{step.title}</p>
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, lineHeight: 1.65 }}>{step.body}</p>
                  </div>
                </div>
              ))}
              <button onClick={() => setInstructionsId(null)} style={{ width: "100%", padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.18em", textTransform: "uppercase", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}>Got it</button>
            </div>
          </div>
        </>
      )}

      {/* Mark as returned drawer */}
      {returnDrawerId && (
        <>
          <div onClick={() => setReturnDrawerId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "var(--cream)", padding: "2rem", border: "1px solid var(--warm-tan)", width: "90%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(13,9,6,0.18)" }}>
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "0.5rem" }}>Mark as returned</h2>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.7, marginBottom: "1.75rem", lineHeight: 1.6 }}>
                Only do this once you&apos;ve dropped the item off with the carrier. The seller will have 5 business days to confirm receipt before your deposit is automatically released.
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>
                Tracking number <span style={{ fontWeight: 400, color: "#991B1B" }}>*</span>
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.7, marginBottom: "0.5rem" }}>
                Required — this stops the late-fee clock. Enter it as soon as you drop off the item.
              </p>
              <input type="text" value={trackingInput} onChange={e => { setTrackingInput(e.target.value); setTrackingError(null); }} placeholder="e.g. 1Z999AA10123456784"
                style={{ width: "100%", padding: "0.65rem 0.85rem", border: `1px solid ${trackingError ? "#EF4444" : "var(--warm-tan)"}`, background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", boxSizing: "border-box", marginBottom: trackingError ? "0.35rem" : "1.5rem" }}
              />
              {trackingError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "1rem", lineHeight: 1.5 }}>{trackingError}</p>}
              {submitError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{submitError}</p>}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => markReturned(returnDrawerId!)} disabled={submitting || !trackingInput.trim()} style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", background: (submitting || !trackingInput.trim()) ? "var(--warm-tan)" : "var(--burnt-orange)", color: (submitting || !trackingInput.trim()) ? "var(--muted)" : "var(--cream)", border: "none", cursor: (submitting || !trackingInput.trim()) ? "not-allowed" : "pointer" }}>
                  {submitting ? "Submitting…" : "Confirm — item shipped back"}
                </button>
                <button onClick={() => setReturnDrawerId(null)} style={{ padding: "0.75rem 1.25rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>Loading…</div>}>
      <PurchasesContent />
    </Suspense>
  );
}
