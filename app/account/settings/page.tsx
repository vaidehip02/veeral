"use client";

import { useState } from "react";

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: Address[] = [
  { id:"a1", label:"Home",   line1:"247 West 72nd Street", line2:"Apt 4B", city:"New York", state:"NY", zip:"10023", isDefault:true  },
  { id:"a2", label:"Office", line1:"350 Fifth Avenue",                      city:"New York", state:"NY", zip:"10118", isDefault:false },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{
      fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem",
      letterSpacing: "0.25em", textTransform: "uppercase",
      color: "var(--burnt-orange)", marginBottom: "1.25rem",
    }}>
      {title}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        display: "block", fontFamily: "var(--font-jost)", fontWeight: 600,
        fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--muted)", marginBottom: "0.45rem",
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%", padding: "0.65rem 0.85rem",
        border: "1px solid var(--warm-tan)",
        background: disabled ? "rgba(0,0,0,0.03)" : "#fff",
        fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#1A1A18",
        outline: "none", boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = "var(--burnt-orange)"; }}
      onBlur={e => (e.target.style.borderColor = "var(--warm-tan)")}
    />
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-jost)", fontWeight: 600,
        fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase",
        padding: "0.65rem 1.4rem",
        background: saved ? "#2D6A4F" : "var(--burnt-orange)", color: "var(--cream)",
        border: "none", cursor: "pointer", transition: "all 0.2s",
      }}
    >
      {saved ? "✓ Saved" : "Save changes"}
    </button>
  );
}

export default function SettingsPage() {
  // Profile
  const [name,  setName]  = useState("Ananya Mehta");
  const [email, setEmail] = useState("ananya.m@gmail.com");
  const [profileSaved, setProfileSaved] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<Omit<Address, "id" | "isDefault">>({ label:"", line1:"", line2:"", city:"", state:"", zip:"" });

  // Notifications
  const [notifs, setNotifs] = useState({ orders:true, rentals:true, messages:true, promotions:false });
  const [notifSaved, setNotifSaved] = useState(false);

  // Password
  const [pw, setPw] = useState({ current:"", next:"", confirm:"" });
  const [pwSaved, setPwSaved] = useState(false);

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput,   setDeleteInput]   = useState("");

  const handleSaveProfile = () => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500); };
  const handleSaveNotifs  = () => { setNotifSaved(true);   setTimeout(() => setNotifSaved(false), 2500); };
  const handleSavePw      = () => { setPwSaved(true);      setTimeout(() => setPwSaved(false), 2500); setPw({ current:"", next:"", confirm:"" }); };

  const setDefault = (id: string) => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  const removeAddr = (id: string) => setAddresses(prev => prev.filter(a => a.id !== id));

  const addAddress = () => {
    if (!newAddr.line1 || !newAddr.city) return;
    setAddresses(prev => [...prev, { ...newAddr, id:`a${Date.now()}`, isDefault:false }]);
    setAddingAddress(false);
    setNewAddr({ label:"", line1:"", line2:"", city:"", state:"", zip:"" });
  };

  const card: React.CSSProperties = {
    background:"#fff", border:"1px solid var(--warm-tan)",
    padding:"1.75rem", marginBottom:"2rem",
  };

  return (
    <div style={{ maxWidth:"620px" }}>

      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{
          fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400,
          fontSize:"2rem", color:"#1A1A18", marginBottom:"0.25rem",
        }}>
          Settings
        </h1>
        <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.78rem", color:"var(--muted)", opacity:0.65 }}>
          Manage your account preferences
        </p>
      </div>

      {/* ── Profile ── */}
      <div style={card}>
        <SectionHeader title="Personal info" />
        <Field label="Display name">
          <TextInput value={name} onChange={setName} />
        </Field>
        <Field label="Email address">
          <TextInput value={email} onChange={setEmail} type="email" />
        </Field>
        <Field label="Profile photo">
          <div style={{
            display:"flex", alignItems:"center", gap:"1rem",
          }}>
            <div style={{
              width:"52px", height:"52px", borderRadius:"50%",
              background:"var(--warm-tan)", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"var(--font-cormorant)", fontStyle:"italic",
              fontSize:"1.4rem", color:"var(--muted)",
            }}>
              {name[0]}
            </div>
            <button style={{
              fontFamily:"var(--font-jost)", fontWeight:600,
              fontSize:"0.62rem", letterSpacing:"0.16em", textTransform:"uppercase",
              padding:"0.5rem 1rem",
              background:"transparent", color:"var(--muted)",
              border:"1px solid var(--warm-tan)", cursor:"pointer",
            }}>
              Upload photo
            </button>
          </div>
        </Field>
        <SaveButton onClick={handleSaveProfile} saved={profileSaved} />
      </div>

      {/* ── Addresses ── */}
      <div style={card}>
        <SectionHeader title="Shipping addresses" />
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.25rem" }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{
              padding:"1rem", border:`1px solid ${addr.isDefault ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
              display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.75rem",
            }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.3rem" }}>
                  {addr.label && (
                    <span style={{
                      fontFamily:"var(--font-jost)", fontWeight:600,
                      fontSize:"0.62rem", letterSpacing:"0.14em", textTransform:"uppercase",
                      color: addr.isDefault ? "var(--burnt-orange)" : "var(--muted)",
                    }}>
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span style={{
                      fontFamily:"var(--font-jost)", fontWeight:600,
                      fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase",
                      padding:"0.12rem 0.4rem",
                      background:"rgba(201,92,26,0.1)", color:"var(--burnt-orange)",
                    }}>
                      Default
                    </span>
                  )}
                </div>
                <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.8rem", color:"#1A1A18", lineHeight:1.5 }}>
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                  {addr.city}, {addr.state} {addr.zip}
                </p>
              </div>
              <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr.id)}
                    style={{
                      fontFamily:"var(--font-jost)", fontWeight:600,
                      fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase",
                      padding:"0.3rem 0.6rem",
                      background:"transparent", color:"var(--muted)",
                      border:"1px solid var(--warm-tan)", cursor:"pointer",
                    }}
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => removeAddr(addr.id)}
                  style={{
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.58rem", letterSpacing:"0.12em", textTransform:"uppercase",
                    padding:"0.3rem 0.6rem",
                    background:"transparent", color:"#C62828",
                    border:"1px solid #FADADD", cursor:"pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {addingAddress ? (
          <div style={{ border:"1px solid var(--warm-tan)", padding:"1.25rem", marginBottom:"0.75rem" }}>
            <div className="grid grid-cols-2 gap-3" style={{ marginBottom:"0.75rem" }}>
              <Field label="Label (e.g. Home)">
                <TextInput value={newAddr.label} onChange={v => setNewAddr(p => ({ ...p, label:v }))} placeholder="Home" />
              </Field>
              <div />
              <div style={{ gridColumn:"1 / -1" }}>
                <Field label="Street address">
                  <TextInput value={newAddr.line1} onChange={v => setNewAddr(p => ({ ...p, line1:v }))} placeholder="123 Main St" />
                </Field>
              </div>
              <div style={{ gridColumn:"1 / -1" }}>
                <Field label="Apt / Suite (optional)">
                  <TextInput value={newAddr.line2 ?? ""} onChange={v => setNewAddr(p => ({ ...p, line2:v }))} placeholder="Apt 2A" />
                </Field>
              </div>
              <Field label="City">
                <TextInput value={newAddr.city} onChange={v => setNewAddr(p => ({ ...p, city:v }))} placeholder="New York" />
              </Field>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <div style={{ flex:1 }}>
                  <Field label="State">
                    <TextInput value={newAddr.state} onChange={v => setNewAddr(p => ({ ...p, state:v }))} placeholder="NY" />
                  </Field>
                </div>
                <div style={{ flex:1 }}>
                  <Field label="ZIP">
                    <TextInput value={newAddr.zip} onChange={v => setNewAddr(p => ({ ...p, zip:v }))} placeholder="10001" />
                  </Field>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"0.6rem" }}>
              <button
                onClick={addAddress}
                style={{
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.62rem", letterSpacing:"0.16em", textTransform:"uppercase",
                  padding:"0.6rem 1.2rem",
                  background:"var(--burnt-orange)", color:"var(--cream)",
                  border:"none", cursor:"pointer",
                }}
              >
                Add address
              </button>
              <button
                onClick={() => setAddingAddress(false)}
                style={{
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.62rem", letterSpacing:"0.16em", textTransform:"uppercase",
                  padding:"0.6rem 1rem",
                  background:"transparent", color:"var(--muted)",
                  border:"1px solid var(--warm-tan)", cursor:"pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingAddress(true)}
            style={{
              fontFamily:"var(--font-jost)", fontWeight:600,
              fontSize:"0.62rem", letterSpacing:"0.18em", textTransform:"uppercase",
              padding:"0.6rem 1.2rem",
              background:"transparent", color:"var(--muted)",
              border:"1px solid var(--warm-tan)", cursor:"pointer",
            }}
          >
            + Add address
          </button>
        )}
      </div>

      {/* ── Payment methods ── */}
      <div style={card}>
        <SectionHeader title="Payment methods" />
        <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", marginBottom:"1.25rem" }}>
          {[
            { brand:"Visa",       last4:"4242", expires:"09/28", default:true  },
            { brand:"Mastercard", last4:"5555", expires:"03/27", default:false },
          ].map(card => (
            <div key={card.last4} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"0.85rem 1rem",
              border:`1px solid ${card.default ? "var(--burnt-orange)" : "var(--warm-tan)"}`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                <div style={{
                  width:"38px", height:"24px", borderRadius:"3px",
                  background:"var(--warm-tan)", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  fontFamily:"var(--font-jost)", fontWeight:700,
                  fontSize:"0.55rem", color:"var(--muted)",
                }}>
                  {card.brand.toUpperCase().slice(0,2)}
                </div>
                <div>
                  <p style={{ fontFamily:"var(--font-jost)", fontWeight:500, fontSize:"0.82rem", color:"#1A1A18" }}>
                    {card.brand} ···· {card.last4}
                  </p>
                  <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.68rem", color:"var(--muted)", opacity:0.55 }}>
                    Expires {card.expires}
                  </p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                {card.default && (
                  <span style={{
                    fontFamily:"var(--font-jost)", fontWeight:600,
                    fontSize:"0.55rem", letterSpacing:"0.12em", textTransform:"uppercase",
                    padding:"0.12rem 0.4rem",
                    background:"rgba(201,92,26,0.1)", color:"var(--burnt-orange)",
                  }}>
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.75rem", color:"var(--muted)", opacity:0.6 }}>
          Payment methods are managed securely via Stripe.{" "}
          <a href="#" style={{ color:"var(--burnt-orange)", textDecoration:"underline", textUnderlineOffset:"2px" }}>
            Manage in Stripe ↗
          </a>
        </p>
      </div>

      {/* ── Notifications ── */}
      <div style={card}>
        <SectionHeader title="Email notifications" />
        <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem", marginBottom:"1.25rem" }}>
          {(Object.entries(notifs) as [keyof typeof notifs, boolean][]).map(([key, val]) => {
            const labels: Record<string, string> = {
              orders:"Order updates (shipped, delivered, etc.)",
              rentals:"Rental reminders and return alerts",
              messages:"New messages from sellers",
              promotions:"Promotions and new arrivals",
            };
            return (
              <label key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
                <span style={{ fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#1A1A18" }}>
                  {labels[key]}
                </span>
                <div
                  onClick={() => setNotifs(p => ({ ...p, [key]: !val }))}
                  style={{
                    width:"40px", height:"22px", borderRadius:"11px",
                    background: val ? "var(--burnt-orange)" : "var(--warm-tan)",
                    position:"relative", flexShrink:0, cursor:"pointer",
                    transition:"background 0.2s",
                  }}
                >
                  <div style={{
                    position:"absolute", top:"3px",
                    left: val ? "21px" : "3px",
                    width:"16px", height:"16px", borderRadius:"50%",
                    background:"#fff", transition:"left 0.2s",
                    boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
              </label>
            );
          })}
        </div>
        <SaveButton onClick={handleSaveNotifs} saved={notifSaved} />
      </div>

      {/* ── Change password ── */}
      <div style={card}>
        <SectionHeader title="Change password" />
        <Field label="Current password">
          <TextInput value={pw.current} onChange={v => setPw(p => ({ ...p, current:v }))} type="password" placeholder="••••••••" />
        </Field>
        <Field label="New password">
          <TextInput value={pw.next} onChange={v => setPw(p => ({ ...p, next:v }))} type="password" placeholder="••••••••" />
        </Field>
        <Field label="Confirm new password">
          <TextInput value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm:v }))} type="password" placeholder="••••••••" />
        </Field>
        <SaveButton onClick={handleSavePw} saved={pwSaved} />
      </div>

      {/* ── Danger zone ── */}
      <div style={{ ...card, borderColor:"#FADADD" }}>
        <SectionHeader title="Danger zone" />
        <p style={{ fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"var(--muted)", opacity:0.75, marginBottom:"1.25rem", lineHeight:1.65 }}>
          Deleting your account is permanent. All saved items, order history, and messages will be removed and cannot be recovered.
        </p>

        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            style={{
              fontFamily:"var(--font-jost)", fontWeight:600,
              fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
              padding:"0.65rem 1.4rem",
              background:"transparent", color:"#C62828",
              border:"1px solid #FADADD", cursor:"pointer",
              transition:"border-color 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "#C62828")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "#FADADD")}
          >
            Delete my account
          </button>
        ) : (
          <div style={{ border:"1px solid #FADADD", padding:"1.25rem" }}>
            <p style={{
              fontFamily:"var(--font-jost)", fontWeight:600,
              fontSize:"0.78rem", color:"#C62828", marginBottom:"0.75rem",
            }}>
              Type DELETE to confirm
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              style={{
                width:"100%", padding:"0.65rem 0.85rem", marginBottom:"0.75rem",
                border:"1px solid #FADADD", background:"#fff",
                fontFamily:"var(--font-jost)", fontSize:"0.85rem", color:"#C62828",
                outline:"none", boxSizing:"border-box", letterSpacing:"0.1em",
              }}
            />
            <div style={{ display:"flex", gap:"0.6rem" }}>
              <button
                disabled={deleteInput !== "DELETE"}
                style={{
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
                  padding:"0.65rem 1.2rem",
                  background: deleteInput === "DELETE" ? "#C62828" : "var(--warm-tan)",
                  color: deleteInput === "DELETE" ? "#fff" : "var(--muted)",
                  border:"none", cursor: deleteInput === "DELETE" ? "pointer" : "not-allowed",
                }}
              >
                Confirm delete
              </button>
              <button
                onClick={() => { setDeleteConfirm(false); setDeleteInput(""); }}
                style={{
                  fontFamily:"var(--font-jost)", fontWeight:600,
                  fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
                  padding:"0.65rem 1rem",
                  background:"transparent", color:"var(--muted)",
                  border:"1px solid var(--warm-tan)", cursor:"pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
