"use client";

import { useState } from "react";

type OrderStatus = "pending_shipment" | "shipped" | "delivered" | "completed";

interface MockOrder {
  id: string;
  buyer: string;
  item: string;
  size: string;
  date: string;
  total: number;
  status: OrderStatus;
  tracking?: string;
  carrier?: string;
  color: string; // placeholder bg color until real images load
}

const MOCK_ORDERS: MockOrder[] = [
  { id: "1043", buyer: "ananya_m",   item: "Banarasi Silk Lehenga",       size: "S (US 4)",   date: "Jun 9, 2026",  total: 4500, status: "pending_shipment", color: "#D4C5B5" },
  { id: "1042", buyer: "priya_k22",  item: "Zardozi Saree — Ivory & Gold", size: "Free size",  date: "Jun 7, 2026",  total: 980,  status: "shipped",          tracking: "1Z999AA10123456784", carrier: "UPS", color: "#E8DDD3" },
  { id: "1040", buyer: "sana.rents", item: "Indo-Western Sherwani Set",    size: "M (US 38)",  date: "Jun 2, 2026",  total: 540,  status: "delivered",        color: "#C8B9A8" },
  { id: "1038", buyer: "meera_b",    item: "Embroidered Chanderi Saree",   size: "Free size",  date: "May 28, 2026", total: 780,  status: "completed",        color: "#DDD0C5" },
  { id: "1035", buyer: "divya.looks",item: "Silk Sharara Set",             size: "M (US 8)",   date: "May 20, 2026", total: 860,  status: "completed",        color: "#CFC0AF" },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending_shipment: { label: "Pending shipment", bg: "#FFF8E1", text: "#E65100" },
  shipped:          { label: "Shipped",           bg: "#E3F2FD", text: "#1D4E89" },
  delivered:        { label: "Delivered",         bg: "#E8F5E9", text: "#2D6A4F" },
  completed:        { label: "Completed",         bg: "#F5F5F5", text: "#555" },
};

interface ShipDrawerState {
  orderId: string;
  tracking: string;
  carrier: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [drawer, setDrawer] = useState<ShipDrawerState | null>(null);

  const US_CARRIERS = ["USPS", "UPS", "FedEx", "Other"];

  const submitShipping = () => {
    if (!drawer || !drawer.tracking.trim()) return;
    setOrders(prev =>
      prev.map(o =>
        o.id === drawer.orderId
          ? { ...o, status: "shipped", tracking: drawer.tracking, carrier: drawer.carrier }
          : o
      )
    );
    setDrawer(null);
  };

  return (
    <div style={{ maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem"
        }}>
          Orders
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {orders.filter(o => o.status === "pending_shipment").length} pending shipment
        </p>
      </div>

      {/* Orders list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {/* Table header — desktop */}
        <div
          className="hidden md:grid"
          style={{
            gridTemplateColumns: "48px 80px 1fr 1fr 100px 90px 120px 140px",
            padding: "0.6rem 1rem",
            borderBottom: "2px solid var(--warm-tan)",
            fontFamily: "var(--font-jost)", fontWeight: 600,
            fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
            color: "var(--muted)", opacity: 0.6,
          }}
        >
          <span />
          <span>Order</span>
          <span>Item</span>
          <span>Buyer</span>
          <span>Size</span>
          <span>Total</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        {orders.map((order, i) => {
          const cfg = STATUS_CONFIG[order.status];
          return (
            <div
              key={order.id}
              style={{
                borderBottom: "1px solid var(--warm-tan)",
                background: i % 2 === 0 ? "#fff" : "transparent",
              }}
            >
              {/* Desktop row */}
              <div
                className="hidden md:grid items-center"
                style={{
                  gridTemplateColumns: "48px 80px 1fr 1fr 100px 90px 120px 140px",
                  padding: "0.75rem 1rem",
                  gap: "0.5rem",
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: "40px", height: "40px", borderRadius: "2px",
                  background: order.color, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }} />
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.55 }}>
                  #{order.id}
                </span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", fontWeight: 500, color: "#1A1A18", lineHeight: 1.3 }}>
                  {order.item}
                </span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)" }}>
                  @{order.buyer}
                </span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: "var(--muted)", opacity: 0.7 }}>
                  {order.size}
                </span>
                <span style={{
                  fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                  fontSize: "1rem", color: "#1A1A18"
                }}>
                  ${order.total.toLocaleString()}
                </span>
                <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.6 }}>
                  {order.date}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{
                    display: "inline-block", padding: "0.2rem 0.6rem",
                    background: cfg.bg, color: cfg.text,
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    borderRadius: "2px", width: "fit-content",
                  }}>
                    {cfg.label}
                  </span>
                  {order.status === "pending_shipment" && (
                    <button
                      onClick={() => setDrawer({ orderId: order.id, tracking: "", carrier: "USPS" })}
                      style={{
                        fontFamily: "var(--font-jost)", fontWeight: 600,
                        fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase",
                        padding: "0.3rem 0.6rem", background: "var(--burnt-orange)", color: "var(--cream)",
                        border: "none", cursor: "pointer", transition: "opacity 0.2s",
                        width: "fit-content",
                      }}
                      onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
                      onMouseOut={e => (e.currentTarget.style.opacity = "1")}
                    >
                      Mark shipped
                    </button>
                  )}
                  {order.status === "shipped" && order.tracking && (
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.6 }}>
                      {order.carrier} · {order.tracking}
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "2px",
                    background: order.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18" }}>
                    {order.item}
                  </p>
                  <span style={{
                    padding: "0.18rem 0.5rem", background: cfg.bg, color: cfg.text,
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: "2px",
                  }}>
                    {cfg.label}
                  </span>
                  <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.65, marginTop: "0.25rem", marginBottom: "0.25rem" }}>
                    @{order.buyer} · {order.size} · {order.date}
                  </p>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "#1A1A18", marginBottom: "0.5rem" }}>
                    ${order.total.toLocaleString()}
                  </p>
                  </div>
                </div>
                {order.status === "pending_shipment" && (
                  <button
                    onClick={() => setDrawer({ orderId: order.id, tracking: "", carrier: "USPS" })}
                    style={{
                      fontFamily: "var(--font-jost)", fontWeight: 600,
                      fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
                      padding: "0.5rem 1rem", background: "var(--burnt-orange)", color: "var(--cream)",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    Mark shipped
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ship drawer overlay */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60
            }}
          />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: "var(--cream)", zIndex: 70,
            padding: "2rem",
            borderTop: "1px solid var(--warm-tan)",
            maxWidth: "520px", margin: "0 auto",
          }}>
            <h2 style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
              fontSize: "1.5rem", color: "#1A1A18", marginBottom: "1.5rem"
            }}>
              Add tracking details
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{
                fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--muted)", display: "block", marginBottom: "0.5rem"
              }}>
                Carrier
              </label>
              <select
                value={drawer.carrier}
                onChange={e => setDrawer({ ...drawer, carrier: e.target.value })}
                style={{
                  width: "100%", padding: "0.65rem 0.85rem",
                  border: "1px solid var(--warm-tan)", background: "#fff",
                  fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18",
                  outline: "none",
                }}
              >
                {US_CARRIERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--muted)", display: "block", marginBottom: "0.5rem"
              }}>
                Tracking number
              </label>
              <input
                type="text"
                placeholder="e.g. BD123456789IN"
                value={drawer.tracking}
                onChange={e => setDrawer({ ...drawer, tracking: e.target.value })}
                style={{
                  width: "100%", padding: "0.65rem 0.85rem",
                  border: "1px solid var(--warm-tan)", background: "#fff",
                  fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={submitShipping}
                disabled={!drawer.tracking.trim()}
                style={{
                  flex: 1, padding: "0.7rem",
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
                  background: drawer.tracking.trim() ? "var(--burnt-orange)" : "var(--warm-tan)",
                  color: drawer.tracking.trim() ? "var(--cream)" : "var(--muted)",
                  border: "none", cursor: drawer.tracking.trim() ? "pointer" : "not-allowed",
                  transition: "opacity 0.2s",
                }}
              >
                Confirm shipment
              </button>
              <button
                onClick={() => setDrawer(null)}
                style={{
                  padding: "0.7rem 1.2rem",
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
                  background: "transparent", color: "var(--muted)",
                  border: "1px solid var(--warm-tan)", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
