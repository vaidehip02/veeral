"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const A = {
  dark: "#0D0906", muted: "#6B5E52", label: "#9C8B7E",
  accent: "#C4440A", card: "#FFFFFF", border: "#EDE6DE", bg: "#FAF6F1",
};
const dark:  React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.dark };
const muted: React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.muted };
const lbl:   React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: A.label,
};

type ListingStatus = "pending" | "active" | "rejected" | "removed" | "featured";

interface AdminListing {
  id: string; title: string; seller: string; price: number;
  type: string; garment: string; status: ListingStatus;
  submitted: string; bg: string; flagged: boolean;
}

const INITIAL_LISTINGS: AdminListing[] = [
  { id:"L88", title:"Bridal Lehenga Set — Red & Gold",       seller:"new_seller_1",   price:3200, type:"both",  garment:"Lehenga",   status:"pending",  submitted:"Jun 9",  bg:"#D4C5B5", flagged:false },
  { id:"L87", title:"Kundan Jewellery Set",                   seller:"fashionista_r",  price:890,  type:"both",  garment:"Jewellery", status:"pending",  submitted:"Jun 8",  bg:"#E8D8B8", flagged:false },
  { id:"L86", title:"Velvet Sherwani — Midnight",             seller:"trendy_fits",    price:1400, type:"both",  garment:"Sherwani",  status:"pending",  submitted:"Jun 8",  bg:"#C9CDD6", flagged:false },
  { id:"L85", title:"Banarasi Saree — Crimson",               seller:"silk_road_co",   price:980,  type:"sale",  garment:"Saree",     status:"pending",  submitted:"Jun 7",  bg:"#D8A8A8", flagged:false },
  { id:"L1",  title:"Red Bridal Lehenga with Gold Embroidery",seller:"priya_sharma",   price:4500, type:"both",  garment:"Lehenga",   status:"featured", submitted:"Jun 1",  bg:"#D4C5B5", flagged:false },
  { id:"L2",  title:"Zardozi Saree — Ivory & Gold",           seller:"priya_sharma",   price:980,  type:"both",  garment:"Saree",     status:"active",   submitted:"May 28", bg:"#E8DDD3", flagged:false },
  { id:"L7",  title:"Sequin Lehenga — Midnight Blue",         seller:"priya_sharma",   price:2200, type:"both",  garment:"Lehenga",   status:"active",   submitted:"May 25", bg:"#B8BFCC", flagged:false },
  { id:"L99", title:"Replica Designer Saree",                 seller:"suspicious_acc", price:150,  type:"sale",  garment:"Saree",     status:"active",   submitted:"Jun 5",  bg:"#C8C8C8", flagged:true  },
  { id:"L77", title:"Vintage Silk Lehenga",                   seller:"raj_styles",     price:1800, type:"sale",  garment:"Lehenga",   status:"rejected", submitted:"May 20", bg:"#D0C8B8", flagged:false },
];

const STATUS_COLOR: Record<ListingStatus, { bg: string; text: string }> = {
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  active:   { bg: "#D1FAE5", text: "#065F46" },
  featured: { bg: "rgba(196,68,10,0.1)", text: "#C4440A" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  removed:  { bg: "#F3F4F6", text: "#6B7280" },
};

type FilterTab = "all" | "pending" | "active" | "featured" | "flagged";

type ConfirmAction = { id: string; action: "reject" | "remove" };

export default function AdminListingsPage() {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [tab,      setTab]      = useState<FilterTab>("all");
  const [search,   setSearch]   = useState("");
  const [confirm,  setConfirm]  = useState<ConfirmAction | null>(null);

  const confirmTarget = confirm ? listings.find(l => l.id === confirm.id) : null;

  const setStatus = (id: string, status: ListingStatus) =>
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));

  const executeConfirm = () => {
    if (!confirm) return;
    setStatus(confirm.id, confirm.action === "reject" ? "rejected" : "removed");
    setConfirm(null);
  };

  const toggleFlag = (id: string) =>
    setListings(prev => prev.map(l => l.id === id ? { ...l, flagged: !l.flagged } : l));

  const TABS: { id: FilterTab; label: string }[] = [
    { id:"all",      label:`All (${listings.length})` },
    { id:"pending",  label:`Pending (${listings.filter(l => l.status === "pending").length})` },
    { id:"active",   label:`Active (${listings.filter(l => l.status === "active").length})` },
    { id:"featured", label:`Featured (${listings.filter(l => l.status === "featured").length})` },
    { id:"flagged",  label:`Flagged (${listings.filter(l => l.flagged).length})` },
  ];

  const filtered = listings.filter(l => {
    if (tab === "pending"  && l.status !== "pending")  return false;
    if (tab === "active"   && l.status !== "active")   return false;
    if (tab === "featured" && l.status !== "featured") return false;
    if (tab === "flagged"  && !l.flagged)              return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.seller.includes(q)) return false;
    }
    return true;
  });

  function actionBtn(variant: "green" | "red" | "orange" | "dim" | "disabled"): React.CSSProperties {
    const map = {
      green:    { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
      red:      { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" },
      orange:   { bg: "rgba(196,68,10,0.1)", color: "#C4440A", border: "rgba(196,68,10,0.25)" },
      dim:      { bg: "#F3F4F6", color: "#9CA3AF", border: A.border },
      disabled: { bg: "#F3F4F6", color: "#D1D5DB", border: A.border },
    };
    const v = map[variant];
    return {
      fontFamily: "var(--font-jost)", fontWeight: 700,
      fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase",
      padding: "0.28rem 0.55rem",
      cursor: variant === "disabled" ? "not-allowed" : "pointer",
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      transition: "all 0.15s",
    };
  }

  return (
    <div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === "reject" ? "Reject listing?" : "Remove listing?"}
        message={
          confirm?.action === "reject"
            ? `"${confirmTarget?.title}" by @${confirmTarget?.seller} will be rejected and the seller notified.`
            : `"${confirmTarget?.title}" by @${confirmTarget?.seller} will be removed from the platform.`
        }
        confirmLabel={confirm?.action === "reject" ? "Reject" : "Remove"}
        onConfirm={executeConfirm}
        onCancel={() => setConfirm(null)}
      />

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Listings
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>{listings.filter(l => l.status === "pending").length} awaiting review</p>
      </div>

      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem",
            letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.4rem 0.9rem", cursor: "pointer",
            background: tab === t.id ? A.accent : A.card,
            color: tab === t.id ? "#fff" : A.muted,
            border: `1px solid ${tab === t.id ? A.accent : A.border}`, transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
        <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: "auto", padding: "0.4rem 0.8rem", background: A.card,
            border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.78rem",
            color: A.dark, outline: "none", width: "180px" }}
          onFocus={e => (e.target.style.borderColor = A.accent)}
          onBlur={e => (e.target.style.borderColor = A.border)}
        />
      </div>

      <div style={{ background: A.card, border: `1px solid ${A.border}`, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "44px 60px 1fr 80px 80px 90px 80px 220px",
          padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl }}>
          <span /><span>ID</span><span>Listing</span><span>Price</span>
          <span>Garment</span><span>Status</span><span>Flag</span><span>Actions</span>
        </div>

        {filtered.map((l, i) => {
          const sc = STATUS_COLOR[l.status];
          return (
            <div key={l.id} style={{
              display: "grid", gridTemplateColumns: "44px 60px 1fr 80px 80px 90px 80px 220px",
              padding: "0.8rem 1rem", alignItems: "center",
              borderBottom: i < filtered.length - 1 ? `1px solid ${A.border}` : "none",
              background: l.flagged ? "#FFF5F5" : i % 2 === 0 ? A.card : A.bg,
            }}>
              <div style={{ width: "36px", height: "36px", background: l.bg, borderRadius: "2px", flexShrink: 0 }} />
              <p style={{ ...muted, fontSize: "0.68rem" }}>#{l.id}</p>
              <div>
                <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>{l.title}</p>
                <p style={{ ...muted, fontSize: "0.65rem" }}>@{l.seller} · {l.submitted}</p>
              </div>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark, fontWeight: 500 }}>
                ${l.price.toLocaleString()}
              </span>
              <p style={{ ...muted, fontSize: "0.72rem" }}>{l.garment}</p>
              <span style={{ display: "inline-block", padding: "0.18rem 0.45rem",
                background: sc.bg, color: sc.text,
                fontFamily: "var(--font-jost)", fontWeight: 700,
                fontSize: "0.52rem", letterSpacing: "0.1em", textTransform: "uppercase", width: "fit-content" }}>
                {l.status}
              </span>
              <button onClick={() => toggleFlag(l.id)} style={{
                fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.55rem",
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.28rem 0.55rem", cursor: "pointer",
                background: l.flagged ? "#FEE2E2" : "#F3F4F6",
                color: l.flagged ? "#991B1B" : A.muted,
                border: `1px solid ${l.flagged ? "#FECACA" : A.border}`, transition: "all 0.15s" }}>
                {l.flagged ? "⚑ Flagged" : "Flag"}
              </button>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {l.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(l.id, "active")} style={actionBtn("green")}>Approve</button>
                    <button onClick={() => setConfirm({ id: l.id, action: "reject" })} style={actionBtn("red")}>Reject</button>
                  </>
                )}
                {l.status === "active" && (
                  <>
                    {/* Feature disabled if flagged */}
                    <button
                      onClick={() => !l.flagged && setStatus(l.id, "featured")}
                      style={actionBtn(l.flagged ? "disabled" : "orange")}
                      title={l.flagged ? "Clear the flag before featuring this listing" : undefined}
                    >
                      Feature
                    </button>
                    <button onClick={() => setConfirm({ id: l.id, action: "remove" })} style={actionBtn("red")}>Remove</button>
                  </>
                )}
                {l.status === "featured" && (
                  <button onClick={() => setStatus(l.id, "active")} style={actionBtn("dim")}>Unfeature</button>
                )}
                {(l.status === "rejected" || l.status === "removed") && (
                  <button onClick={() => setStatus(l.id, "active")} style={actionBtn("green")}>Restore</button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", ...muted, fontSize: "0.82rem" }}>
            No listings in this view.
          </div>
        )}
      </div>
    </div>
  );
}
