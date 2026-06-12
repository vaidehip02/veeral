"use client";

import { useState } from "react";

type ListingStatus = "pending" | "active" | "rejected" | "removed" | "featured";

interface AdminListing {
  id: string;
  title: string;
  seller: string;
  price: number;
  type: string;
  garment: string;
  status: ListingStatus;
  submitted: string;
  bg: string;
  flagged: boolean;
}

const INITIAL_LISTINGS: AdminListing[] = [
  { id:"L88", title:"Bridal Lehenga Set — Red & Gold",       seller:"new_seller_1",   price:3200, type:"both",  garment:"Lehenga",       status:"pending",  submitted:"Jun 9",  bg:"#D4C5B5", flagged:false },
  { id:"L87", title:"Kundan Jewellery Set",                   seller:"fashionista_r",  price:890,  type:"both",  garment:"Jewellery",     status:"pending",  submitted:"Jun 8",  bg:"#E8D8B8", flagged:false },
  { id:"L86", title:"Velvet Sherwani — Midnight",             seller:"trendy_fits",    price:1400, type:"both",  garment:"Sherwani",      status:"pending",  submitted:"Jun 8",  bg:"#C9CDD6", flagged:false },
  { id:"L85", title:"Banarasi Saree — Crimson",               seller:"silk_road_co",   price:980,  type:"sale",  garment:"Saree",         status:"pending",  submitted:"Jun 7",  bg:"#D8A8A8", flagged:false },
  { id:"L1",  title:"Red Bridal Lehenga with Gold Embroidery",seller:"priya_sharma",   price:4500, type:"both",  garment:"Lehenga",       status:"featured", submitted:"Jun 1",  bg:"#D4C5B5", flagged:false },
  { id:"L2",  title:"Zardozi Saree — Ivory & Gold",           seller:"priya_sharma",   price:980,  type:"both",  garment:"Saree",         status:"active",   submitted:"May 28", bg:"#E8DDD3", flagged:false },
  { id:"L7",  title:"Sequin Lehenga — Midnight Blue",         seller:"priya_sharma",   price:2200, type:"both",  garment:"Lehenga",       status:"active",   submitted:"May 25", bg:"#B8BFCC", flagged:false },
  { id:"L99", title:"Replica Designer Saree",                 seller:"suspicious_acc", price:150,  type:"sale",  garment:"Saree",         status:"active",   submitted:"Jun 5",  bg:"#C8C8C8", flagged:true  },
  { id:"L77", title:"Vintage Silk Lehenga",                   seller:"raj_styles",     price:1800, type:"sale",  garment:"Lehenga",       status:"rejected", submitted:"May 20", bg:"#D0C8B8", flagged:false },
];

type FilterTab = "all" | "pending" | "active" | "featured" | "flagged";

const STATUS_COLOR: Record<ListingStatus, { bg:string; text:string }> = {
  pending:  { bg:"rgba(255,193,7,0.15)",   text:"#FFC107"                },
  active:   { bg:"rgba(45,106,79,0.2)",    text:"#81C995"                },
  featured: { bg:"rgba(201,92,26,0.2)",    text:"var(--burnt-orange)"    },
  rejected: { bg:"rgba(198,40,40,0.15)",   text:"#EF9A9A"                },
  removed:  { bg:"rgba(255,255,255,0.07)", text:"rgba(250,246,241,0.35)" },
};

const dark:  React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.9)" };
const muted: React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.4)" };
const lbl:   React.CSSProperties = { fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(250,246,241,0.35)" };

export default function AdminListingsPage() {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [tab,      setTab]      = useState<FilterTab>("all");
  const [search,   setSearch]   = useState("");

  const setStatus = (id: string, status: ListingStatus) =>
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));

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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
          Listings
        </h1>
        <p style={{ ...muted, fontSize:"0.78rem" }}>{listings.filter(l => l.status === "pending").length} awaiting review</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontFamily:"var(--font-jost)", fontWeight:600,
            fontSize:"0.6rem", letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"0.4rem 0.9rem", cursor:"pointer",
            background: tab === t.id ? "var(--burnt-orange)" : "rgba(255,255,255,0.06)",
            color: tab === t.id ? "var(--cream)" : "rgba(250,246,241,0.5)",
            border:`1px solid ${tab === t.id ? "var(--burnt-orange)" : "rgba(255,255,255,0.1)"}`,
            transition:"all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
        <input
          type="text" placeholder="Search…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            marginLeft:"auto", padding:"0.4rem 0.8rem",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"#FAF6F1",
            outline:"none", width:"180px",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ border:"1px solid rgba(255,255,255,0.08)", overflowX:"auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"44px 60px 1fr 80px 80px 90px 80px 220px", padding:"0.6rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)", ...lbl }}>
          <span />
          <span>ID</span><span>Listing</span><span>Price</span>
          <span>Garment</span><span>Status</span><span>Flag</span><span>Actions</span>
        </div>

        {filtered.map((l, i) => {
          const sc = STATUS_COLOR[l.status];
          return (
            <div key={l.id} style={{
              display:"grid", gridTemplateColumns:"44px 60px 1fr 80px 80px 90px 80px 220px",
              padding:"0.8rem 1rem", alignItems:"center",
              borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              background: l.flagged
                ? "rgba(198,40,40,0.06)"
                : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
            }}>
              <div style={{ width:"36px", height:"36px", background:l.bg, borderRadius:"2px", flexShrink:0 }} />
              <p style={{ ...muted, fontSize:"0.68rem" }}>#{l.id}</p>
              <div>
                <p style={{ ...dark, fontSize:"0.8rem", fontWeight:500 }}>{l.title}</p>
                <p style={{ ...muted, fontSize:"0.65rem" }}>@{l.seller} · {l.submitted}</p>
              </div>
              <span style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontSize:"0.95rem", color:"#FAF6F1" }}>
                ${l.price.toLocaleString()}
              </span>
              <p style={{ ...muted, fontSize:"0.72rem" }}>{l.garment}</p>
              <span style={{
                display:"inline-block", padding:"0.18rem 0.45rem",
                background:sc.bg, color:sc.text,
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase",
                width:"fit-content",
              }}>
                {l.status}
              </span>
              <button onClick={() => toggleFlag(l.id)} style={{
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
                padding:"0.28rem 0.55rem", cursor:"pointer",
                background: l.flagged ? "rgba(198,40,40,0.2)" : "rgba(255,255,255,0.05)",
                color: l.flagged ? "#EF9A9A" : "rgba(250,246,241,0.35)",
                border:`1px solid ${l.flagged ? "rgba(198,40,40,0.3)" : "rgba(255,255,255,0.08)"}`,
                transition:"all 0.15s",
              }}>
                {l.flagged ? "⚑ Flagged" : "Flag"}
              </button>
              <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                {l.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(l.id, "active")} style={actionBtn("green")}>Approve</button>
                    <button onClick={() => setStatus(l.id, "rejected")} style={actionBtn("red")}>Reject</button>
                  </>
                )}
                {l.status === "active" && (
                  <>
                    <button onClick={() => setStatus(l.id, "featured")} style={actionBtn("orange")}>Feature</button>
                    <button onClick={() => setStatus(l.id, "removed")} style={actionBtn("red")}>Remove</button>
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
          <div style={{ padding:"3rem", textAlign:"center", ...muted, fontSize:"0.82rem" }}>
            No listings in this view.
          </div>
        )}
      </div>
    </div>
  );
}

function actionBtn(variant: "green" | "red" | "orange" | "dim"): React.CSSProperties {
  const map = {
    green:  { bg:"rgba(45,106,79,0.2)",    color:"#81C995", border:"rgba(45,106,79,0.3)"       },
    red:    { bg:"rgba(198,40,40,0.15)",   color:"#EF9A9A", border:"rgba(198,40,40,0.25)"      },
    orange: { bg:"rgba(201,92,26,0.2)",    color:"var(--burnt-orange)", border:"rgba(201,92,26,0.3)" },
    dim:    { bg:"rgba(255,255,255,0.05)", color:"rgba(250,246,241,0.4)", border:"rgba(255,255,255,0.1)" },
  };
  const v = map[variant];
  return {
    fontFamily:"var(--font-jost)", fontWeight:600,
    fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
    padding:"0.28rem 0.55rem", cursor:"pointer",
    background:v.bg, color:v.color, border:`1px solid ${v.border}`,
    transition:"all 0.15s",
  };
}
