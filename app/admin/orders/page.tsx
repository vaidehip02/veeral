"use client";

import { useState, useMemo } from "react";

type OrderStatus = "processing" | "shipped" | "delivered" | "completed" | "refunded";

interface AdminOrder {
  id: string;
  buyer: string;
  seller: string;
  item: string;
  total: number;
  commission: number;
  status: OrderStatus;
  date: string;
  tracking?: string;
}

const ALL_ORDERS: AdminOrder[] = [
  { id:"1043", buyer:"ananya_m",     seller:"priya_sharma",  item:"Red Bridal Lehenga",         total:4500, commission:450, status:"processing", date:"Jun 9"  },
  { id:"1042", buyer:"kavitha_wears",seller:"priya_sharma",  item:"Zardozi Saree — Ivory & Gold",total:980, commission:98,  status:"shipped",    date:"Jun 7",  tracking:"1Z999AA10123456784" },
  { id:"1041", buyer:"meera_b",      seller:"raj_styles",    item:"Navy Sherwani Brocade",       total:1600, commission:160, status:"delivered",  date:"Jun 6"  },
  { id:"1040", buyer:"sana.rents",   seller:"meera_b",       item:"Silk Sharara Set",            total:540,  commission:54,  status:"completed",  date:"Jun 2"  },
  { id:"1039", buyer:"divya.looks",  seller:"ananya_m",      item:"Indo-Western Jumpsuit",       total:490,  commission:49,  status:"completed",  date:"Jun 1"  },
  { id:"1038", buyer:"riya.wears",   seller:"priya_sharma",  item:"Embroidered Chanderi Saree",  total:780,  commission:78,  status:"completed",  date:"May 28" },
  { id:"1037", buyer:"pooja_k",      seller:"kavitha_wears", item:"Yellow Bandhani Saree",       total:340,  commission:34,  status:"refunded",   date:"May 25" },
  { id:"1036", buyer:"arjun.style",  seller:"raj_styles",    item:"Gold Sherwani Set",           total:2200, commission:220, status:"completed",  date:"May 22" },
  { id:"1035", buyer:"ananya_m",     seller:"priya_sharma",  item:"Pink Anarkali Kurta Set",     total:320,  commission:32,  status:"completed",  date:"May 20" },
  { id:"1034", buyer:"meera_b",      seller:"sana.rents",    item:"Dusty Pink Anarkali",         total:290,  commission:29,  status:"completed",  date:"May 18" },
];

const STATUS_COLOR: Record<OrderStatus, { bg:string; text:string }> = {
  processing: { bg:"rgba(255,193,7,0.15)",   text:"#FFC107"                },
  shipped:    { bg:"rgba(29,78,137,0.2)",    text:"#90CAF9"                },
  delivered:  { bg:"rgba(45,106,79,0.2)",    text:"#81C995"                },
  completed:  { bg:"rgba(201,92,26,0.15)",   text:"var(--burnt-orange)"    },
  refunded:   { bg:"rgba(198,40,40,0.15)",   text:"#EF9A9A"                },
};

const dark:  React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.9)" };
const muted: React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.4)" };
const lbl:   React.CSSProperties = { fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(250,246,241,0.35)" };

type StatusFilter = OrderStatus | "all";

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search,       setSearch]       = useState("");

  const filtered = useMemo(() => ALL_ORDERS.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!o.buyer.includes(q) && !o.seller.includes(q) && !o.item.toLowerCase().includes(q) && !o.id.includes(q)) return false;
    }
    return true;
  }), [statusFilter, search]);

  const totalGMV        = filtered.reduce((s, o) => s + o.total, 0);
  const totalCommission = filtered.reduce((s, o) => s + o.commission, 0);

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value:"all",        label:"All" },
    { value:"processing", label:"Processing" },
    { value:"shipped",    label:"Shipped" },
    { value:"delivered",  label:"Delivered" },
    { value:"completed",  label:"Completed" },
    { value:"refunded",   label:"Refunded" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
          Orders
        </h1>
        <p style={{ ...muted, fontSize:"0.78rem" }}>{ALL_ORDERS.length} total orders across the platform</p>
      </div>

      {/* Summary strip */}
      <div style={{ display:"flex", gap:"1.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {[
          { label:"Showing", value:`${filtered.length} orders` },
          { label:"GMV",     value:`$${totalGMV.toLocaleString()}` },
          { label:"Commission", value:`$${totalCommission.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ padding:"0.85rem 1.25rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ ...lbl, marginBottom:"0.2rem" }}>{s.label}</p>
            <p style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontSize:"1.3rem", color:"#FAF6F1", lineHeight:1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => setStatusFilter(t.value)} style={{
            fontFamily:"var(--font-jost)", fontWeight:600,
            fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"0.4rem 0.85rem", cursor:"pointer",
            background: statusFilter === t.value ? "var(--burnt-orange)" : "rgba(255,255,255,0.06)",
            color: statusFilter === t.value ? "var(--cream)" : "rgba(250,246,241,0.5)",
            border:`1px solid ${statusFilter === t.value ? "var(--burnt-orange)" : "rgba(255,255,255,0.1)"}`,
            transition:"all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
        <input
          type="text" placeholder="Search order, buyer, seller…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft:"auto", padding:"0.4rem 0.85rem",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#FAF6F1",
            outline:"none", width:"220px",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ border:"1px solid rgba(255,255,255,0.08)", overflowX:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"70px 1fr 130px 90px 90px 100px 110px", padding:"0.6rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)", ...lbl }}>
          <span>Order</span><span>Item</span><span>Buyer → Seller</span>
          <span>Total</span><span>Commission</span><span>Status</span><span>Date</span>
        </div>

        {filtered.map((o, i) => {
          const sc = STATUS_COLOR[o.status];
          return (
            <div key={o.id} style={{
              display:"grid", gridTemplateColumns:"70px 1fr 130px 90px 90px 100px 110px",
              padding:"0.8rem 1rem", alignItems:"center",
              borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
            }}>
              <p style={{ ...muted, fontSize:"0.7rem" }}>#{o.id}</p>
              <div>
                <p style={{ ...dark, fontSize:"0.8rem", fontWeight:500 }}>{o.item}</p>
                {o.tracking && <p style={{ ...muted, fontSize:"0.62rem" }}>Track: {o.tracking}</p>}
              </div>
              <div>
                <p style={{ ...dark, fontSize:"0.72rem" }}>@{o.buyer}</p>
                <p style={{ ...muted, fontSize:"0.65rem" }}>→ @{o.seller}</p>
              </div>
              <span style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontSize:"0.95rem", color:"#FAF6F1" }}>
                ${o.total.toLocaleString()}
              </span>
              <span style={{ fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#81C995" }}>
                +${o.commission}
              </span>
              <span style={{
                display:"inline-block", padding:"0.18rem 0.45rem",
                background:sc.bg, color:sc.text,
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase",
                width:"fit-content",
              }}>
                {o.status}
              </span>
              <p style={{ ...muted, fontSize:"0.72rem" }}>{o.date}</p>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding:"3rem", textAlign:"center", ...muted, fontSize:"0.82rem" }}>
            No orders match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}
