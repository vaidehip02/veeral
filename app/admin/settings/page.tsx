"use client";

import { useState } from "react";

const dark:  React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.9)" };
const muted: React.CSSProperties = { fontFamily:"var(--font-jost)", color:"rgba(250,246,241,0.4)" };
const lbl:   React.CSSProperties = { fontFamily:"var(--font-jost)", fontWeight:600, fontSize:"0.58rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(250,246,241,0.35)" };

const card: React.CSSProperties = {
  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
  padding:"1.75rem", marginBottom:"1.5rem",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ ...lbl, marginBottom:"1.25rem" }}>{children}</p>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom:"1.1rem" }}>
      <label style={{ display:"block", ...lbl, marginBottom:"0.45rem" }}>{label}</label>
      {children}
      {hint && <p style={{ ...muted, fontSize:"0.68rem", marginTop:"0.35rem" }}>{hint}</p>}
    </div>
  );
}

function DarkInput({ value, onChange, type="text", prefix }: {
  value: string; onChange: (v: string) => void; type?: string; prefix?: string;
}) {
  return (
    <div style={{ position:"relative" }}>
      {prefix && (
        <span style={{
          position:"absolute", left:"0.85rem", top:"50%", transform:"translateY(-50%)",
          ...dark, fontSize:"0.85rem", opacity:0.5,
        }}>{prefix}</span>
      )}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{
          width:"100%", padding:`0.65rem ${prefix ? "0.85rem 0.65rem 2rem" : "0.85rem"}`,
          background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
          fontFamily:"var(--font-jost)", fontSize:"0.85rem", color:"#FAF6F1",
          outline:"none", boxSizing:"border-box",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--burnt-orange)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
      />
    </div>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button onClick={onClick} style={{
      fontFamily:"var(--font-jost)", fontWeight:600,
      fontSize:"0.65rem", letterSpacing:"0.18em", textTransform:"uppercase",
      padding:"0.65rem 1.4rem",
      background: saved ? "rgba(45,106,79,0.4)" : "var(--burnt-orange)",
      color: saved ? "#81C995" : "var(--cream)",
      border:"none", cursor:"pointer", transition:"all 0.2s",
    }}>
      {saved ? "✓ Saved" : "Save changes"}
    </button>
  );
}

export default function AdminSettingsPage() {
  // Commission
  const [commission, setCommission] = useState("10");
  const [commSaved,  setCommSaved]  = useState(false);

  // Deposit options
  const [depositMultiplier, setDepositMultiplier] = useState("5");
  const [depositMin,        setDepositMin]        = useState("50");
  const [depositMax,        setDepositMax]        = useState("2000");
  const [depositSaved,      setDepositSaved]      = useState(false);

  // Announcement banner
  const [bannerText,    setBannerText]    = useState("");
  const [bannerActive,  setBannerActive]  = useState(false);
  const [bannerSaved,   setBannerSaved]   = useState(false);

  // Late fee
  const [lateFeeType,  setLateFeeType]  = useState<"flat" | "multiplier">("multiplier");
  const [lateFeeValue, setLateFeeValue] = useState("1.5");
  const [lateFeeSaved, setLateFeeSaved] = useState(false);

  const save = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  return (
    <div style={{ maxWidth:"620px" }}>

      {/* Header */}
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontFamily:"var(--font-cormorant)", fontStyle:"italic", fontWeight:400, fontSize:"2.2rem", color:"#FAF6F1", marginBottom:"0.25rem" }}>
          Platform Settings
        </h1>
        <p style={{ ...muted, fontSize:"0.78rem" }}>Changes take effect immediately across the platform.</p>
      </div>

      {/* ── Commission ── */}
      <div style={card}>
        <SectionLabel>Commission</SectionLabel>
        <Field
          label="Platform commission %"
          hint="Applied to every completed sale and rental. Sellers receive (100 − commission)% of the listing price."
        >
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ width:"120px" }}>
              <DarkInput value={commission} onChange={setCommission} type="number" prefix="%" />
            </div>
            <p style={{ ...dark, fontSize:"0.82rem" }}>
              = seller nets <span style={{ color:"#81C995", fontWeight:600 }}>{100 - Number(commission)}%</span>
            </p>
          </div>
        </Field>

        {/* Preview */}
        <div style={{
          padding:"1rem", background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.07)", marginBottom:"1.25rem",
        }}>
          <p style={{ ...lbl, marginBottom:"0.75rem" }}>Example on a $1,000 sale</p>
          {[
            { label:"Listing price",  value:"$1,000", color:"rgba(250,246,241,0.7)" },
            { label:"Platform fee",   value:`−$${(1000 * Number(commission) / 100).toFixed(0)}`, color:"#EF9A9A" },
            { label:"Seller receives",value:`$${(1000 * (100 - Number(commission)) / 100).toFixed(0)}`, color:"#81C995" },
          ].map(row => (
            <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
              <span style={{ ...muted, fontSize:"0.78rem" }}>{row.label}</span>
              <span style={{ fontFamily:"var(--font-jost)", fontSize:"0.82rem", fontWeight:600, color:row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        <SaveButton onClick={() => save(setCommSaved)} saved={commSaved} />
      </div>

      {/* ── Deposit ── */}
      <div style={card}>
        <SectionLabel>Rental deposits</SectionLabel>
        <Field
          label="Deposit multiplier (× daily rate)"
          hint="e.g. 5× means a $100/day item requires a $500 deposit."
        >
          <div style={{ width:"120px" }}>
            <DarkInput value={depositMultiplier} onChange={setDepositMultiplier} type="number" prefix="×" />
          </div>
        </Field>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
          <Field label="Minimum deposit ($)">
            <DarkInput value={depositMin} onChange={setDepositMin} type="number" prefix="$" />
          </Field>
          <Field label="Maximum deposit ($)">
            <DarkInput value={depositMax} onChange={setDepositMax} type="number" prefix="$" />
          </Field>
        </div>
        <SaveButton onClick={() => save(setDepositSaved)} saved={depositSaved} />
      </div>

      {/* ── Late fee ── */}
      <div style={card}>
        <SectionLabel>Late return fee</SectionLabel>
        <Field label="Fee type">
          <div style={{ display:"flex", gap:"0.5rem" }}>
            {(["multiplier","flat"] as const).map(t => (
              <button key={t} onClick={() => setLateFeeType(t)} style={{
                fontFamily:"var(--font-jost)", fontWeight:600,
                fontSize:"0.62rem", letterSpacing:"0.12em",
                padding:"0.45rem 0.9rem", cursor:"pointer",
                background: lateFeeType === t ? "rgba(201,92,26,0.2)" : "rgba(255,255,255,0.05)",
                color: lateFeeType === t ? "var(--burnt-orange)" : "rgba(250,246,241,0.4)",
                border:`1px solid ${lateFeeType === t ? "rgba(201,92,26,0.35)" : "rgba(255,255,255,0.1)"}`,
                transition:"all 0.15s",
              }}>
                {t === "multiplier" ? "× Daily rate" : "Flat fee per day"}
              </button>
            ))}
          </div>
        </Field>
        <Field
          label={lateFeeType === "multiplier" ? "Multiplier (× daily rate per day overdue)" : "Flat fee per day overdue ($)"}
          hint={lateFeeType === "multiplier" ? "e.g. 1.5× means $150/day fee on a $100/day rental." : "Fixed dollar amount charged per overdue day."}
        >
          <div style={{ width:"140px" }}>
            <DarkInput
              value={lateFeeValue} onChange={setLateFeeValue} type="number"
              prefix={lateFeeType === "multiplier" ? "×" : "$"}
            />
          </div>
        </Field>
        <SaveButton onClick={() => save(setLateFeeSaved)} saved={lateFeeSaved} />
      </div>

      {/* ── Banner ── */}
      <div style={card}>
        <SectionLabel>Site-wide announcement banner</SectionLabel>
        <Field label="Banner text" hint="Shown at the top of every page when active. Leave blank to hide.">
          <textarea
            value={bannerText}
            onChange={e => setBannerText(e.target.value)}
            placeholder="e.g. Free shipping on all orders this weekend only!"
            rows={3}
            style={{
              width:"100%", padding:"0.75rem",
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              fontFamily:"var(--font-jost)", fontSize:"0.82rem", color:"#FAF6F1",
              outline:"none", resize:"vertical", boxSizing:"border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--burnt-orange)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </Field>

        {/* Toggle */}
        <label style={{ display:"flex", alignItems:"center", gap:"0.85rem", cursor:"pointer", marginBottom:"1.25rem" }}>
          <div
            onClick={() => setBannerActive(v => !v)}
            style={{
              width:"40px", height:"22px", borderRadius:"11px",
              background: bannerActive ? "var(--burnt-orange)" : "rgba(255,255,255,0.12)",
              position:"relative", cursor:"pointer", transition:"background 0.2s",
              flexShrink:0,
            }}
          >
            <div style={{
              position:"absolute", top:"3px",
              left: bannerActive ? "21px" : "3px",
              width:"16px", height:"16px", borderRadius:"50%",
              background:"#fff", transition:"left 0.2s",
            }} />
          </div>
          <span style={{ ...dark, fontSize:"0.82rem" }}>
            Banner {bannerActive ? "active" : "inactive"}
          </span>
        </label>

        {/* Preview */}
        {bannerText && bannerActive && (
          <div style={{
            padding:"0.65rem 1rem", marginBottom:"1.25rem",
            background:"var(--burnt-orange)", borderRadius:"2px",
            fontFamily:"var(--font-jost)", fontSize:"0.78rem",
            color:"var(--cream)", textAlign:"center",
          }}>
            {bannerText}
          </div>
        )}

        <SaveButton onClick={() => save(setBannerSaved)} saved={bannerSaved} />
      </div>
    </div>
  );
}
