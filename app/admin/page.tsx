"use client";

import Link from "next/link";

// ─── Stat cards ───────────────────────────────────────────────────────────────

const STATS = [
  { label: "GMV (all time)",      value: "$284,500", sub: "gross merchandise value"  },
  { label: "Total users",         value: "1,842",    sub: "648 sellers, 1,194 buyers" },
  { label: "Active listings",     value: "312",      sub: "47 pending review"         },
  { label: "Active rentals",      value: "28",       sub: "3 overdue"                 },
  { label: "Total orders",        value: "4,231",    sub: "this month: 184"           },
  { label: "Commission earned",   value: "$28,450",  sub: "10% platform fee"          },
];

// ─── Recent orders ────────────────────────────────────────────────────────────

const RECENT_ORDERS = [
  { id:"1043", buyer:"ananya_m",    seller:"priya_sharma",  item:"Red Bridal Lehenga",      total:4500, status:"Processing", date:"Jun 9" },
  { id:"1042", buyer:"kavitha_wears",seller:"priya_sharma", item:"Zardozi Saree",            total:980,  status:"Shipped",    date:"Jun 7" },
  { id:"1041", buyer:"meera_b",     seller:"raj_styles",    item:"Navy Sherwani",            total:1600, status:"Delivered",  date:"Jun 6" },
  { id:"1040", buyer:"sana.rents",  seller:"meera_b",       item:"Silk Sharara Set",         total:540,  status:"Completed",  date:"Jun 2" },
  { id:"1039", buyer:"divya.looks", seller:"ananya_m",      item:"Indo-Western Jumpsuit",    total:490,  status:"Completed",  date:"Jun 1" },
];

const ORDER_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Processing: { bg:"#FFF8E1",  text:"#E65100" },
  Shipped:    { bg:"#E3F2FD",  text:"#1D4E89" },
  Delivered:  { bg:"#E8F5E9",  text:"#2D6A4F" },
  Completed:  { bg:"rgba(201,92,26,0.1)", text:"var(--burnt-orange)" },
};

// ─── Listings awaiting review ─────────────────────────────────────────────────

const PENDING_LISTINGS = [
  { id:"L88", seller:"new_seller_1", title:"Bridal Lehenga Set",        submitted:"Jun 9", bg:"#D4C5B5" },
  { id:"L87", seller:"fashionista_r", title:"Kundan Jewellery Set",     submitted:"Jun 8", bg:"#E8D8B8" },
  { id:"L86", seller:"trendy_fits",  title:"Velvet Sherwani",           submitted:"Jun 8", bg:"#C9CDD6" },
  { id:"L85", seller:"silk_road_co", title:"Banarasi Saree — Crimson",  submitted:"Jun 7", bg:"#D8A8A8" },
];

// ─── Overdue rentals ──────────────────────────────────────────────────────────

const OVERDUE_RENTALS = [
  { id:"R195", buyer:"riya.wears",  seller:"priya_sharma",  item:"Banarasi Silk Lehenga",   daysOverdue:4, deposit:600 },
  { id:"R192", buyer:"pooja_k",     seller:"meera_b",       item:"Sequin Lehenga",           daysOverdue:2, deposit:500 },
  { id:"R189", buyer:"arjun.style", seller:"raj_styles",    item:"Navy Sherwani Brocade",    daysOverdue:1, deposit:800 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const dark: React.CSSProperties = {
  fontFamily: "var(--font-jost)", color: "rgba(250,246,241,0.9)",
};
const muted: React.CSSProperties = {
  fontFamily: "var(--font-jost)", color: "rgba(250,246,241,0.4)",
};
const label: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase",
  color: "rgba(250,246,241,0.35)",
};

function SectionHead({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
      <p style={{ ...label, color:"rgba(250,246,241,0.45)", letterSpacing:"0.2em" }}>{title}</p>
      <Link href={href} style={{ ...muted, fontSize:"0.7rem", textDecoration:"none", transition:"color 0.15s" }}
        onMouseOver={e => (e.currentTarget.style.color = "var(--burnt-orange)")}
        onMouseOut={e => (e.currentTarget.style.color = "rgba(250,246,241,0.4)")}
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverview() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"2.5rem" }}>
        <h1 style={{
          fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400,
          fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem",
        }}>
          Overview
        </h1>
        <p style={{ ...muted, fontSize:"0.78rem" }}>Platform health at a glance — Jun 11, 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom:"2.5rem" }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)",
            padding:"1.4rem 1.25rem",
          }}>
            <p style={{ ...label, marginBottom:"0.6rem" }}>{s.label}</p>
            <p style={{
              fontFamily:"var(--font-cormorant)", fontStyle:"italic",
              fontSize:"2rem", fontWeight:400, color:"#FAF6F1",
              lineHeight:1, marginBottom:"0.3rem",
            }}>
              {s.value}
            </p>
            <p style={{ ...muted, fontSize:"0.7rem" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-col lower section */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }} className="admin-lower">

        {/* Recent orders */}
        <div>
          <SectionHead title="Recent orders" href="/admin/orders" linkLabel="View all" />
          <div style={{ border:"1px solid rgba(255,255,255,0.08)" }}>
            {/* Header row */}
            <div style={{
              display:"grid", gridTemplateColumns:"60px 1fr 80px 90px",
              padding:"0.6rem 1rem",
              borderBottom:"1px solid rgba(255,255,255,0.06)",
              ...label,
            }}>
              <span>Order</span><span>Item</span><span>Total</span><span>Status</span>
            </div>
            {RECENT_ORDERS.map((o, i) => {
              const sc = ORDER_STATUS_COLOR[o.status] ?? { bg:"#eee", text:"#333" };
              return (
                <div key={o.id} style={{
                  display:"grid", gridTemplateColumns:"60px 1fr 80px 90px",
                  padding:"0.75rem 1rem", alignItems:"center",
                  borderBottom: i < RECENT_ORDERS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                }}>
                  <span style={{ ...muted, fontSize:"0.7rem" }}>#{o.id}</span>
                  <div>
                    <p style={{ ...dark, fontSize:"0.78rem", fontWeight:500 }}>{o.item}</p>
                    <p style={{ ...muted, fontSize:"0.65rem" }}>@{o.buyer} → @{o.seller}</p>
                  </div>
                  <span style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontSize:"0.95rem", color:"#FAF6F1" }}>
                    ${o.total.toLocaleString()}
                  </span>
                  <span style={{
                    display:"inline-block", padding:"0.18rem 0.5rem",
                    background:sc.bg, color:sc.text,
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    width:"fit-content",
                  }}>
                    {o.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: pending listings + overdue rentals */}
        <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>

          {/* Pending listings */}
          <div>
            <SectionHead title="Pending review" href="/admin/listings" linkLabel="Review all" />
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {PENDING_LISTINGS.map(l => (
                <div key={l.id} style={{
                  display:"flex", alignItems:"center", gap:"0.75rem",
                  padding:"0.75rem 1rem",
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ width:"36px", height:"36px", flexShrink:0, background:l.bg, borderRadius:"2px" }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ ...dark, fontSize:"0.8rem", fontWeight:500 }}>{l.title}</p>
                    <p style={{ ...muted, fontSize:"0.65rem" }}>@{l.seller} · {l.submitted}</p>
                  </div>
                  <span style={{
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    padding:"0.18rem 0.5rem",
                    background:"rgba(255,193,7,0.15)", color:"#FFC107",
                    flexShrink:0,
                  }}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue rentals */}
          <div>
            <SectionHead title="Overdue rentals" href="/admin/rentals" linkLabel="View all" />
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {OVERDUE_RENTALS.map(r => (
                <div key={r.id} style={{
                  padding:"0.75rem 1rem",
                  background:"rgba(198,40,40,0.08)",
                  border:"1px solid rgba(198,40,40,0.2)",
                  borderLeft:"3px solid #C62828",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <p style={{ ...dark, fontSize:"0.8rem", fontWeight:500, marginBottom:"0.2rem" }}>{r.item}</p>
                      <p style={{ ...muted, fontSize:"0.65rem" }}>@{r.buyer} rented from @{r.seller}</p>
                    </div>
                    <span style={{
                      fontFamily:"var(--font-jost)", fontWeight:700,
                      fontSize:"0.6rem", letterSpacing:"0.1em", textTransform:"uppercase",
                      color:"#EF9A9A", flexShrink:0,
                    }}>
                      {r.daysOverdue}d overdue
                    </span>
                  </div>
                  <p style={{ ...muted, fontSize:"0.65rem", marginTop:"0.35rem" }}>
                    Deposit held: ${r.deposit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .admin-lower { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
