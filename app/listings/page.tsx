"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingType = "sale" | "rent" | "both";
type Condition    = "new" | "like_new" | "good" | "fair";
type SortOption   = "newest" | "price_asc" | "price_desc" | "popular";

interface Listing {
  id: string;
  title: string;
  price: number;
  rent_price?: number;
  type: ListingType;
  garment: string;
  occasion: string[];
  size: string;
  condition: Condition;
  fabric: string;
  embellishments: string[];
  designer: string;
  seller: string;
  bg: string;
  views: number;
  created_at: string; // ISO-ish for sort
}

// ─── Mock data (replace with Supabase) ───────────────────────────────────────

const ALL_LISTINGS: Listing[] = [
  { id:"1",  title:"Red Bridal Lehenga with Gold Embroidery", price:4500, rent_price:120, type:"both",  garment:"Lehenga",        occasion:["Bridal","Wedding guest"], size:"6",  condition:"like_new", fabric:"Silk",      embellishments:["Zari","Beading"],          designer:"Anita Dongre",     seller:"priya_sharma",  bg:"#D4C5B5", views:412, created_at:"2026-06-01" },
  { id:"2",  title:"Zardozi Saree — Ivory & Gold",            price:980,  rent_price:65,  type:"both",  garment:"Saree",          occasion:["Wedding guest","Formal"],  size:"Free",condition:"like_new", fabric:"Silk",      embellishments:["Zari","Thread embroidery"],designer:"Sabyasachi",       seller:"priya_sharma",  bg:"#E8DDD3", views:308, created_at:"2026-05-28" },
  { id:"3",  title:"Pink Anarkali Kurta Set",                  price:320,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Festival","Party"],        size:"8",  condition:"good",     fabric:"Georgette", embellishments:["Thread embroidery"],       designer:"",                 seller:"ananya_m",      bg:"#DDD0C5", views:187, created_at:"2026-06-05" },
  { id:"4",  title:"Mirror-work Lehenga (Bridal)",             price:3800, rent_price:160, type:"both",  garment:"Lehenga",        occasion:["Bridal"],                  size:"4",  condition:"new",      fabric:"Velvet",    embellishments:["Mirror work","Zari"],       designer:"Manish Malhotra",  seller:"priya_sharma",  bg:"#C8B9A8", views:521, created_at:"2026-05-15" },
  { id:"5",  title:"Silk Sharara Set — Sage Green",            price:540,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Engagement","Party"],      size:"10", condition:"like_new", fabric:"Silk",      embellishments:["Thread embroidery"],       designer:"",                 seller:"meera_b",       bg:"#CFC0AF", views:143, created_at:"2026-06-08" },
  { id:"6",  title:"Blue Banarasi Silk Saree",                 price:1200,                type:"sale",  garment:"Saree",          occasion:["Wedding guest","Diwali"],  size:"Free",condition:"good",     fabric:"Silk",      embellishments:["Zari","Brocade"],          designer:"",                 seller:"priya_sharma",  bg:"#C3B5A8", views:229, created_at:"2026-05-20" },
  { id:"7",  title:"Sequin Lehenga — Midnight Blue",           price:2200, rent_price:95,  type:"both",  garment:"Lehenga",        occasion:["Wedding guest","Party"],   size:"6",  condition:"like_new", fabric:"Net",       embellishments:["Sequins","Beading"],        designer:"",                 seller:"priya_sharma",  bg:"#B8BFCC", views:376, created_at:"2026-05-25" },
  { id:"8",  title:"Embroidered Chanderi Saree",               price:780,  rent_price:45,  type:"both",  garment:"Saree",          occasion:["Festival","Eid","Casual"], size:"Free",condition:"good",     fabric:"Chiffon",   embellishments:["Thread embroidery"],       designer:"",                 seller:"kavitha_wears", bg:"#DDD5CA", views:165, created_at:"2026-06-02" },
  { id:"9",  title:"Ivory Sharara Set",                        price:460,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Engagement","Formal"],     size:"12", condition:"like_new", fabric:"Georgette", embellishments:["Stone work"],              designer:"",                 seller:"divya.looks",   bg:"#CABDB1", views:98,  created_at:"2026-06-07" },
  { id:"10", title:"Gold Tissue Lehenga",                      price:5100, rent_price:200, type:"both",  garment:"Lehenga",        occasion:["Bridal","Wedding guest"], size:"4",  condition:"new",      fabric:"Tissue",    embellishments:["Zari","Stone work"],        designer:"Tarun Tahiliani",  seller:"priya_sharma",  bg:"#E0DDD8", views:489, created_at:"2026-05-10" },
  { id:"11", title:"Dusty Pink Anarkali — Georgette",          price:290,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Casual","Party"],          size:"8",  condition:"fair",     fabric:"Georgette", embellishments:["Thread embroidery"],       designer:"",                 seller:"sana.rents",    bg:"#D9C9C4", views:72,  created_at:"2026-06-09" },
  { id:"12", title:"Bridal Dupatta — Red & Gold",              price:180,  rent_price:30,  type:"rent",  garment:"Other",          occasion:["Bridal"],                  size:"Free",condition:"new",      fabric:"Net",       embellishments:["Zari","Stone work"],        designer:"",                 seller:"priya_sharma",  bg:"#E3D5CA", views:134, created_at:"2026-05-30" },
  { id:"13", title:"Navy Sherwani — Brocade",                  price:1600, rent_price:80,  type:"both",  garment:"Sherwani",       occasion:["Wedding guest","Formal"],  size:"40", condition:"like_new", fabric:"Brocade",   embellishments:["Zari"],                    designer:"Manyavar",         seller:"raj_styles",    bg:"#C9CDD6", views:201, created_at:"2026-05-18" },
  { id:"14", title:"Yellow Bandhani Saree",                    price:340,                 type:"sale",  garment:"Saree",          occasion:["Festival","Diwali","Eid"],  size:"Free",condition:"good",     fabric:"Cotton",    embellishments:["Bandhani"],                designer:"",                 seller:"kavitha_wears", bg:"#E5DCC6", views:119, created_at:"2026-06-03" },
  { id:"15", title:"Organza Lehenga — Blush",                  price:1850, rent_price:85,  type:"both",  garment:"Lehenga",        occasion:["Engagement","Wedding guest"],size:"6", condition:"like_new", fabric:"Organza",   embellishments:["Thread embroidery","Sequins"],designer:"",              seller:"meera_b",       bg:"#E0CECC", views:284, created_at:"2026-05-22" },
  { id:"16", title:"Ikkat Silk Saree — Rust",                  price:620,                 type:"sale",  garment:"Saree",          occasion:["Casual","Festival"],       size:"Free",condition:"good",     fabric:"Silk",      embellishments:["Ikkat"],                   designer:"",                 seller:"divya.looks",   bg:"#D4A89A", views:93,  created_at:"2026-06-06" },
  { id:"17", title:"Indo-Western Jumpsuit — Emerald",          price:490,                 type:"sale",  garment:"Indo-Western",   occasion:["Party","Formal"],          size:"8",  condition:"like_new", fabric:"Crepe",     embellishments:["Stone work"],              designer:"",                 seller:"ananya_m",      bg:"#B5C4B1", views:156, created_at:"2026-06-04" },
  { id:"18", title:"Velvet Lehenga — Burgundy",                price:2800, rent_price:110, type:"both",  garment:"Lehenga",        occasion:["Bridal","Wedding guest"], size:"10", condition:"like_new", fabric:"Velvet",    embellishments:["Zari","Beading"],          designer:"",                 seller:"sana.rents",    bg:"#C4A8A8", views:318, created_at:"2026-05-12" },
  { id:"19", title:"Block Print Kurta Set — Indigo",           price:180,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Casual","Festival"],       size:"12", condition:"good",     fabric:"Cotton",    embellishments:["Block print"],             designer:"",                 seller:"kavitha_wears", bg:"#A8B4C4", views:67,  created_at:"2026-06-08" },
  { id:"20", title:"Cream Chikankari Saree",                   price:540,  rent_price:40,  type:"both",  garment:"Saree",          occasion:["Eid","Casual","Formal"],   size:"Free",condition:"like_new", fabric:"Chiffon",   embellishments:["Thread embroidery"],       designer:"",                 seller:"meera_b",       bg:"#EDE8E0", views:211, created_at:"2026-05-27" },
  { id:"21", title:"Kundan Jewellery Set — Bridal",            price:890,  rent_price:55,  type:"both",  garment:"Jewellery",      occasion:["Bridal","Engagement"],     size:"Free",condition:"new",      fabric:"",          embellishments:["Stone work","Beading"],    designer:"",                 seller:"raj_styles",    bg:"#E8D8B8", views:342, created_at:"2026-05-05" },
  { id:"22", title:"Pastel Lehenga — Floral Appliqué",         price:1380, rent_price:70,  type:"both",  garment:"Lehenga",        occasion:["Wedding guest","Engagement"],size:"8", condition:"like_new", fabric:"Net",       embellishments:["Thread embroidery"],       designer:"",                 seller:"ananya_m",      bg:"#D8C8D0", views:195, created_at:"2026-05-24" },
  { id:"23", title:"Linen Salwar Suit — Sage",                 price:210,                 type:"sale",  garment:"Salwar Kameez",  occasion:["Casual"],                  size:"14", condition:"good",     fabric:"Linen",     embellishments:["Plain"],                   designer:"",                 seller:"divya.looks",   bg:"#C8D4C0", views:44,  created_at:"2026-06-09" },
  { id:"24", title:"White Chiffon Saree — Silver Border",      price:720,  rent_price:50,  type:"both",  garment:"Saree",          occasion:["Formal","Wedding guest"],  size:"Free",condition:"like_new", fabric:"Chiffon",   embellishments:["Stone work"],              designer:"",                 seller:"priya_sharma",  bg:"#E8E8E8", views:177, created_at:"2026-05-16" },
];

// ─── Filter options ───────────────────────────────────────────────────────────

const GARMENT_TYPES = ["Lehenga","Saree","Salwar Kameez","Sherwani","Indo-Western","Jewellery","Other"];
const OCCASIONS     = ["Bridal","Wedding guest","Engagement","Festival","Eid","Diwali","Casual","Party","Formal"];
const US_SIZES      = ["0","2","4","6","8","10","12","14","16","Free"];
const CONDITIONS    = [
  { value:"new",      label:"New with tags" },
  { value:"like_new", label:"Like new" },
  { value:"good",     label:"Good" },
  { value:"fair",     label:"Fair" },
] as const;
const FABRICS = ["Silk","Georgette","Chiffon","Net","Velvet","Brocade","Cotton","Linen","Crepe","Tissue","Organza"];
const EMBELLISHMENTS = ["Zari","Sequins","Mirror work","Thread embroidery","Beading","Stone work","Block print","Bandhani","Ikkat","Plain"];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value:"newest",     label:"Newest" },
  { value:"price_asc",  label:"Price: Low to high" },
  { value:"price_desc", label:"Price: High to low" },
  { value:"popular",    label:"Most popular" },
];

// ─── Filter state ─────────────────────────────────────────────────────────────

interface Filters {
  garments:      string[];
  listingType:   ListingType | "all";
  occasions:     string[];
  sizes:         string[];
  priceMin:      string;
  priceMax:      string;
  conditions:    string[];
  fabrics:       string[];
  embellishments:string[];
  designer:      string;
}

const DEFAULT_FILTERS: Filters = {
  garments:[], listingType:"all", occasions:[], sizes:[],
  priceMin:"", priceMax:"", conditions:[], fabrics:[],
  embellishments:[], designer:"",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<Condition, string> = {
  new:"New with tags", like_new:"Like new", good:"Good", fair:"Fair",
};
const CONDITION_COLOR: Record<Condition, { bg:string; text:string }> = {
  new:      { bg:"#E8F5E9", text:"#2D6A4F" },
  like_new: { bg:"rgba(201,92,26,0.08)", text:"var(--burnt-orange)" },
  good:     { bg:"#F5F5F5", text:"#555" },
  fair:     { bg:"#FFF8E1", text:"#B45309" },
};

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{
      display:"flex", alignItems:"center", gap:"0.6rem",
      cursor:"pointer", padding:"0.25rem 0", userSelect:"none",
    }}>
      <span style={{
        width:"16px", height:"16px", flexShrink:0,
        border:`1px solid ${checked ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
        background: checked ? "var(--burnt-orange)" : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"0.65rem", color:"var(--cream)", transition:"all 0.15s",
      }}>
        {checked && "✓"}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display:"none" }} />
      <span style={{
        fontFamily:"var(--font-jost)", fontSize:"0.82rem",
        color: checked ? "#1A1A18" : "var(--muted)", fontWeight: checked ? 500 : 400,
      }}>
        {label}
      </span>
    </label>
  );
}

function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:"1px solid var(--warm-tan)", paddingBottom:"1.25rem", marginBottom:"1.25rem" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", justifyContent:"space-between", alignItems:"center",
          width:"100%", background:"none", border:"none", cursor:"pointer",
          padding:"0 0 0.6rem 0",
          fontFamily:"var(--font-jost)", fontWeight:600,
          fontSize:"0.62rem", letterSpacing:"0.2em", textTransform:"uppercase",
          color:"var(--muted)",
        }}
      >
        {title}
        <span style={{ fontSize:"0.7rem", opacity:0.5, transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FilterPanel({
  filters, setFilters,
}: { filters: Filters; setFilters: (f: Filters) => void }) {

  const update = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters({ ...filters, [key]: val });
  }, [filters, setFilters]);

  return (
    <div>
      {/* Garment type */}
      <FilterSection title="Garment type">
        {GARMENT_TYPES.map(g => (
          <CheckRow key={g} label={g}
            checked={filters.garments.includes(g)}
            onChange={() => update("garments", toggle(filters.garments, g))}
          />
        ))}
      </FilterSection>

      {/* Listing type */}
      <FilterSection title="Listing type">
        {(["all","sale","rent","both"] as const).map(t => (
          <CheckRow key={t}
            label={t === "all" ? "All" : t === "sale" ? "For Sale" : t === "rent" ? "For Rent" : "Sale + Rent"}
            checked={filters.listingType === t}
            onChange={() => update("listingType", t)}
          />
        ))}
      </FilterSection>

      {/* Occasion */}
      <FilterSection title="Occasion" defaultOpen={false}>
        {OCCASIONS.map(o => (
          <CheckRow key={o} label={o}
            checked={filters.occasions.includes(o)}
            onChange={() => update("occasions", toggle(filters.occasions, o))}
          />
        ))}
      </FilterSection>

      {/* US Size */}
      <FilterSection title="US Size">
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", paddingTop:"0.25rem" }}>
          {US_SIZES.map(s => (
            <button
              key={s}
              onClick={() => update("sizes", toggle(filters.sizes, s))}
              style={{
                minWidth:"38px", height:"36px", padding:"0 0.4rem",
                border:`1px solid ${filters.sizes.includes(s) ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
                background: filters.sizes.includes(s) ? "rgba(201,92,26,0.08)" : "transparent",
                color: filters.sizes.includes(s) ? "var(--burnt-orange)" : "var(--muted)",
                fontFamily:"var(--font-jost)", fontWeight: filters.sizes.includes(s) ? 600 : 400,
                fontSize:"0.75rem", cursor:"pointer", transition:"all 0.15s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price">
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", paddingTop:"0.25rem" }}>
          <input
            type="number" placeholder="Min"
            value={filters.priceMin}
            onChange={e => update("priceMin", e.target.value)}
            style={{
              flex:1, padding:"0.5rem 0.65rem",
              border:"1px solid var(--warm-tan)", background:"#fff",
              fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#1A1A18",
              outline:"none", minWidth:0,
            }}
          />
          <span style={{ fontFamily:"var(--font-jost)", fontSize:"0.75rem", color:"var(--muted)", opacity:0.5 }}>—</span>
          <input
            type="number" placeholder="Max"
            value={filters.priceMax}
            onChange={e => update("priceMax", e.target.value)}
            style={{
              flex:1, padding:"0.5rem 0.65rem",
              border:"1px solid var(--warm-tan)", background:"#fff",
              fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#1A1A18",
              outline:"none", minWidth:0,
            }}
          />
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condition" defaultOpen={false}>
        {CONDITIONS.map(c => (
          <CheckRow key={c.value} label={c.label}
            checked={filters.conditions.includes(c.value)}
            onChange={() => update("conditions", toggle(filters.conditions, c.value))}
          />
        ))}
      </FilterSection>

      {/* Fabric */}
      <FilterSection title="Fabric" defaultOpen={false}>
        {FABRICS.map(f => (
          <CheckRow key={f} label={f}
            checked={filters.fabrics.includes(f)}
            onChange={() => update("fabrics", toggle(filters.fabrics, f))}
          />
        ))}
      </FilterSection>

      {/* Embellishments */}
      <FilterSection title="Embellishments" defaultOpen={false}>
        {EMBELLISHMENTS.map(e => (
          <CheckRow key={e} label={e}
            checked={filters.embellishments.includes(e)}
            onChange={() => update("embellishments", toggle(filters.embellishments, e))}
          />
        ))}
      </FilterSection>

      {/* Designer */}
      <FilterSection title="Designer / Brand" defaultOpen={false}>
        <input
          type="text" placeholder="e.g. Sabyasachi"
          value={filters.designer}
          onChange={e => update("designer", e.target.value)}
          style={{
            width:"100%", padding:"0.55rem 0.75rem",
            border:"1px solid var(--warm-tan)", background:"#fff",
            fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#1A1A18",
            outline:"none", boxSizing:"border-box",
          }}
        />
      </FilterSection>
    </div>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const cond = CONDITION_COLOR[listing.condition];
  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration:"none" }}>
      <div
        style={{
          background:"#fff", border:"1px solid var(--warm-tan)",
          overflow:"hidden", transition:"box-shadow 0.2s",
        }}
        onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
        onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}
      >
        {/* Photo */}
        <div style={{ aspectRatio:"3/4", background:listing.bg, position:"relative" }}>
          {/* Listing type pill top-left */}
          <span style={{
            position:"absolute", top:"0.6rem", left:"0.6rem",
            fontFamily:"var(--font-jost)", fontWeight:600,
            fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase",
            padding:"0.2rem 0.5rem",
            background: listing.type === "rent"
              ? "#E3F2FD"
              : listing.type === "both"
                ? "rgba(201,92,26,0.9)"
                : "rgba(26,26,24,0.75)",
            color: listing.type === "both" ? "var(--cream)" : listing.type === "rent" ? "#1D4E89" : "var(--cream)",
          }}>
            {listing.type === "both" ? "Sale + Rent" : listing.type === "rent" ? "Rent only" : "For Sale"}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding:"0.8rem 0.85rem 0.9rem" }}>
          {/* Condition badge */}
          <span style={{
            display:"inline-block", marginBottom:"0.4rem",
            padding:"0.15rem 0.45rem",
            background:cond.bg, color:cond.text,
            fontFamily:"var(--font-jost)", fontWeight:600,
            fontSize:"0.52rem", letterSpacing:"0.14em", textTransform:"uppercase",
          }}>
            {CONDITION_LABEL[listing.condition]}
          </span>

          <p style={{
            fontFamily:"var(--font-jost)", fontWeight:500,
            fontSize:"0.82rem", color:"#1A1A18",
            lineHeight:1.35, marginBottom:"0.35rem",
            display:"-webkit-box", WebkitLineClamp:2,
            WebkitBoxOrient:"vertical", overflow:"hidden",
          }}>
            {listing.title}
          </p>

          {/* Price row */}
          <div style={{ display:"flex", alignItems:"baseline", gap:"0.35rem", flexWrap:"wrap", marginBottom:"0.4rem" }}>
            {(listing.type === "sale" || listing.type === "both") && (
              <span style={{
                fontFamily:"var(--font-cormorant)", fontStyle:"italic",
                fontSize:"1.05rem", color:"#C4440A",
              }}>
                ${listing.price.toLocaleString()}
              </span>
            )}
            {listing.rent_price && (listing.type === "rent" || listing.type === "both") && (
              <span style={{
                fontFamily:"var(--font-jost)", fontSize:"0.68rem",
                color:"var(--muted)", opacity:0.7,
              }}>
                {listing.type === "both" ? "· " : ""}${listing.rent_price}/day
              </span>
            )}
          </div>

          {/* Seller + size */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{
              fontFamily:"var(--font-jost)", fontSize:"0.7rem",
              color:"var(--muted)", opacity:0.6,
            }}>
              @{listing.seller}
            </span>
            {listing.size !== "Free" && (
              <span style={{
                fontFamily:"var(--font-jost)", fontSize:"0.68rem", fontWeight:500,
                color:"var(--muted)", opacity:0.7,
                border:"1px solid var(--warm-tan)", padding:"0.1rem 0.4rem",
              }}>
                US {listing.size}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Active filter pill ───────────────────────────────────────────────────────

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:"0.35rem",
      padding:"0.3rem 0.65rem",
      background:"rgba(201,92,26,0.08)",
      border:"1px solid rgba(201,92,26,0.25)",
      fontFamily:"var(--font-jost)", fontWeight:500,
      fontSize:"0.72rem", color:"var(--burnt-orange)",
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background:"none", border:"none", cursor:"pointer",
          color:"var(--burnt-orange)", fontSize:"0.75rem",
          padding:"0", lineHeight:1, opacity:0.7,
          display:"flex", alignItems:"center",
        }}
      >
        ✕
      </button>
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
      <p style={{
        fontFamily:"var(--font-cormorant)", fontStyle:"italic",
        fontSize:"1.5rem", color:"#1A1A18", marginBottom:"0.5rem",
      }}>
        No items found
      </p>
      <p style={{
        fontFamily:"var(--font-jost)", fontSize:"0.82rem",
        color:"var(--muted)", opacity:0.6, marginBottom:"1.5rem",
      }}>
        Try adjusting your filters or search term
      </p>
      <button
        onClick={onClear}
        style={{
          fontFamily:"var(--font-jost)", fontWeight:600,
          fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
          padding:"0.65rem 1.4rem",
          background:"var(--burnt-orange)", color:"var(--cream)",
          border:"none", cursor:"pointer",
        }}
      >
        Clear all filters
      </button>

      <div style={{ marginTop:"3rem" }}>
        <p style={{
          fontFamily:"var(--font-jost)", fontWeight:600,
          fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase",
          color:"var(--muted)", opacity:0.5, marginBottom:"1rem",
        }}>
          Browse by category
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", justifyContent:"center" }}>
          {GARMENT_TYPES.map(g => (
            <button
              key={g}
              onClick={onClear}
              style={{
                fontFamily:"var(--font-jost)", fontWeight:500,
                fontSize:"0.75rem", letterSpacing:"0.06em",
                padding:"0.5rem 1rem",
                background:"transparent", color:"var(--muted)",
                border:"1px solid var(--warm-tan)", cursor:"pointer",
                transition:"border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

export default function ListingsPage() {
  const [query,       setQuery]       = useState("");
  const [filters,     setFilters]     = useState<Filters>(DEFAULT_FILTERS);
  const [sort,        setSort]        = useState<SortOption>("newest");
  const [page,        setPage]        = useState(1);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  // Reset to page 1 whenever filters/query/sort change
  useEffect(() => { setPage(1); }, [query, filters, sort]);

  const clearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  }, []);

  // ── Derived: filtered + sorted results ──────────────────────────────────────
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = ALL_LISTINGS.filter(l => {
      // Search
      if (q) {
        const searchable = [
          l.title, l.garment, l.designer, l.fabric,
          ...l.occasion, ...l.embellishments, l.seller,
        ].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      // Garment type
      if (filters.garments.length && !filters.garments.includes(l.garment)) return false;
      // Listing type
      if (filters.listingType !== "all" && l.type !== filters.listingType) return false;
      // Occasion
      if (filters.occasions.length && !filters.occasions.some(o => l.occasion.includes(o))) return false;
      // Size
      if (filters.sizes.length && !filters.sizes.includes(l.size)) return false;
      // Price
      const effectivePrice = l.type === "rent" ? (l.rent_price ?? 0) : l.price;
      if (filters.priceMin && effectivePrice < Number(filters.priceMin)) return false;
      if (filters.priceMax && effectivePrice > Number(filters.priceMax)) return false;
      // Condition
      if (filters.conditions.length && !filters.conditions.includes(l.condition)) return false;
      // Fabric
      if (filters.fabrics.length && !filters.fabrics.includes(l.fabric)) return false;
      // Embellishments
      if (filters.embellishments.length && !filters.embellishments.some(e => l.embellishments.includes(e))) return false;
      // Designer
      if (filters.designer.trim() && !l.designer.toLowerCase().includes(filters.designer.toLowerCase())) return false;
      return true;
    });

    // Sort
    list = [...list].sort((a, b) => {
      if (sort === "price_asc")  return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "popular")    return b.views - a.views;
      // newest
      return a.created_at < b.created_at ? 1 : -1;
    });

    return list;
  }, [query, filters, sort]);

  const _totalPages = Math.ceil(results.length / PAGE_SIZE); void _totalPages;
  const paged = results.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < results.length;

  // ── Active filter pills ──────────────────────────────────────────────────────
  const activePills: { key: string; label: string; remove: () => void }[] = [];
  if (query) activePills.push({ key:"q", label:`"${query}"`, remove:() => setQuery("") });
  filters.garments.forEach(g => activePills.push({ key:`g-${g}`, label:g, remove:() => setFilters({ ...filters, garments: filters.garments.filter(x => x !== g) }) }));
  if (filters.listingType !== "all") activePills.push({ key:"lt", label: filters.listingType === "sale" ? "For Sale" : filters.listingType === "rent" ? "For Rent" : "Sale + Rent", remove: () => setFilters({ ...filters, listingType:"all" }) });
  filters.occasions.forEach(o => activePills.push({ key:`o-${o}`, label:o, remove:() => setFilters({ ...filters, occasions: filters.occasions.filter(x => x !== o) }) }));
  filters.sizes.forEach(s => activePills.push({ key:`s-${s}`, label:`Size ${s}`, remove:() => setFilters({ ...filters, sizes: filters.sizes.filter(x => x !== s) }) }));
  if (filters.priceMin || filters.priceMax) activePills.push({ key:"price", label: filters.priceMin && filters.priceMax ? `$${filters.priceMin}–$${filters.priceMax}` : filters.priceMin ? `From $${filters.priceMin}` : `Under $${filters.priceMax}`, remove:() => setFilters({ ...filters, priceMin:"", priceMax:"" }) });
  filters.conditions.forEach(c => activePills.push({ key:`c-${c}`, label: CONDITION_LABEL[c as Condition], remove:() => setFilters({ ...filters, conditions: filters.conditions.filter(x => x !== c) }) }));
  filters.fabrics.forEach(f => activePills.push({ key:`f-${f}`, label:f, remove:() => setFilters({ ...filters, fabrics: filters.fabrics.filter(x => x !== f) }) }));
  filters.embellishments.forEach(e => activePills.push({ key:`e-${e}`, label:e, remove:() => setFilters({ ...filters, embellishments: filters.embellishments.filter(x => x !== e) }) }));
  if (filters.designer) activePills.push({ key:"des", label:filters.designer, remove:() => setFilters({ ...filters, designer:"" }) });

  const hasActiveFilters = activePills.length > 0;

  return (
    <div style={{ background:"var(--cream)", minHeight:"100vh" }}>
      <div className="max-w-7xl mx-auto" style={{ padding:"0 1.25rem" }}>

        {/* ── Page header ── */}
        <div style={{ paddingTop:"2.5rem", paddingBottom:"1.75rem" }}>
          <h1 style={{
            fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400,
            fontSize:"clamp(2rem, 4vw, 2.8rem)", color:"#1A1A18",
            marginBottom:"0.25rem",
          }}>
            Browse listings
          </h1>
          <p style={{
            fontFamily:"var(--font-jost)", fontSize:"0.78rem",
            color:"var(--muted)", opacity:0.6,
          }}>
            South Asian fashion — buy, sell, and rent
          </p>
        </div>

        {/* ── Search bar ── */}
        <div style={{
          position:"relative", marginBottom:"1.25rem",
        }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="var(--muted)" strokeWidth="1.5"
            style={{
              position:"absolute", left:"1rem", top:"50%",
              transform:"translateY(-50%)", opacity:0.45, pointerEvents:"none",
            }}
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by garment, designer, fabric, occasion…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width:"100%", padding:"0.9rem 3rem 0.9rem 2.75rem",
              border:"1px solid var(--warm-tan)", background:"#fff",
              fontFamily:"var(--font-jost)", fontSize:"0.88rem", color:"#1A1A18",
              outline:"none", boxSizing:"border-box",
              transition:"border-color 0.15s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--burnt-orange)")}
            onBlur={e => (e.target.style.borderColor = "var(--warm-tan)")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                position:"absolute", right:"1rem", top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer",
                color:"var(--muted)", opacity:0.5, fontSize:"0.9rem",
                display:"flex", alignItems:"center",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Active filter pills ── */}
        {hasActiveFilters && (
          <div style={{
            display:"flex", flexWrap:"wrap", gap:"0.4rem",
            marginBottom:"1.25rem", alignItems:"center",
          }}>
            {activePills.map(p => (
              <FilterPill key={p.key} label={p.label} onRemove={p.remove} />
            ))}
            <button
              onClick={clearAll}
              style={{
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.65rem", letterSpacing:"0.16em", textTransform:"uppercase",
                padding:"0.3rem 0.7rem",
                background:"transparent", color:"var(--muted)", opacity:0.6,
                border:"1px solid var(--warm-tan)", cursor:"pointer",
                transition:"opacity 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "1")}
              onMouseOut={e => (e.currentTarget.style.opacity = "0.6")}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Layout: sidebar + grid ── */}
        <div className="listings-layout" style={{ display:"flex", gap:"2.5rem", alignItems:"flex-start" }}>

          {/* ── Sidebar — desktop ── */}
          <aside
            className="listings-sidebar"
            style={{
              width:"220px", flexShrink:0,
              position:"sticky", top:"1.5rem",
            }}
          >
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                style={{
                  width:"100%", marginBottom:"1.25rem",
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase",
                  padding:"0.6rem 1rem",
                  background:"transparent", color:"var(--burnt-orange)",
                  border:"1px solid var(--burnt-orange)", cursor:"pointer",
                  transition:"opacity 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.7")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Clear filters
              </button>
            )}
            <FilterPanel filters={filters} setFilters={setFilters} />
          </aside>

          {/* ── Main column ── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Toolbar: results count + sort */}
            <div style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem",
            }}>
              <p style={{
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase",
                color:"var(--muted)", opacity:0.6,
              }}>
                {results.length} item{results.length !== 1 ? "s" : ""} found
              </p>

              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                {/* Mobile filter button */}
                <button
                  className="filter-btn-mobile"
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    display:"none", // shown via CSS below
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.62rem", letterSpacing:"0.16em", textTransform:"uppercase",
                    padding:"0.5rem 0.9rem", alignItems:"center", gap:"0.4rem",
                    background: hasActiveFilters ? "var(--burnt-orange)" : "transparent",
                    color: hasActiveFilters ? "var(--cream)" : "var(--muted)",
                    border:`1px solid ${hasActiveFilters ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
                    cursor:"pointer",
                  }}
                >
                  Filters {hasActiveFilters ? `(${activePills.length})` : ""}
                </button>

                <select
                  value={sort}
                  onChange={e => setSort(e.target.value as SortOption)}
                  style={{
                    padding:"0.5rem 0.75rem",
                    border:"1px solid var(--warm-tan)", background:"#fff",
                    fontFamily:"var(--font-jost)", fontSize:"0.75rem", color:"var(--muted)",
                    outline:"none", cursor:"pointer",
                  }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            {results.length === 0 ? (
              <EmptyState onClear={clearAll} />
            ) : (
              <>
                <div
                  className="results-grid"
                  style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.1rem" }}
                >
                  {paged.map(l => <ListingCard key={l.id} listing={l} />)}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div style={{ textAlign:"center", marginTop:"2.5rem", marginBottom:"1rem" }}>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        fontFamily:"var(--font-jost)", fontWeight:600,
                        fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
                        padding:"0.75rem 2rem",
                        background:"transparent", color:"var(--muted)",
                        border:"1px solid var(--warm-tan)", cursor:"pointer",
                        transition:"border-color 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = "var(--muted)")}
                      onMouseOut={e => (e.currentTarget.style.borderColor = "var(--warm-tan)")}
                    >
                      Load more — {results.length - paged.length} remaining
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position:"fixed", inset:0,
              background:"rgba(0,0,0,0.4)", zIndex:60,
            }}
          />
          <div
            ref={drawerRef}
            style={{
              position:"fixed", top:0, left:0, bottom:0,
              width:"min(320px, 88vw)",
              background:"var(--cream)", zIndex:70,
              overflowY:"auto", padding:"1.5rem 1.25rem",
              boxShadow:"4px 0 24px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{
              display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:"1.5rem",
            }}>
              <p style={{
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase",
                color:"var(--muted)",
              }}>
                Filters
              </p>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background:"none", border:"none", cursor:"pointer",
                  fontSize:"1.1rem", color:"var(--muted)", opacity:0.6,
                  display:"flex", alignItems:"center",
                }}
              >
                ✕
              </button>
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                width:"100%", marginTop:"1rem", padding:"0.8rem",
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.68rem", letterSpacing:"0.18em", textTransform:"uppercase",
                background:"var(--burnt-orange)", color:"var(--cream)",
                border:"none", cursor:"pointer",
              }}
            >
              Show {results.length} result{results.length !== 1 ? "s" : ""}
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilters(DEFAULT_FILTERS); setQuery(""); }}
                style={{
                  width:"100%", marginTop:"0.5rem", padding:"0.7rem",
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.65rem", letterSpacing:"0.16em", textTransform:"uppercase",
                  background:"transparent", color:"var(--muted)",
                  border:"1px solid var(--warm-tan)", cursor:"pointer",
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .listings-layout { flex-direction: column !important; }
          .listings-sidebar { display: none !important; }
          .filter-btn-mobile { display: inline-flex !important; }
          .results-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}
