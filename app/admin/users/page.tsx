"use client";

import { useState } from "react";

type UserRole   = "buyer" | "seller" | "both";
type UserStatus = "active" | "suspended";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  verified: boolean;
  joined: string;
  orders: number;
  listings: number;
}

const INITIAL_USERS: AdminUser[] = [
  { id:"u1",  username:"priya_sharma",   email:"priya@example.com",    name:"Priya Sharma",    role:"both",   status:"active",    verified:true,  joined:"Mar 2024", orders:12,  listings:12 },
  { id:"u2",  username:"ananya_m",       email:"ananya@example.com",   name:"Ananya Mehta",    role:"both",   status:"active",    verified:false, joined:"Jan 2025", orders:8,   listings:4  },
  { id:"u3",  username:"meera_b",        email:"meera@example.com",    name:"Meera Bhat",      role:"both",   status:"active",    verified:true,  joined:"May 2024", orders:5,   listings:6  },
  { id:"u4",  username:"kavitha_wears",  email:"kavitha@example.com",  name:"Kavitha R.",      role:"seller", status:"active",    verified:false, joined:"Aug 2024", orders:0,   listings:8  },
  { id:"u5",  username:"sana.rents",     email:"sana@example.com",     name:"Sana Khan",       role:"both",   status:"active",    verified:false, joined:"Nov 2024", orders:3,   listings:5  },
  { id:"u6",  username:"raj_styles",     email:"raj@example.com",      name:"Raj Patel",       role:"seller", status:"active",    verified:true,  joined:"Feb 2024", orders:0,   listings:14 },
  { id:"u7",  username:"divya.looks",    email:"divya@example.com",    name:"Divya S.",        role:"both",   status:"active",    verified:false, joined:"Dec 2024", orders:7,   listings:3  },
  { id:"u8",  username:"riya.wears",     email:"riya@example.com",     name:"Riya Joshi",      role:"buyer",  status:"active",    verified:false, joined:"Apr 2025", orders:4,   listings:0  },
  { id:"u9",  username:"new_seller_1",   email:"newseller@example.com",name:"Aarav Singh",     role:"seller", status:"active",    verified:false, joined:"Jun 2026", orders:0,   listings:1  },
  { id:"u10", username:"flagged_user",   email:"flagged@example.com",  name:"Anonymous",       role:"buyer",  status:"suspended", verified:false, joined:"May 2026", orders:1,   listings:0  },
];

const ROLE_COLOR: Record<UserRole, { bg:string; text:string }> = {
  buyer:  { bg:"rgba(255,255,255,0.07)", text:"rgba(250,246,241,0.5)"  },
  seller: { bg:"rgba(201,92,26,0.15)",   text:"var(--burnt-orange)"    },
  both:   { bg:"rgba(45,106,79,0.2)",    text:"#81C995"                },
};

const dark:  React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.9)" };
const muted: React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.4)" };
const lbl:   React.CSSProperties = { fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(250,246,241,0.35)" };

export default function AdminUsersPage() {
  const [users,  setUsers]  = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.username.includes(q) || u.email.includes(q) || u.name.toLowerCase().includes(q);
  });

  const toggleSuspend = (id: string) =>
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, status: u.status === "active" ? "suspended" : "active" }
      : u
    ));

  const toggleVerify = (id: string) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: !u.verified } : u));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
          Users
        </h1>
        <p style={{ ...muted, fontSize:"0.78rem" }}>{users.length} registered accounts</p>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:"1.5rem", maxWidth:"380px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(250,246,241,0.3)" strokeWidth="1.5"
          style={{ position:"absolute", left:"0.85rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text" placeholder="Search username or email…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width:"100%", padding:"0.65rem 1rem 0.65rem 2.5rem",
            background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
            fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#FAF6F1",
            outline:"none", boxSizing:"border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--burnt-orange)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* Table */}
      <div style={{ border:"1px solid rgba(255,255,255,0.08)", overflowX:"auto" }}>
        {/* Header */}
        <div style={{
          display:"grid", gridTemplateColumns:"180px 1fr 80px 80px 70px 70px 200px",
          padding:"0.6rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)", ...lbl,
        }}>
          <span>User</span><span>Email</span><span>Role</span>
          <span>Joined</span><span>Orders</span><span>Listings</span><span>Actions</span>
        </div>

        {filtered.map((u, i) => (
          <div
            key={u.id}
            style={{
              display:"grid", gridTemplateColumns:"180px 1fr 80px 80px 70px 70px 200px",
              padding:"0.85rem 1rem", alignItems:"center",
              borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              background: u.status === "suspended"
                ? "rgba(198,40,40,0.07)"
                : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              opacity: u.status === "suspended" ? 0.75 : 1,
            }}
          >
            {/* User */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <p style={{ ...dark, fontSize:"0.8rem", fontWeight:500 }}>@{u.username}</p>
                {u.verified && (
                  <span style={{
                    width:"14px", height:"14px", borderRadius:"50%",
                    background:"var(--burnt-orange)", display:"inline-flex",
                    alignItems:"center", justifyContent:"center",
                    fontSize:"0.5rem", color:"var(--cream)", flexShrink:0,
                  }} title="Verified seller">✓</span>
                )}
                {u.status === "suspended" && (
                  <span style={{ fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.52rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"#EF9A9A" }}>
                    Suspended
                  </span>
                )}
              </div>
              <p style={{ ...muted, fontSize:"0.65rem" }}>{u.name}</p>
            </div>

            <p style={{ ...muted, fontSize:"0.72rem" }}>{u.email}</p>

            <span style={{
              display:"inline-block", padding:"0.18rem 0.45rem",
              background:ROLE_COLOR[u.role].bg, color:ROLE_COLOR[u.role].text,
              fontFamily:"var(--font-jost)", fontWeight:600,
              fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
              width:"fit-content",
            }}>
              {u.role}
            </span>

            <p style={{ ...muted, fontSize:"0.72rem" }}>{u.joined}</p>
            <p style={{ ...dark, fontSize:"0.78rem", textAlign:"center" }}>{u.orders}</p>
            <p style={{ ...dark, fontSize:"0.78rem", textAlign:"center" }}>{u.listings}</p>

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
              {(u.role === "seller" || u.role === "both") && (
                <button
                  onClick={() => toggleVerify(u.id)}
                  style={{
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
                    padding:"0.3rem 0.6rem", cursor:"pointer",
                    background: u.verified ? "rgba(201,92,26,0.15)" : "rgba(255,255,255,0.07)",
                    color: u.verified ? "var(--burnt-orange)" : "rgba(250,246,241,0.5)",
                    border:`1px solid ${u.verified ? "rgba(201,92,26,0.3)" : "rgba(255,255,255,0.1)"}`,
                    transition:"all 0.15s",
                  }}
                >
                  {u.verified ? "✓ Verified" : "Verify"}
                </button>
              )}
              <button
                onClick={() => toggleSuspend(u.id)}
                style={{
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.55rem", letterSpacing:"0.1em", textTransform:"uppercase",
                  padding:"0.3rem 0.6rem", cursor:"pointer",
                  background: u.status === "suspended" ? "rgba(45,106,79,0.2)" : "rgba(198,40,40,0.15)",
                  color: u.status === "suspended" ? "#81C995" : "#EF9A9A",
                  border:`1px solid ${u.status === "suspended" ? "rgba(45,106,79,0.3)" : "rgba(198,40,40,0.25)"}`,
                  transition:"all 0.15s",
                }}
              >
                {u.status === "suspended" ? "Unsuspend" : "Suspend"}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding:"3rem", textAlign:"center", ...muted, fontSize:"0.82rem" }}>
            No users match &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
