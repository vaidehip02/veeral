"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";

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

type UserRole   = "buyer" | "seller" | "both";
type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string; username: string; email: string; name: string;
  role: UserRole; status: UserStatus; verified: boolean;
  joined: string; orders: number; listings: number;
}


const ROLE_COLOR: Record<UserRole, { bg: string; text: string }> = {
  buyer:  { bg: "#F3F4F6", text: "#6B7280" },
  seller: { bg: "rgba(196,68,10,0.1)", text: "#C4440A" },
  both:   { bg: "#D1FAE5", text: "#065F46" },
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users,  setUsers]  = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ userId: string; action: "suspend" | "unsuspend" } | null>(null);

  useEffect(() => {
    supabase
      .from("seller_profiles")
      .select("id, username, display_name, stripe_onboarding_complete, is_suspended, created_at")
      .order("created_at", { ascending: false })
      .then(async ({ data: profiles }) => {
        if (!profiles) { setLoading(false); return; }

        const userList: AdminUser[] = await Promise.all(profiles.map(async (p) => {
          const [ordersRes, listingsRes] = await Promise.all([
            supabase.from("orders").select("*", { count: "exact", head: true }).eq("buyer_id", p.id),
            supabase.from("listings").select("*", { count: "exact", head: true }).eq("seller_id", p.id),
          ]);
          return {
            id: p.id,
            username: p.username,
            email: "",
            name: p.display_name,
            role: (listingsRes.count ?? 0) > 0 ? "both" : "buyer" as UserRole,
            status: (p.is_suspended ? "suspended" : "active") as UserStatus,
            verified: p.stripe_onboarding_complete ?? false,
            joined: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            orders: ordersRes.count ?? 0,
            listings: listingsRes.count ?? 0,
          };
        }));

        setUsers(userList);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.username.includes(q) || u.email.includes(q) || u.name.toLowerCase().includes(q);
  });

  const targetUser = confirm ? users.find(u => u.id === confirm.userId) : null;

  const executeSuspend = async () => {
    if (!confirm) return;
    const target = users.find(u => u.id === confirm.userId);
    if (!target) return;
    const newSuspended = target.status === "active";
    const { error } = await supabase
      .from("seller_profiles")
      .update({ is_suspended: newSuspended })
      .eq("id", confirm.userId);
    if (!error) {
      setUsers(prev => prev.map(u =>
        u.id === confirm.userId ? { ...u, status: newSuspended ? "suspended" : "active" } : u
      ));
    }
    setConfirm(null);
  };

  const toggleVerify = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const newVerified = !target.verified;
    const { error } = await supabase
      .from("seller_profiles")
      .update({ stripe_onboarding_complete: newVerified })
      .eq("id", id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: newVerified } : u));
    }
  };

  return (
    <div>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === "suspend" ? "Suspend user?" : "Unsuspend user?"}
        message={
          confirm?.action === "suspend"
            ? `@${targetUser?.username} will be suspended and unable to log in or transact on Veeral.`
            : `@${targetUser?.username} will be reinstated and regain full access to Veeral.`
        }
        confirmLabel={confirm?.action === "suspend" ? "Suspend" : "Unsuspend"}
        variant={confirm?.action === "suspend" ? "danger" : "warning"}
        onConfirm={executeSuspend}
        onCancel={() => setConfirm(null)}
      />

      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Users
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>{loading ? "Loading…" : `${users.length} registered accounts`}</p>
      </div>

      <div style={{ position: "relative", marginBottom: "1.5rem", maxWidth: "380px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A.label} strokeWidth="1.5"
          style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" placeholder="Search username or email…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "0.65rem 1rem 0.65rem 2.5rem", background: A.card, border: `1px solid ${A.border}`,
            fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark, outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = A.accent)}
          onBlur={e => (e.target.style.borderColor = A.border)}
        />
      </div>

      <div style={{ background: A.card, border: `1px solid ${A.border}`, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px 80px 70px 70px 200px",
          padding: "0.6rem 1rem", borderBottom: `1px solid ${A.border}`, ...lbl }}>
          <span>User</span><span>Email</span><span>Role</span>
          <span>Joined</span><span>Orders</span><span>Listings</span><span>Actions</span>
        </div>

        {filtered.map((u, i) => (
          <div key={u.id} style={{
            display: "grid", gridTemplateColumns: "180px 1fr 80px 80px 70px 70px 200px",
            padding: "0.85rem 1rem", alignItems: "center",
            borderBottom: i < filtered.length - 1 ? `1px solid ${A.border}` : "none",
            background: u.status === "suspended" ? "#FFF5F5" : i % 2 === 0 ? A.card : A.bg,
            opacity: u.status === "suspended" ? 0.8 : 1,
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <p style={{ ...dark, fontSize: "0.8rem", fontWeight: 500 }}>@{u.username}</p>
                {u.verified && (
                  <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: A.accent,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.5rem", color: "#fff", flexShrink: 0 }} title="Verified seller">✓</span>
                )}
                {u.status === "suspended" && (
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.52rem",
                    letterSpacing: "0.1em", textTransform: "uppercase", color: "#991B1B" }}>Suspended</span>
                )}
              </div>
              <p style={{ ...muted, fontSize: "0.65rem" }}>{u.name}</p>
            </div>
            <p style={{ ...muted, fontSize: "0.72rem" }}>{u.email}</p>
            <span style={{ display: "inline-block", padding: "0.18rem 0.45rem",
              background: ROLE_COLOR[u.role].bg, color: ROLE_COLOR[u.role].text,
              fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.52rem",
              letterSpacing: "0.1em", textTransform: "uppercase", width: "fit-content" }}>{u.role}</span>
            <p style={{ ...muted, fontSize: "0.72rem" }}>{u.joined}</p>
            <p className="tabular-nums" style={{ ...dark, fontSize: "0.78rem", textAlign: "center" }}>{u.orders}</p>
            <p className="tabular-nums" style={{ ...dark, fontSize: "0.78rem", textAlign: "center" }}>{u.listings}</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {(u.role === "seller" || u.role === "both") && (
                <button onClick={() => toggleVerify(u.id)} style={{
                  fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.55rem",
                  letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3rem 0.6rem", cursor: "pointer",
                  background: u.verified ? "rgba(196,68,10,0.1)" : "#F3F4F6",
                  color: u.verified ? A.accent : A.muted,
                  border: `1px solid ${u.verified ? "rgba(196,68,10,0.25)" : A.border}`, transition: "all 0.15s" }}>
                  {u.verified ? "✓ Verified" : "Verify"}
                </button>
              )}
              <button onClick={() => setConfirm({ userId: u.id, action: u.status === "active" ? "suspend" : "unsuspend" })}
                style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.55rem",
                  letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3rem 0.6rem", cursor: "pointer",
                  background: u.status === "suspended" ? "#D1FAE5" : "#FEE2E2",
                  color: u.status === "suspended" ? "#065F46" : "#991B1B",
                  border: `1px solid ${u.status === "suspended" ? "#A7F3D0" : "#FECACA"}`, transition: "all 0.15s" }}>
                {u.status === "suspended" ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", ...muted, fontSize: "0.82rem" }}>
            No users match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
