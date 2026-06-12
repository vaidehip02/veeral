import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// ── Shared admin light-mode style constants ───────────────────────────────────
const A = {
  dark:   "#0D0906",
  muted:  "#6B5E52",
  label:  "#9C8B7E",
  accent: "#C4440A",
  card:   "#FFFFFF",
  border: "#EDE6DE",
  bg:     "#FAF6F1",
};

const dark:  React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.dark };
const muted: React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.muted };
const lbl:   React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: A.label,
};

// ── Mock fallback numbers — match the detail pages exactly ───────────────────
// Users page: 10 accounts (8 active, 1 suspended, 1 new)
// Listings page: 9 total (4 pending, 3 active, 1 featured, 1 rejected)
// Orders page: 10 orders, GMV = $12,040, commission = $1,204
// Rentals page: 6 active, 4 overdue
const MOCK_STATS = {
  totalUsers: 10,
  totalSellers: 7,        // users with role seller or both
  activeListings: 4,      // active + featured
  pendingListings: 4,
  totalOrders: 10,
  gmv: 12040,
  commission: 1204,
  activeRentals: 6,
  overdueRentals: 4,
};

async function getStats() {
  try {
    const supabase = createClient();

    const [
      profilesRes,
      activeListRes,
      pendingListRes,
    ] = await Promise.all([
      supabase.from("seller_profiles").select("*", { count: "exact", head: true }),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "draft"),
    ]);

    const sellers = profilesRes.count ?? 0;
    const activeListings = activeListRes.count ?? 0;

    // DB is empty — return numbers that match the detail-page mock data
    if (sellers === 0 && activeListings === 0) return MOCK_STATS;

    return {
      totalUsers: MOCK_STATS.totalUsers,   // auth.users not accessible via anon key
      totalSellers: sellers,
      activeListings,
      pendingListings: pendingListRes.count ?? 0,
      totalOrders:     MOCK_STATS.totalOrders,
      gmv:             MOCK_STATS.gmv,
      commission:      MOCK_STATS.commission,
      activeRentals:   MOCK_STATS.activeRentals,
      overdueRentals:  MOCK_STATS.overdueRentals,
    };
  } catch {
    return MOCK_STATS;
  }
}

// ── Recent orders (from orders page mock data) ────────────────────────────────
const RECENT_ORDERS = [
  { id:"1043", buyer:"ananya_m",     seller:"priya_sharma", item:"Red Bridal Lehenga",   total:4500, status:"Processing", date:"Jun 9" },
  { id:"1042", buyer:"kavitha_wears",seller:"priya_sharma", item:"Zardozi Saree",         total:980,  status:"Shipped",    date:"Jun 7" },
  { id:"1041", buyer:"meera_b",      seller:"raj_styles",   item:"Navy Sherwani",         total:1600, status:"Delivered",  date:"Jun 6" },
  { id:"1040", buyer:"sana.rents",   seller:"meera_b",      item:"Silk Sharara Set",      total:540,  status:"Completed",  date:"Jun 2" },
  { id:"1039", buyer:"divya.looks",  seller:"ananya_m",     item:"Indo-Western Jumpsuit", total:490,  status:"Completed",  date:"Jun 1" },
];

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Processing: { bg: "#FEF3C7", text: "#92400E" },
  Shipped:    { bg: "#DBEAFE", text: "#1E40AF" },
  Delivered:  { bg: "#D1FAE5", text: "#065F46" },
  Completed:  { bg: "rgba(196,68,10,0.1)", text: "#C4440A" },
};

// ── Pending listings queue ────────────────────────────────────────────────────
const PENDING_LISTINGS = [
  { id:"L88", seller:"new_seller_1",  title:"Bridal Lehenga Set",       submitted:"Jun 9", bg:"#D4C5B5" },
  { id:"L87", seller:"fashionista_r", title:"Kundan Jewellery Set",     submitted:"Jun 8", bg:"#E8D8B8" },
  { id:"L86", seller:"trendy_fits",   title:"Velvet Sherwani",          submitted:"Jun 8", bg:"#C9CDD6" },
  { id:"L85", seller:"silk_road_co",  title:"Banarasi Saree — Crimson", submitted:"Jun 7", bg:"#D8A8A8" },
];

// ── Overdue rentals ───────────────────────────────────────────────────────────
const OVERDUE_RENTALS = [
  { id:"R195", buyer:"riya.wears",  seller:"priya_sharma", item:"Banarasi Silk Lehenga", daysOverdue:4, deposit:600 },
  { id:"R192", buyer:"pooja_k",     seller:"meera_b",      item:"Sequin Lehenga",        daysOverdue:2, deposit:500 },
  { id:"R198", buyer:"sana.rents",  seller:"meera_b",      item:"Gold Tissue Lehenga",   daysOverdue:1, deposit:1000 },
  { id:"R189", buyer:"arjun.style", seller:"raj_styles",   item:"Navy Sherwani Brocade", daysOverdue:1, deposit:400 },
];

// ── Server component ──────────────────────────────────────────────────────────
export default async function AdminOverview() {
  const stats = await getStats();

  const STAT_CARDS = [
    { label: "GMV (all time)",    value: `$${stats.gmv.toLocaleString()}`,      sub: "gross merchandise value"                                  },
    { label: "Total users",       value: String(stats.totalUsers),               sub: `${stats.totalSellers} with seller access`                 },
    { label: "Active listings",   value: String(stats.activeListings),           sub: `${stats.pendingListings} pending review`                   },
    { label: "Active rentals",    value: String(stats.activeRentals),            sub: `${stats.overdueRentals} overdue`                           },
    { label: "Total orders",      value: String(stats.totalOrders),              sub: "platform-wide"                                             },
    { label: "Commission earned", value: `$${stats.commission.toLocaleString()}`,sub: "10% platform fee"                                          },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic",
          fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem",
        }}>
          Overview
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>Platform health at a glance — Jun 11, 2026</p>
      </div>

      {/* KPI cards — numbers in upright Jost tabular-nums */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom: "2.5rem" }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} style={{
            background: A.card, border: `1px solid ${A.border}`, padding: "1.4rem 1.25rem",
          }}>
            <p style={{ ...lbl, marginBottom: "0.6rem" }}>{s.label}</p>
            <p className="tabular-nums" style={{
              fontFamily: "var(--font-jost)", fontWeight: 300,
              fontSize: "2rem", color: A.dark, lineHeight: 1, marginBottom: "0.3rem",
            }}>
              {s.value}
            </p>
            <p style={{ ...muted, fontSize: "0.7rem" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-col lower section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="admin-lower">

        {/* Recent orders */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <p style={lbl}>Recent orders</p>
            <Link href="/admin/orders" style={{ ...muted, fontSize: "0.72rem", textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>
          <div style={{ background: A.card, border: `1px solid ${A.border}` }}>
            <div style={{
              display: "grid", gridTemplateColumns: "60px 1fr 80px 90px",
              padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl,
            }}>
              <span>Order</span><span>Item</span><span>Total</span><span>Status</span>
            </div>
            {RECENT_ORDERS.map((o, i) => {
              const sc = STATUS_COLOR[o.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
              return (
                <div key={o.id} style={{
                  display: "grid", gridTemplateColumns: "60px 1fr 80px 90px",
                  padding: "0.75rem 1rem", alignItems: "center",
                  borderBottom: i < RECENT_ORDERS.length - 1 ? `1px solid ${A.border}` : "none",
                  background: i % 2 === 0 ? A.card : A.bg,
                }}>
                  <span style={{ ...muted, fontSize: "0.7rem" }}>#{o.id}</span>
                  <div>
                    <p style={{ ...dark, fontSize: "0.78rem", fontWeight: 500 }}>{o.item}</p>
                    <p style={{ ...muted, fontSize: "0.63rem" }}>@{o.buyer} → @{o.seller}</p>
                  </div>
                  <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark, fontWeight: 500 }}>
                    ${o.total.toLocaleString()}
                  </span>
                  <span style={{
                    display: "inline-block", padding: "0.18rem 0.5rem",
                    background: sc.bg, color: sc.text,
                    fontFamily: "var(--font-jost)", fontWeight: 700,
                    fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    width: "fit-content",
                  }}>
                    {o.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          {/* Pending listings */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <p style={lbl}>Pending review</p>
              <Link href="/admin/listings" style={{ fontSize: "0.72rem", textDecoration: "none", color: A.accent, fontFamily: "var(--font-jost)" }}>
                Review all →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {PENDING_LISTINGS.map(l => (
                <div key={l.id} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: A.card, border: `1px solid ${A.border}`,
                }}>
                  <div style={{ width: "36px", height: "36px", flexShrink: 0, background: l.bg, borderRadius: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>{l.title}</p>
                    <p style={{ ...muted, fontSize: "0.63rem" }}>@{l.seller} · {l.submitted}</p>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-jost)", fontWeight: 700,
                    fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.18rem 0.5rem", flexShrink: 0,
                    background: "#FEF3C7", color: "#92400E",
                  }}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue rentals */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <p style={lbl}>Overdue rentals</p>
              <Link href="/admin/rentals" style={{ fontSize: "0.72rem", textDecoration: "none", color: A.accent, fontFamily: "var(--font-jost)" }}>
                View all →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {OVERDUE_RENTALS.map(r => (
                <div key={r.id} style={{
                  padding: "0.75rem 1rem",
                  background: "#FFF5F5",
                  border: `1px solid #FECACA`,
                  borderLeft: "3px solid #EF4444",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.15rem" }}>{r.item}</p>
                      <p style={{ ...muted, fontSize: "0.63rem" }}>@{r.buyer} rented from @{r.seller}</p>
                    </div>
                    <span className="tabular-nums" style={{
                      fontFamily: "var(--font-jost)", fontWeight: 700,
                      fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "#991B1B", flexShrink: 0,
                    }}>
                      {r.daysOverdue}d overdue
                    </span>
                  </div>
                  <p style={{ ...muted, fontSize: "0.63rem", marginTop: "0.3rem" }}>
                    Deposit held: <span className="tabular-nums">${r.deposit}</span>
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
