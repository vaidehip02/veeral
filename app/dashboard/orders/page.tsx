"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MessageButton from "@/components/messages/MessageButton";
import { SELLER_SALE_STATUS, SELLER_RENT_STATUS } from "@/lib/orderStatus";

// ── Types ─────────────────────────────────────────────────────────────────────

type DBStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded"
  | "return_pending" | "deposit_released" | "damage_claimed" | "deposit_resolved";

interface SellerOrder {
  id: string;
  type: "sale" | "rent";
  status: DBStatus;
  amount: number;                   // cents — listed price (what seller set)
  stripe_processing_fee: number | null; // cents — actual Stripe fee, null until webhook fires
  deposit_amount: number | null;
  rental_start: string | null;
  rental_end: string | null;
  return_noted_at: string | null;
  rent_price_per_day: number;
  created_at: string;
  buyer_id: string;
  listing_id: string;
  shipping_address: string | null;
  // joined
  listing_title: string;
  listing_image: string | null;
  listing_size: string | null;
  buyer_username: string;
  tracking?: string;
}


function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRentalDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

interface ShipDrawer { orderId: string; tracking: string; }

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase",
  color: "var(--muted)", display: "block", marginBottom: "0.5rem",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SellerOrdersPage() {
  const [orders, setOrders]   = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer]   = useState<ShipDrawer | null>(null);
  const [lateFeeMultiplier, setLateFeeMultiplier] = useState(1.5);
  const [gracePeriodDays,   setGracePeriodDays]   = useState(0);
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/late-fee")
      .then(r => r.json())
      .then(d => {
        if (d.late_fee_multiplier != null) setLateFeeMultiplier(Number(d.late_fee_multiplier));
        if (d.grace_period_days   != null) setGracePeriodDays(Number(d.grace_period_days));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const { data: rawOrders } = await supabase
        .from("orders")
        .select("id, type, status, amount, stripe_processing_fee, deposit_amount, rental_start, rental_end, return_noted_at, created_at, buyer_id, listing_id, shipping_address, return_tracking_number")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!rawOrders?.length) { setLoading(false); return; }

      const listingIds = Array.from(new Set(rawOrders.map((o) => o.listing_id)));
      const buyerIds   = Array.from(new Set(rawOrders.map((o) => o.buyer_id)));

      const [{ data: listings }, { data: buyers }] = await Promise.all([
        supabase.from("listings").select("id, title, images, size, rent_price").in("id", listingIds),
        supabase.from("seller_profiles").select("id, username").in("id", buyerIds),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = rawOrders as any[];
      const merged: SellerOrder[] = rows.map((o) => {
        const l = listings?.find((x) => x.id === o.listing_id);
        const b = buyers?.find((x) => x.id === o.buyer_id);
        return {
          id:                    o.id,
          type:                  o.type as "sale" | "rent",
          status:                o.status as DBStatus,
          amount:                o.amount,
          stripe_processing_fee: o.stripe_processing_fee ?? null,
          deposit_amount:        o.deposit_amount,
          rental_start:       o.rental_start,
          rental_end:         o.rental_end,
          return_noted_at:    o.return_noted_at ?? null,
          rent_price_per_day: (l as { rent_price?: number } | undefined)?.rent_price ?? 0,
          created_at:         o.created_at,
          buyer_id:         o.buyer_id,
          listing_id:       o.listing_id,
          shipping_address: o.shipping_address ?? null,
          listing_title:    l?.title ?? "Item",
          listing_image:    l?.images?.[0] ?? null,
          listing_size:     l?.size ?? null,
          buyer_username:   b?.username ?? "",
          tracking:         o.return_tracking_number ?? undefined,
        };
      });

      setOrders(merged);
      setLoading(false);
    });
  }, []);

  const sales   = orders.filter((o) => o.type === "sale");
  const rentals = orders.filter((o) => o.type === "rent");
  const pendingShipSales   = sales.filter((o) => o.status === "paid").length;
  const pendingShipRentals = rentals.filter((o) => o.status === "paid").length;
  const pendingShip = pendingShipSales + pendingShipRentals;

  async function markShipped() {
    if (!drawer || !drawer.tracking.trim()) return;
    setShipping(true);
    setShipError(null);
    try {
      const res = await fetch(`/api/orders/${drawer.orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking: drawer.tracking.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        setShipError(error ?? "Something went wrong.");
        return;
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === drawer.orderId
            ? { ...o, status: "shipped", tracking: drawer.tracking.trim() }
            : o,
        ),
      );
      setDrawer(null);
    } catch {
      setShipError("Network error. Please try again.");
    } finally {
      setShipping(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem" }}>
          Orders
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {loading ? "Loading…" : (
            pendingShip === 0
              ? "No orders ready to ship"
              : [
                  pendingShipSales   > 0 && `${pendingShipSales} sale${pendingShipSales   !== 1 ? "s" : ""} ready to ship`,
                  pendingShipRentals > 0 && `${pendingShipRentals} rental${pendingShipRentals !== 1 ? "s" : ""} to dispatch`,
                ].filter(Boolean).join(" · ")
          )}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.5 }}>
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", border: "1px dashed var(--warm-tan)" }}>
          <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.4rem", color: "#1A1A18", marginBottom: "0.5rem" }}>No orders yet</p>
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6 }}>
            When a buyer purchases or rents one of your listings, it will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sales ─────────────────────────────────────────────────────── */}
          {sales.length > 0 && (
            <section style={{ marginBottom: "2.5rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginBottom: "0.75rem" }}>
                Sales ({sales.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
                {sales.map((order) => <OrderCard key={order.id} order={order} statusMap={SELLER_SALE_STATUS} onShip={() => { setDrawer({ orderId: order.id, tracking: "" }); setShipError(null); }} expandedAddress={expandedAddress} setExpandedAddress={setExpandedAddress} lateFeeMultiplier={lateFeeMultiplier} gracePeriodDays={gracePeriodDays} />)}
              </div>
            </section>
          )}

          {/* ── Rentals ───────────────────────────────────────────────────── */}
          {rentals.length > 0 && (
            <section>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--muted)", opacity: 0.55, marginBottom: "0.75rem" }}>
                Rentals ({rentals.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--warm-tan)" }}>
                {rentals.map((order) => <OrderCard key={order.id} order={order} statusMap={SELLER_RENT_STATUS} onShip={() => { setDrawer({ orderId: order.id, tracking: "" }); setShipError(null); }} expandedAddress={expandedAddress} setExpandedAddress={setExpandedAddress} lateFeeMultiplier={lateFeeMultiplier} gracePeriodDays={gracePeriodDays} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Ship drawer ───────────────────────────────────────────────────── */}
      {drawer && (
        <>
          <div onClick={() => setDrawer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "var(--cream)", zIndex: 70, padding: "2rem", border: "1px solid var(--warm-tan)", width: "90%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: "#1A1A18", marginBottom: "1.5rem" }}>
              Mark as shipped
            </h2>
            <label style={labelStyle}>Tracking number</label>
            <input
              type="text"
              placeholder="e.g. 1Z999AA10123456784"
              value={drawer.tracking}
              onChange={(e) => setDrawer({ ...drawer, tracking: e.target.value })}
              style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1px solid var(--warm-tan)", background: "#fff", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18", outline: "none", boxSizing: "border-box", marginBottom: "1.5rem" }}
            />
            {shipError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "#991B1B", marginBottom: "0.75rem" }}>{shipError}</p>}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={markShipped}
                disabled={!drawer.tracking.trim() || shipping}
                style={{ flex: 1, padding: "0.75rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", background: drawer.tracking.trim() && !shipping ? "var(--burnt-orange)" : "var(--warm-tan)", color: drawer.tracking.trim() && !shipping ? "var(--cream)" : "var(--muted)", border: "none", cursor: drawer.tracking.trim() && !shipping ? "pointer" : "not-allowed" }}
              >
                {shipping ? "Updating…" : "Confirm shipment"}
              </button>
              <button onClick={() => setDrawer(null)} style={{ padding: "0.75rem 1.2rem", fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent", color: "var(--muted)", border: "1px solid var(--warm-tan)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  statusMap,
  onShip,
  expandedAddress,
  setExpandedAddress,
  lateFeeMultiplier,
  gracePeriodDays,
}: {
  order: SellerOrder;
  statusMap: Record<string, { label: string; bg: string; text: string }>;
  onShip: () => void;
  expandedAddress: string | null;
  setExpandedAddress: (id: string | null) => void;
  lateFeeMultiplier: number;
  gracePeriodDays: number;
}) {
  const cfg = statusMap[order.status] ?? { label: order.status, bg: "#F5F5F5", text: "#555" };
  const shortId = `VR-${order.id.slice(0, 6).toUpperCase()}`;
  const showAddress = expandedAddress === order.id;

  return (
    <div style={{ background: "var(--cream)", padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>

        {/* Thumbnail */}
        <div style={{ width: "64px", height: "64px", flexShrink: 0, background: "#DDD0C5", overflow: "hidden" }}>
          {order.listing_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.listing_image} alt={order.listing_title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.88rem", color: "#1A1A18", lineHeight: 1.3 }}>
              {order.listing_title}
            </p>
            <span style={{ padding: "0.2rem 0.6rem", background: cfg.bg, color: cfg.text, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>
              {cfg.label}
            </span>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 1.25rem", marginBottom: "0.65rem" }}>
            {[
              { k: "Order",  v: shortId },
              { k: "Buyer",  v: `@${order.buyer_username}` },
              ...(order.listing_size ? [{ k: "Size", v: order.listing_size }] : []),
              { k: "Date",   v: fmtDate(order.created_at) },
              ...(order.type === "rent" && order.rental_start && order.rental_end
                ? [{ k: "Rental", v: `${fmtRentalDate(order.rental_start)} – ${fmtRentalDate(order.rental_end)}` }]
                : []),
              ...(order.type === "rent" && order.rental_end
                ? [{ k: "Renter ships back by", v: fmtRentalDate(order.rental_end) }]
                : []),
            ].map(({ k, v }) => (
              <span key={k} style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.75 }}>
                <span style={{ fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.72rem" }}>{k} </span>
                {v}
              </span>
            ))}
          </div>

          {/* Payout — listed price primary, net-of-Stripe-fee secondary */}
          <div style={{ marginBottom: "0.65rem" }}>
            <span style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.1rem", color: "#1A1A18", fontWeight: 600 }}>
              {fmt(order.amount)}
            </span>
            {order.stripe_processing_fee != null ? (
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.7, marginLeft: "0.5rem" }}>
                you&apos;ll receive {fmt(order.amount - order.stripe_processing_fee)} after Stripe fee
              </span>
            ) : null}
          </div>

          {/* Deposit context — rental only, never part of payout */}
          {order.type === "rent" && order.deposit_amount != null && (
            <div style={{ marginBottom: "0.65rem", padding: "0.5rem 0.75rem", background: "#F9F6F2", border: "1px solid var(--warm-tan)", display: "inline-block" }}>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.8 }}>
                <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.72rem" }}>Deposit held </span>
                {fmt(order.deposit_amount)} — refundable to renter; claimable if returned damaged
              </span>
            </div>
          )}

          {/* Tracking + return info */}
          {order.tracking && (
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", marginBottom: "0.35rem", opacity: 0.7 }}>
              Tracking: <span style={{ fontWeight: 600, color: "#1A1A18" }}>{order.tracking}</span>
            </p>
          )}
          {order.status === "return_pending" && order.return_noted_at && (() => {
            const returnedOn = new Date(order.return_noted_at);
            const rentalEndDate = order.rental_end ? new Date(order.rental_end) : null;
            const rawDays = rentalEndDate
              ? Math.max(0, Math.ceil((returnedOn.getTime() - rentalEndDate.getTime()) / (1000 * 60 * 60 * 24)))
              : 0;
            const overdueDays = Math.max(0, rawDays - gracePeriodDays);
            const estFee = overdueDays > 0 && order.rent_price_per_day > 0
              ? Math.min(Math.round(order.rent_price_per_day * overdueDays * lateFeeMultiplier), order.deposit_amount ?? 0)
              : 0;
            return (
              <div style={{ marginBottom: "0.65rem" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", opacity: 0.7, marginBottom: overdueDays > 0 ? "0.3rem" : 0 }}>
                  Returned:{" "}
                  <span style={{ fontWeight: 600, color: "#1A1A18" }}>
                    {returnedOn.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </p>
                {overdueDays > 0 && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#FDECEA", padding: "0.3rem 0.65rem" }}>
                    <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C62828" }}>
                      {overdueDays} day{overdueDays !== 1 ? "s" : ""} late
                      {estFee > 0 && ` · est. late fee ${fmt(estFee)}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Shipping address (expandable) */}
          {order.shipping_address && (
            <div style={{ marginBottom: "0.65rem" }}>
              <button
                onClick={() => setExpandedAddress(showAddress ? null : order.id)}
                style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C4440A", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showAddress ? "Hide address ▲" : "Show shipping address ▼"}
              </button>
              {showAddress && (
                <div style={{ marginTop: "0.4rem", padding: "0.6rem 0.85rem", background: "#F9F6F2", border: "1px solid var(--warm-tan)" }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#1A1A18", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {order.shipping_address}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {order.status === "paid" && (
              <button
                onClick={onShip}
                style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", background: "var(--burnt-orange)", color: "var(--cream)", border: "none", cursor: "pointer" }}
              >
                Mark as shipped
              </button>
            )}
            <MessageButton
              recipientId={order.buyer_id}
              listingId={order.listing_id}
              orderId={order.id}
              label="Message buyer"
              style={{ fontSize: "0.6rem", padding: "0.4rem 0.9rem", letterSpacing: "0.12em" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
