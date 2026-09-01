"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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

type ListingStatus = "draft" | "pending" | "active" | "rejected" | "removed" | "featured" | "sold" | "archived";

interface AdminListing {
  id: string; title: string; seller: string; price: number;
  type: string; garment: string; status: ListingStatus;
  submitted: string; images: string[]; flagged: boolean;
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  draft:    { bg: "#FEF3C7", text: "#92400E" },
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  active:   { bg: "#D1FAE5", text: "#065F46" },
  featured: { bg: "rgba(196,68,10,0.1)", text: "#C4440A" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
  removed:  { bg: "#F3F4F6", text: "#6B7280" },
  sold:     { bg: "#F3F4F6", text: "#6B7280" },
  archived: { bg: "#F3F4F6", text: "#6B7280" },
};

type FilterTab = "all" | "pending" | "active" | "featured" | "flagged";

type ConfirmAction = { id: string; action: "reject" | "remove" };

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<FilterTab>("all");
  const [search,   setSearch]   = useState("");
  const [confirm,  setConfirm]  = useState<ConfirmAction | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("listings")
      .select("id, title, price, type, category, status, created_at, images, seller_id, flagged")
      .order("created_at", { ascending: false })
      .then(async ({ data: rows }) => {
        if (!rows?.length) { setLoading(false); return; }
        const sellerIds = Array.from(new Set(rows.map(r => r.seller_id).filter(Boolean)));
        const { data: profiles } = sellerIds.length
          ? await supabase.from("seller_profiles").select("id, username").in("id", sellerIds)
          : { data: [] };
        setListings(rows.map(r => ({
          id:        r.id,
          title:     r.title,
          seller:    profiles?.find(p => p.id === r.seller_id)?.username ?? "unknown",
          price:     r.price,
          type:      r.type ?? "sale",
          garment:   r.category ?? "—",
          status:    (r.status as ListingStatus) ?? "pending",
          submitted: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          images:    r.images ?? [],
          flagged:   r.flagged ?? false,
        })));
        setLoading(false);
      });
  }, []);

  const confirmTarget = confirm ? listings.find(l => l.id === confirm.id) : null;

  const updateStatus = async (id: string, status: ListingStatus) => {
    setActionErr(null);
    const supabase = createClient();
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) { setActionErr("Failed to update status — " + error.message); return; }
    setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const executeConfirm = async () => {
    if (!confirm) return;
    await updateStatus(confirm.id, confirm.action === "reject" ? "rejected" : "removed");
    setConfirm(null);
  };

  const toggleFlag = async (id: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    const newFlagged = !listing.flagged;
    const supabase = createClient();
    const { error } = await supabase.from("listings").update({ flagged: newFlagged }).eq("id", id);
    if (error) { setActionErr("Failed to update flag — " + error.message); return; }
    setListings(prev => prev.map(l => l.id === id ? { ...l, flagged: newFlagged } : l));
  };

  const TABS: { id: FilterTab; label: string }[] = [
    { id:"all",      label:`All (${listings.length})` },
    { id:"pending",  label:`Pending (${listings.filter(l => l.status === "draft" || l.status === "pending").length})` },
    { id:"active",   label:`Active (${listings.filter(l => l.status === "active").length})` },
    { id:"featured", label:`Featured (${listings.filter(l => l.status === "featured").length})` },
    { id:"flagged",  label:`Flagged (${listings.filter(l => l.flagged).length})` },
  ];

  const filtered = listings.filter(l => {
    if (tab === "pending"  && l.status !== "pending" && l.status !== "draft") return false;
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

      {actionErr && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "0.65rem 1rem", marginBottom: "1rem", fontFamily: "var(--font-jost)", fontSize: "0.78rem" }}>
          {actionErr}
        </div>
      )}

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
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", ...muted, fontSize: "0.82rem" }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 90px 80px 220px",
              padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl }}>
              <span /><span>Listing</span><span>Price</span>
              <span>Type</span><span>Status</span><span>Flag</span><span>Actions</span>
            </div>

            {filtered.map((l, i) => {
              const sc = STATUS_COLOR[l.status] ?? { bg: "#F3F4F6", text: "#6B7280" };
              const thumb = l.images?.[0];
              return (
                <div key={l.id} style={{
                  display: "grid", gridTemplateColumns: "44px 1fr 80px 80px 90px 80px 220px",
                  padding: "0.8rem 1rem", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${A.border}` : "none",
                  background: l.flagged ? "#FFF5F5" : i % 2 === 0 ? A.card : A.bg,
                }}>
                  <div style={{ width: "36px", height: "36px", background: "#EDE6DE", borderRadius: "2px", flexShrink: 0, overflow: "hidden" }}>
                    {thumb && <img src={thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div>
                    <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>{l.title}</p>
                    <p style={{ ...muted, fontSize: "0.65rem" }}>@{l.seller} · {l.submitted}</p>
                  </div>
                  <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark, fontWeight: 500 }}>
                    ${(l.price / 100).toLocaleString()}
                  </span>
                  <p style={{ ...muted, fontSize: "0.72rem" }}>{l.type}</p>
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
                    {(l.status === "pending" || l.status === "draft") && (
                      <>
                        <button onClick={() => updateStatus(l.id, "active")} style={actionBtn("green")}>Approve</button>
                        <button onClick={() => setConfirm({ id: l.id, action: "reject" })} style={actionBtn("red")}>Reject</button>
                      </>
                    )}
                    {l.status === "active" && (
                      <>
                        <button
                          onClick={() => !l.flagged && updateStatus(l.id, "featured")}
                          style={actionBtn(l.flagged ? "disabled" : "orange")}
                          title={l.flagged ? "Clear the flag before featuring this listing" : undefined}
                        >
                          Feature
                        </button>
                        <button onClick={() => setConfirm({ id: l.id, action: "remove" })} style={actionBtn("red")}>Remove</button>
                      </>
                    )}
                    {l.status === "featured" && (
                      <button onClick={() => updateStatus(l.id, "active")} style={actionBtn("dim")}>Unfeature</button>
                    )}
                    {(l.status === "rejected" || l.status === "removed") && (
                      <button onClick={() => updateStatus(l.id, "active")} style={actionBtn("green")}>Restore</button>
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
          </>
        )}
      </div>
    </div>
  );
}
