"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  displayName: string;
  totalEarnings: number;
  activeListings: number;
  rentListings: number;
  saleListings: number;
  pendingOrders: number;
  activeRentals: number;
  nextReturnDate: string | null;
}

interface ActivityItem {
  id: string;
  type: "order" | "rental_return";
  label: string;
  detail: string;
  time: string;
  color: string;
  icon: string;
}

const btnBase: React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 600,
  fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase",
  padding: "0.65rem 1.4rem", textDecoration: "none", transition: "opacity 0.2s",
  display: "inline-block",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, listingsRes, ordersRes] = await Promise.all([
        supabase
          .from("seller_profiles")
          .select("display_name")
          .eq("id", user.id)
          .single(),
        supabase
          .from("listings")
          .select("id, type, status")
          .eq("seller_id", user.id),
        supabase
          .from("orders")
          .select("id, type, status, amount, seller_payout, created_at, rental_end, listings(title)")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const profile = profileRes.data;
      const listings = listingsRes.data ?? [];
      const orders = ordersRes.data ?? [];

      const activeListings = listings.filter(l => l.status === "active");
      const rentListings = activeListings.filter(l => l.type === "rent" || l.type === "both").length;
      const saleListings = activeListings.filter(l => l.type === "sale" || l.type === "both").length;

      const pendingOrders = orders.filter(o => o.status === "paid" && o.type === "sale").length;

      const today = new Date().toISOString().split("T")[0];
      const activeRentals = orders.filter(
        o => o.type === "rent" && ["paid", "shipped", "delivered"].includes(o.status) && o.rental_end >= today
      );

      const nextReturn = activeRentals
        .map(o => o.rental_end)
        .filter(Boolean)
        .sort()[0] ?? null;

      const totalEarnings = orders
        .filter(o => ["shipped", "delivered"].includes(o.status))
        .reduce((sum, o) => sum + (o.seller_payout ?? 0), 0);

      setStats({
        displayName: profile?.display_name?.split(" ")[0] ?? "there",
        totalEarnings,
        activeListings: activeListings.length,
        rentListings,
        saleListings,
        pendingOrders,
        activeRentals: activeRentals.length,
        nextReturnDate: nextReturn,
      });

      // Build activity feed from recent orders
      const recentActivity: ActivityItem[] = orders.slice(0, 5).map(o => {
        const title = (o.listings as { title?: string } | null)?.title ?? "item";
        if (o.type === "rent" && o.status === "delivered") {
          return {
            id: o.id,
            type: "rental_return",
            label: "Rental returned",
            detail: `${title} returned`,
            time: timeAgo(o.created_at),
            color: "#1D4E89",
            icon: "↩",
          };
        }
        if (o.status === "shipped") {
          return {
            id: o.id,
            type: "order",
            label: "Item shipped",
            detail: `Tracking added for ${title}`,
            time: timeAgo(o.created_at),
            color: "var(--burnt-orange)",
            icon: "↗",
          };
        }
        return {
          id: o.id,
          type: "order",
          label: "New order received",
          detail: `Someone purchased ${title}`,
          time: timeAgo(o.created_at),
          color: "#2D6A4F",
          icon: "✦",
        };
      });

      setActivity(recentActivity);
      setLoading(false);
    }

    load();
  }, []);

  const QUICK_ACTIONS = [
    { label: "Create new listing", href: "/listings/new", primary: true },
    { label: "View all orders", href: "/dashboard/orders", primary: false },
    { label: "View all rentals", href: "/dashboard/rentals", primary: false },
  ];

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Welcome */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1A1A18", lineHeight: 1.1,
          marginBottom: "0.4rem",
        }}>
          {loading ? "Hi" : `Hi, ${stats?.displayName}`}
        </h1>
        <p style={{
          fontFamily: "var(--font-jost)", fontSize: "0.85rem", fontWeight: 400,
          color: "var(--muted)", letterSpacing: "0.04em", opacity: 0.7,
        }}>
          Here&apos;s what&apos;s happening with your shop today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: "2.5rem" }}>
        {[
          {
            label: "Total earnings",
            value: loading ? "—" : `$${((stats?.totalEarnings ?? 0) / 100).toLocaleString()}`,
            sub: loading ? "" : `across ${stats?.activeListings ?? 0} active listings`,
          },
          {
            label: "Active listings",
            value: loading ? "—" : String(stats?.activeListings ?? 0),
            sub: loading ? "" : `${stats?.rentListings ?? 0} for rent, ${stats?.saleListings ?? 0} for sale`,
          },
          {
            label: "Pending orders",
            value: loading ? "—" : String(stats?.pendingOrders ?? 0),
            sub: "awaiting shipment",
          },
          {
            label: "Active rentals",
            value: loading ? "—" : String(stats?.activeRentals ?? 0),
            sub: stats?.nextReturnDate ? `return due ${new Date(stats.nextReturnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "no returns due",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "#fff", border: "1px solid var(--warm-tan)",
              padding: "1.4rem 1.2rem", borderRadius: "2px",
            }}
          >
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.62rem", fontWeight: 600,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "var(--burnt-orange)", marginBottom: "0.6rem"
            }}>
              {card.label}
            </p>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "2rem", fontWeight: 400, color: "#1A1A18", lineHeight: 1, marginBottom: "0.3rem"
            }}>
              {card.value}
            </p>
            <p style={{
              fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.65
            }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "3rem" }}>
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            style={{
              ...btnBase,
              background: a.primary ? "var(--burnt-orange)" : "transparent",
              color: a.primary ? "var(--cream)" : "var(--muted)",
              border: a.primary ? "1px solid var(--burnt-orange)" : "1px solid var(--warm-tan)",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1.25rem"
        }}>
          Recent activity
        </p>

        {!loading && activity.length === 0 && (
          <p style={{
            fontFamily: "var(--font-jost)", fontSize: "0.82rem",
            color: "var(--muted)", opacity: 0.6, padding: "1.5rem 0"
          }}>
            No activity yet — create your first listing to get started.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {activity.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1rem 0",
                borderBottom: i < activity.length - 1 ? "1px solid var(--warm-tan)" : "none",
              }}
            >
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: `${item.color === "var(--burnt-orange)" ? "#C95C1A" : item.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                color: item.color, fontWeight: 700,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.8rem", color: "#1A1A18", marginBottom: "0.15rem"
                }}>
                  {item.label}
                </p>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.75rem",
                  color: "var(--muted)", opacity: 0.7, letterSpacing: "0.02em"
                }}>
                  {item.detail}
                </p>
              </div>
              <p style={{
                fontFamily: "var(--font-jost)", fontSize: "0.68rem",
                color: "var(--muted)", opacity: 0.5, flexShrink: 0, whiteSpace: "nowrap"
              }}>
                {item.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
