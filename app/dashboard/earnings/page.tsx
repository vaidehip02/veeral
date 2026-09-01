"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PayoutRow {
  id: string;
  created_at: string;
  title: string;
  type: string;
  net: number;
}

export default function EarningsPage() {
  const supabase = createClient();
  const [totalEarned, setTotalEarned] = useState<number | null>(null);
  const [pendingPayout, setPendingPayout] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all seller orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, amount, seller_payout, type, status, listing_id, listings(title)")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (orders) {
        const delivered = orders.filter(o => o.status === "delivered");
        const pending   = orders.filter(o => o.status === "paid" || o.status === "shipped");

        setTotalEarned(delivered.reduce((s, o) => s + (o.seller_payout ?? 0), 0));
        setPendingPayout(pending.reduce((s, o) => s + (o.seller_payout ?? 0), 0));
        setPendingCount(pending.length);

        setPayouts(delivered.map(o => ({
          id: o.id,
          created_at: o.created_at,
          title: (o.listings as { title?: string } | null)?.title ?? "Item",
          type: o.type === "rent" ? "Rental" : "Sale",
          net: o.seller_payout ?? 0,
        })));
      }

      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConnectStripe() {
    setConnecting(true);
    setConnectError("");
    try {
      const res  = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectError("Failed to connect to Stripe. Please try again or contact support.");
        setConnecting(false);
      }
    } catch {
      setConnectError("Something went wrong. Please try again.");
      setConnecting(false);
    }
  }

  const fmt = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const totalShown = payouts.reduce((s, r) => s + r.net, 0);

  return (
    <div style={{ maxWidth: "860px" }}>

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem"
        }}>
          Earnings
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          Your financial summary and payout history
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ marginBottom: "2.5rem" }}>
        {[
          {
            label: "Total earned to date",
            value: loading ? "—" : fmt(totalEarned ?? 0),
            sub: loading ? "" : `across ${payouts.length} transaction${payouts.length !== 1 ? "s" : ""}`,
          },
          {
            label: "Pending payouts",
            value: loading ? "—" : fmt(pendingPayout ?? 0),
            sub: loading ? "" : `${pendingCount} order${pendingCount !== 1 ? "s" : ""} awaiting delivery`,
          },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#fff", border: "1px solid var(--warm-tan)",
            padding: "1.4rem 1.25rem", borderRadius: "2px",
          }}>
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
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "var(--muted)", opacity: 0.65 }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Bank note */}
      <div style={{
        background: "rgba(201,92,26,0.06)", border: "1px solid rgba(201,92,26,0.2)",
        padding: "1.25rem 1.5rem", marginBottom: "2.5rem",
      }}>
        <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--burnt-orange)", marginBottom: "0.5rem" }}>
          Connect your bank account
        </p>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
          To receive payouts when your items sell or are rented, connect your bank account via Stripe. This is required before your first payout.
        </p>
        <button
          onClick={handleConnectStripe}
          disabled={connecting}
          style={{
            fontFamily: "var(--font-jost)", fontWeight: 700,
            fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
            padding: "0.7rem 1.4rem", border: "none", cursor: connecting ? "not-allowed" : "pointer",
            background: connecting ? "#C8BAA8" : "var(--burnt-orange)",
            color: "#fff", opacity: connecting ? 0.7 : 1,
          }}
        >
          {connecting ? "Redirecting to Stripe…" : "Connect bank account →"}
        </button>
        {connectError && (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#C62828", marginTop: "0.75rem" }}>
            {connectError}
          </p>
        )}
      </div>

      {/* Payout history */}
      <div>
        <p style={{
          fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: "var(--burnt-orange)", marginBottom: "1.25rem"
        }}>
          Payout history
        </p>

        {!loading && payouts.length === 0 ? (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "var(--muted)", opacity: 0.6 }}>
            No completed payouts yet. Earnings appear here once an order is delivered.
          </p>
        ) : (
          <>
            <div className="hidden md:grid" style={{
              gridTemplateColumns: "110px 1fr 80px 110px",
              padding: "0.6rem 1rem",
              borderBottom: "2px solid var(--warm-tan)",
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--muted)", opacity: 0.6,
            }}>
              <span>Date</span>
              <span>Item</span>
              <span>Type</span>
              <span style={{ textAlign: "right" }}>Net payout</span>
            </div>

            {payouts.map((row, i) => (
              <div key={row.id} style={{ borderBottom: "1px solid var(--warm-tan)" }}>
                <div className="hidden md:grid items-center" style={{
                  gridTemplateColumns: "110px 1fr 80px 110px",
                  padding: "0.9rem 1rem",
                  background: i % 2 === 0 ? "#fff" : "transparent",
                  gap: "0.5rem",
                }}>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.73rem", color: "var(--muted)", opacity: 0.6 }}>
                    {fmtDate(row.created_at)}
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", fontWeight: 500, color: "#1A1A18" }}>
                    {row.title}
                  </span>
                  <span style={{
                    display: "inline-block", width: "fit-content",
                    padding: "0.15rem 0.5rem",
                    background: row.type === "Rental" ? "#E3F2FD" : "#F5F5F5",
                    color: row.type === "Rental" ? "#1D4E89" : "#555",
                    fontFamily: "var(--font-jost)", fontWeight: 600,
                    fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase",
                    borderRadius: "2px",
                  }}>
                    {row.type}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                    fontSize: "1rem", fontWeight: 500, color: "#2D6A4F", textAlign: "right"
                  }}>
                    {fmt(row.net)}
                  </span>
                </div>

                <div className="md:hidden" style={{ padding: "0.9rem 0", background: i % 2 === 0 ? "#fff" : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#1A1A18" }}>
                        {row.title}
                      </p>
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: "var(--muted)", opacity: 0.6 }}>
                        {fmtDate(row.created_at)} · {row.type}
                      </p>
                    </div>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: "#2D6A4F" }}>
                      {fmt(row.net)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {payouts.length > 0 && (
              <div className="hidden md:grid" style={{
                gridTemplateColumns: "110px 1fr 80px 110px",
                padding: "1rem 1rem",
                borderTop: "2px solid var(--warm-tan)",
                background: "rgba(201,92,26,0.04)",
                gap: "0.5rem",
              }}>
                <span />
                <span style={{
                  fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.7rem",
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)"
                }}>
                  Total
                </span>
                <span />
                <span style={{
                  fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                  fontSize: "1.1rem", color: "#2D6A4F", textAlign: "right", fontWeight: 500
                }}>
                  {fmt(totalShown)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
