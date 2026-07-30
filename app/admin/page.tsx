import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "#FEF3C7", text: "#92400E" },
  paid:      { bg: "#DBEAFE", text: "#1E40AF" },
  shipped:   { bg: "#DBEAFE", text: "#1E40AF" },
  delivered: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#F3F4F6", text: "#6B7280" },
  refunded:  { bg: "#F3F4F6", text: "#6B7280" },
};

export default async function AdminOverview() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const [
    sellersRes,
    activeListRes,
    draftListRes,
    ordersRes,
    recentOrdersRes,
    pendingListingsRes,
    overdueRentalsRes,
  ] = await Promise.all([
    supabase.from("seller_profiles").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("orders").select("amount, platform_fee, type, status"),
    supabase
      .from("orders")
      .select("id, created_at, amount, status, listings(title), buyer:buyer_id(seller_profiles(username)), seller:seller_id(username)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("listings")
      .select("id, title, created_at, seller_id, images, seller_profiles(username)")
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("orders")
      .select("id, rental_end, amount, listings(title), buyer:buyer_id(seller_profiles(username)), seller:seller_id(username)")
      .eq("type", "rent")
      .lt("rental_end", today)
      .in("status", ["paid", "shipped"])
      .order("rental_end", { ascending: true })
      .limit(4),
  ]);

  const allOrders = ordersRes.data ?? [];
  const gmv = allOrders.reduce((s, o) => s + (o.amount ?? 0), 0);
  const commission = allOrders.reduce((s, o) => s + (o.platform_fee ?? 0), 0);
  const activeRentals = allOrders.filter(o => o.type === "rent" && (o.status === "paid" || o.status === "shipped")).length;

  const STAT_CARDS = [
    { label: "GMV (all time)",    value: `$${(gmv / 100).toLocaleString()}`,        sub: "gross merchandise value" },
    { label: "Total sellers",     value: String(sellersRes.count ?? 0),              sub: "registered seller accounts" },
    { label: "Active listings",   value: String(activeListRes.count ?? 0),           sub: `${draftListRes.count ?? 0} pending review` },
    { label: "Active rentals",    value: String(activeRentals),                      sub: `${overdueRentalsRes.data?.length ?? 0} overdue` },
    { label: "Total orders",      value: String(allOrders.length),                   sub: "platform-wide" },
    { label: "Commission earned", value: `$${(commission / 100).toLocaleString()}`,  sub: "10% platform fee" },
  ];

  const recentOrders = recentOrdersRes.data ?? [];
  const pendingListings = pendingListingsRes.data ?? [];
  const overdueRentals = overdueRentalsRes.data ?? [];

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic",
          fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem",
        }}>
          Overview
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>Platform health at a glance — {todayLabel}</p>
      </div>

      {/* KPI cards */}
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }} className="admin-lower">

        {/* Recent orders */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
            <p style={lbl}>Recent orders</p>
            <Link href="/admin/orders" style={{ ...muted, fontSize: "0.72rem", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ background: A.card, border: `1px solid ${A.border}` }}>
            <div style={{
              display: "grid", gridTemplateColumns: "60px 1fr 80px 90px",
              padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl,
            }}>
              <span>Order</span><span>Item</span><span>Total</span><span>Status</span>
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ ...muted, fontSize: "0.75rem", padding: "1rem" }}>No orders yet.</p>
            ) : recentOrders.map((o, i) => {
              const sc = STATUS_COLOR[o.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
              const title = (o.listings as { title?: string } | null)?.title ?? "Item";
              const shortId = o.id.slice(0, 6).toUpperCase();
              return (
                <div key={o.id} style={{
                  display: "grid", gridTemplateColumns: "60px 1fr 80px 90px",
                  padding: "0.75rem 1rem", alignItems: "center",
                  borderBottom: i < recentOrders.length - 1 ? `1px solid ${A.border}` : "none",
                  background: i % 2 === 0 ? A.card : A.bg,
                }}>
                  <span style={{ ...muted, fontSize: "0.7rem" }}>#{shortId}</span>
                  <div>
                    <p style={{ ...dark, fontSize: "0.78rem", fontWeight: 500 }}>{title}</p>
                    <p style={{ ...muted, fontSize: "0.63rem" }}>{fmtDate(o.created_at)}</p>
                  </div>
                  <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark, fontWeight: 500 }}>
                    ${((o.amount ?? 0) / 100).toLocaleString()}
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
              {pendingListings.length === 0 ? (
                <p style={{ ...muted, fontSize: "0.75rem" }}>No listings pending review.</p>
              ) : pendingListings.map(l => {
                const img = (l.images as string[] | null)?.[0];
                const sp = l.seller_profiles as { username?: string } | null;
                return (
                  <div key={l.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    background: A.card, border: `1px solid ${A.border}`,
                  }}>
                    <div style={{
                      width: "36px", height: "36px", flexShrink: 0,
                      background: img ? `url(${img}) center/cover` : "#D4C5B5",
                      borderRadius: "2px",
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>{l.title}</p>
                      <p style={{ ...muted, fontSize: "0.63rem" }}>@{sp?.username ?? "unknown"} · {fmtDate(l.created_at)}</p>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-jost)", fontWeight: 700,
                      fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "0.18rem 0.5rem", flexShrink: 0,
                      background: "#FEF3C7", color: "#92400E",
                    }}>
                      Draft
                    </span>
                  </div>
                );
              })}
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
              {overdueRentals.length === 0 ? (
                <p style={{ ...muted, fontSize: "0.75rem" }}>No overdue rentals.</p>
              ) : overdueRentals.map(r => {
                const title = (r.listings as { title?: string } | null)?.title ?? "Item";
                const dueDate = r.rental_end ? new Date(r.rental_end) : null;
                const daysOverdue = dueDate
                  ? Math.floor((Date.now() - dueDate.getTime()) / 86400000)
                  : 0;
                return (
                  <div key={r.id} style={{
                    padding: "0.75rem 1rem",
                    background: "#FFF5F5", border: `1px solid #FECACA`,
                    borderLeft: "3px solid #EF4444",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.15rem" }}>{title}</p>
                        <p style={{ ...muted, fontSize: "0.63rem" }}>Due {r.rental_end}</p>
                      </div>
                      <span className="tabular-nums" style={{
                        fontFamily: "var(--font-jost)", fontWeight: 700,
                        fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        color: "#991B1B", flexShrink: 0,
                      }}>
                        {daysOverdue}d overdue
                      </span>
                    </div>
                    <p style={{ ...muted, fontSize: "0.63rem", marginTop: "0.3rem" }}>
                      Deposit held: <span className="tabular-nums">${((r.amount ?? 0) / 100).toLocaleString()}</span>
                    </p>
                  </div>
                );
              })}
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
