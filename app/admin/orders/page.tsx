"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

const A = {
  dark: "#0D0906", muted: "#6B5E52", label: "#9C8B7E",
  accent: "#C4440A", card: "#FFFFFF", border: "#EDE6DE", bg: "#FAF6F1",
  green: "#065F46", red: "#991B1B",
};
const dark:  React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.dark };
const muted: React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.muted };
const lbl:   React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: A.label,
};

interface AdminOrder {
  id: string;
  created_at: string;
  status: string;
  amount: number;
  platform_fee: number;
  shipping_cents: number | null;
  seller_payout: number | null;
  item: string;
  buyer_email: string;
  seller_email: string;
  return_tracking: string | null;
  payout_due_at: string | null;
  payout_released_at: string | null;
  payout_transfer_id: string | null;
  payout_frozen: boolean;
  payout_frozen_reason: string | null;
  payout_frozen_at: string | null;
  payout_blocked_reason: string | null;
}

const STATUS_TABS = [
  "all","paid","shipped","delivered","completed","cancelled","refunded",
] as const;
type StatusFilter = typeof STATUS_TABS[number];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  paid:       { bg: "#FEF3C7", text: "#92400E" },
  shipped:    { bg: "#DBEAFE", text: "#1E40AF" },
  delivered:  { bg: "#D1FAE5", text: "#065F46" },
  completed:  { bg: "rgba(196,68,10,0.1)", text: "#C4440A" },
  cancelled:  { bg: "#FEE2E2", text: "#991B1B" },
  refunded:   { bg: "#FEE2E2", text: "#991B1B" },
};

function payoutLabel(o: AdminOrder): { text: string; color: string } {
  if (o.payout_released_at)   return { text: "Released",    color: A.green };
  if (o.payout_frozen)        return { text: "Frozen",      color: A.red };
  if (o.payout_blocked_reason) return { text: "Blocked",   color: "#92400E" };
  if (o.payout_due_at) {
    const due = new Date(o.payout_due_at);
    const now = new Date();
    if (due <= now) return { text: "Due",          color: "#1E40AF" };
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    return { text: `In ${daysLeft}d`,  color: A.muted };
  }
  return { text: "—", color: A.muted };
}

export default function AdminOrdersPage() {
  const [orders,       setOrders]       = useState<AdminOrder[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search,       setSearch]       = useState("");
  const [freezeModal,  setFreezeModal]  = useState<{ orderId: string; action: "freeze" | "unfreeze" } | null>(null);
  const [freezeReason, setFreezeReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.item.toLowerCase().includes(q) ||
      o.buyer_email.toLowerCase().includes(q) ||
      o.seller_email.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const totalGMV        = filtered.reduce((s, o) => s + o.amount + (o.platform_fee ?? 0) + (o.shipping_cents ?? 0), 0);
  const totalCommission = filtered.reduce((s, o) => s + (o.platform_fee ?? 0), 0);

  async function submitFreezeAction() {
    if (!freezeModal) return;
    if (freezeModal.action === "freeze" && !freezeReason.trim()) return;
    setActionLoading(true);
    const endpoint = `/api/admin/orders/${freezeModal.orderId}/${freezeModal.action}-payout`;
    const body     = freezeModal.action === "freeze"
      ? { reason: freezeReason }
      : { note:   freezeReason || "Admin cleared freeze" };
    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setActionLoading(false);
    setFreezeModal(null);
    setFreezeReason("");
    fetchOrders();
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Orders
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>{orders.length} sale orders on the platform</p>
      </div>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Showing",    value: `${filtered.length} orders` },
          { label: "GMV",        value: `$${(totalGMV / 100).toLocaleString()}` },
          { label: "Commission", value: `$${(totalCommission / 100).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ padding: "0.85rem 1.25rem", background: A.card, border: `1px solid ${A.border}` }}>
            <p style={{ ...lbl, marginBottom: "0.2rem" }}>{s.label}</p>
            <p className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "1.1rem", color: A.dark, lineHeight: 1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setStatusFilter(t)} style={{
            fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem",
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.85rem", cursor: "pointer",
            background: statusFilter === t ? A.accent : A.card,
            color: statusFilter === t ? "#fff" : A.muted,
            border: `1px solid ${statusFilter === t ? A.accent : A.border}`, transition: "all 0.15s",
          }}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <input type="text" placeholder="Search order, buyer, seller, item…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: "auto", padding: "0.4rem 0.85rem", background: A.card,
            border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.78rem",
            color: A.dark, outline: "none", width: "220px" }}
          onFocus={e => (e.target.style.borderColor = A.accent)}
          onBlur={e => (e.target.style.borderColor = A.border)}
        />
      </div>

      {/* Table */}
      <div style={{ background: A.card, border: `1px solid ${A.border}`, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 140px 80px 80px 100px 100px 100px",
          padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl, minWidth: 860 }}>
          <span>Order</span><span>Item</span><span>Buyer → Seller</span>
          <span>Total</span><span>Fee</span><span>Status</span><span>Payout</span><span></span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", ...muted, fontSize: "0.82rem" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", ...muted, fontSize: "0.82rem" }}>
            No orders match the current filter.
          </div>
        ) : filtered.map((o, i) => {
          const sc      = STATUS_COLOR[o.status] ?? { bg: "#F3F4F6", text: "#374151" };
          const payout  = payoutLabel(o);
          const totalDollars = ((o.amount ?? 0) + (o.platform_fee ?? 0) + (o.shipping_cents ?? 0)) / 100;
          const feeDollars   = (o.platform_fee ?? 0) / 100;
          const shortDate = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div key={o.id} style={{
              display: "grid", gridTemplateColumns: "80px 1fr 140px 80px 80px 100px 100px 100px",
              padding: "0.8rem 1rem", alignItems: "center",
              borderBottom: i < filtered.length - 1 ? `1px solid ${A.border}` : "none",
              background: i % 2 === 0 ? A.card : A.bg,
              minWidth: 860,
            }}>
              <div>
                <p style={{ ...muted, fontSize: "0.7rem" }}>#{o.id.slice(0, 8).toUpperCase()}</p>
                <p style={{ ...muted, fontSize: "0.6rem" }}>{shortDate}</p>
              </div>
              <div>
                <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>{o.item}</p>
                {o.return_tracking && <p style={{ ...muted, fontSize: "0.62rem" }}>Track: {o.return_tracking}</p>}
                {o.payout_frozen_reason && (
                  <p style={{ fontSize: "0.62rem", color: A.red }}>Frozen: {o.payout_frozen_reason}</p>
                )}
                {o.payout_blocked_reason && (
                  <p style={{ fontSize: "0.62rem", color: "#92400E" }}>Blocked: {o.payout_blocked_reason}</p>
                )}
              </div>
              <div>
                <p style={{ ...dark, fontSize: "0.72rem" }}>{o.buyer_email}</p>
                <p style={{ ...muted, fontSize: "0.65rem" }}>→ {o.seller_email}</p>
              </div>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.85rem", color: A.dark }}>
                ${totalDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.78rem", color: A.green }}>
                +${feeDollars.toFixed(2)}
              </span>
              <span style={{ display: "inline-block", padding: "0.18rem 0.45rem",
                background: sc.bg, color: sc.text,
                fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.52rem",
                letterSpacing: "0.1em", textTransform: "uppercase", width: "fit-content" }}>
                {o.status}
              </span>
              <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", fontWeight: 600, color: payout.color }}>
                {payout.text}
              </span>
              {/* Freeze / Unfreeze button */}
              {!o.payout_released_at && (
                <button
                  onClick={() => { setFreezeModal({ orderId: o.id, action: o.payout_frozen ? "unfreeze" : "freeze" }); setFreezeReason(""); }}
                  style={{
                    fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.55rem",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "0.28rem 0.6rem", cursor: "pointer",
                    background: o.payout_frozen ? "#D1FAE5" : "#FEE2E2",
                    color: o.payout_frozen ? A.green : A.red,
                    border: `1px solid ${o.payout_frozen ? "#A7F3D0" : "#FECACA"}`,
                  }}>
                  {o.payout_frozen ? "Unfreeze" : "Freeze"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Freeze / Unfreeze modal */}
      {freezeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setFreezeModal(null)}>
          <div style={{ background: A.card, border: `1px solid ${A.border}`, padding: "2rem", width: 400, maxWidth: "90vw" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.6rem", color: A.dark, marginBottom: "0.5rem" }}>
              {freezeModal.action === "freeze" ? "Freeze payout" : "Unfreeze payout"}
            </h2>
            <p style={{ ...muted, fontSize: "0.78rem", marginBottom: "1.25rem" }}>
              Order #{freezeModal.orderId.slice(0, 8).toUpperCase()}
            </p>
            <label style={{ ...lbl, display: "block", marginBottom: "0.4rem" }}>
              {freezeModal.action === "freeze" ? "Reason (required)" : "Note (optional)"}
            </label>
            <textarea
              value={freezeReason}
              onChange={e => setFreezeReason(e.target.value)}
              placeholder={freezeModal.action === "freeze" ? "e.g. Chargeback opened by buyer" : "e.g. Dispute resolved in seller's favour"}
              rows={3}
              style={{ width: "100%", padding: "0.6rem", fontFamily: "var(--font-jost)", fontSize: "0.8rem",
                color: A.dark, border: `1px solid ${A.border}`, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
              <button onClick={() => setFreezeModal(null)} style={{
                fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "0.5rem 1rem", cursor: "pointer",
                background: A.card, color: A.muted, border: `1px solid ${A.border}`,
              }}>Cancel</button>
              <button
                onClick={submitFreezeAction}
                disabled={actionLoading || (freezeModal.action === "freeze" && !freezeReason.trim())}
                style={{
                  fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "0.5rem 1rem", cursor: actionLoading ? "not-allowed" : "pointer",
                  background: freezeModal.action === "freeze" ? A.red : A.green,
                  color: "#fff", border: "none",
                  opacity: actionLoading ? 0.6 : 1,
                }}>
                {actionLoading ? "…" : freezeModal.action === "freeze" ? "Freeze payout" : "Unfreeze payout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
