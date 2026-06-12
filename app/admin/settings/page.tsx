"use client";

import { useState, useEffect } from "react";

const A = {
  dark: "#0D0906", muted: "#6B5E52", label: "#9C8B7E",
  accent: "#C4440A", card: "#FFFFFF", border: "#EDE6DE", bg: "#FAF6F1",
};
const muted: React.CSSProperties = { fontFamily: "var(--font-jost)", color: A.muted };
const lbl:   React.CSSProperties = {
  fontFamily: "var(--font-jost)", fontWeight: 700,
  fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: A.label,
};

const card: React.CSSProperties = {
  background: A.card, border: `1px solid ${A.border}`,
  padding: "1.75rem", marginBottom: "1.5rem",
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{ display: "block", ...lbl, marginBottom: "0.45rem" }}>{label}</label>
      {children}
      {hint && <p style={{ ...muted, fontSize: "0.68rem", marginTop: "0.35rem" }}>{hint}</p>}
    </div>
  );
}

function LightInput({ value, onChange, type = "text", prefix }: {
  value: string; onChange: (v: string) => void; type?: string; prefix?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)",
          fontFamily: "var(--font-jost)", color: A.muted, fontSize: "0.85rem" }}>{prefix}</span>
      )}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: `0.65rem ${prefix ? "0.85rem 0.65rem 2rem" : "0.85rem"}`,
          background: A.bg, border: `1px solid ${A.border}`,
          fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark,
          outline: "none", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = A.accent)}
        onBlur={e => (e.target.style.borderColor = A.border)}
      />
    </div>
  );
}

function SaveButton({ onClick, saved }: { onClick: () => void; saved: boolean }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.65rem",
      letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.65rem 1.4rem",
      background: saved ? "#D1FAE5" : A.accent,
      color: saved ? "#065F46" : "#fff",
      border: "none", cursor: "pointer", transition: "all 0.2s" }}>
      {saved ? "✓ Saved" : "Save changes"}
    </button>
  );
}

export default function AdminSettingsPage() {
  const [commission, setCommission] = useState("10");
  const [commSaved,  setCommSaved]  = useState(false);

  const [depositMultiplier, setDepositMultiplier] = useState("5");
  const [depositMin,        setDepositMin]        = useState("50");
  const [depositMax,        setDepositMax]        = useState("2000");
  const [depositSaved,      setDepositSaved]      = useState(false);

  const [lateFeeType,  setLateFeeType]  = useState<"flat" | "multiplier">("multiplier");
  const [lateFeeValue, setLateFeeValue] = useState("1.5");
  const [lateFeeSaved, setLateFeeSaved] = useState(false);

  const [bannerText,   setBannerText]   = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerSaved,  setBannerSaved]  = useState(false);

  // Load saved banner from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("veeral_banner");
      if (raw) {
        const parsed = JSON.parse(raw);
        setBannerText(parsed.text ?? "");
        setBannerActive(parsed.active ?? false);
      }
    } catch { /* ignore */ }
  }, []);

  const save = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const saveBanner = () => {
    try {
      localStorage.setItem("veeral_banner", JSON.stringify({ text: bannerText, active: bannerActive }));
    } catch { /* ignore */ }
    save(setBannerSaved);
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.12em",
    padding: "0.45rem 0.9rem", cursor: "pointer",
    background: active ? "rgba(196,68,10,0.1)" : "#F3F4F6",
    color: active ? A.accent : A.muted,
    border: `1px solid ${active ? "rgba(196,68,10,0.25)" : A.border}`, transition: "all 0.15s",
  });

  return (
    <div style={{ maxWidth: "620px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "2.2rem", color: A.dark, marginBottom: "0.25rem" }}>
          Platform Settings
        </h1>
        <p style={{ ...muted, fontSize: "0.78rem" }}>Changes take effect immediately across the platform.</p>
      </div>

      {/* Commission */}
      <div style={card}>
        <p style={{ ...lbl, marginBottom: "1.25rem" }}>Commission</p>
        <Field label="Platform commission %" hint="Applied to every completed sale and rental. Sellers receive (100 − commission)% of the listing price.">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "120px" }}>
              <LightInput value={commission} onChange={setCommission} type="number" prefix="%" />
            </div>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.muted }}>
              = seller nets <span style={{ color: "#065F46", fontWeight: 700 }}>{100 - Number(commission)}%</span>
            </p>
          </div>
        </Field>
        {/* Preview */}
        <div style={{ padding: "1rem", background: A.bg, border: `1px solid ${A.border}`, marginBottom: "1.25rem" }}>
          <p style={{ ...lbl, marginBottom: "0.75rem" }}>Example on a $1,000 sale</p>
          {[
            { label: "Listing price",   value: "$1,000",                                                    color: A.dark   },
            { label: "Platform fee",    value: `−$${(1000 * Number(commission) / 100).toFixed(0)}`,        color: "#991B1B" },
            { label: "Seller receives", value: `$${(1000 * (100 - Number(commission)) / 100).toFixed(0)}`, color: "#065F46" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ ...muted, fontSize: "0.78rem" }}>{row.label}</span>
              <span className="tabular-nums" style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", fontWeight: 700, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
        <SaveButton onClick={() => save(setCommSaved)} saved={commSaved} />
      </div>

      {/* Deposit */}
      <div style={card}>
        <p style={{ ...lbl, marginBottom: "1.25rem" }}>Rental deposits</p>
        <Field label="Deposit multiplier (× daily rate)" hint="e.g. 5× means a $100/day item requires a $500 deposit.">
          <div style={{ width: "120px" }}>
            <LightInput value={depositMultiplier} onChange={setDepositMultiplier} type="number" prefix="×" />
          </div>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Minimum deposit ($)"><LightInput value={depositMin} onChange={setDepositMin} type="number" prefix="$" /></Field>
          <Field label="Maximum deposit ($)"><LightInput value={depositMax} onChange={setDepositMax} type="number" prefix="$" /></Field>
        </div>
        <SaveButton onClick={() => save(setDepositSaved)} saved={depositSaved} />
      </div>

      {/* Late fee */}
      <div style={card}>
        <p style={{ ...lbl, marginBottom: "1.25rem" }}>Late return fee</p>
        <Field label="Fee type">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setLateFeeType("multiplier")} style={tabBtn(lateFeeType === "multiplier")}>× Daily rate</button>
            <button onClick={() => setLateFeeType("flat")} style={tabBtn(lateFeeType === "flat")}>Flat fee per day</button>
          </div>
        </Field>
        <Field
          label={lateFeeType === "multiplier" ? "Multiplier (× daily rate per day overdue)" : "Flat fee per day overdue ($)"}
          hint={lateFeeType === "multiplier" ? "e.g. 1.5× means $150/day fee on a $100/day rental." : "Fixed dollar amount charged per overdue day."}>
          <div style={{ width: "140px" }}>
            <LightInput value={lateFeeValue} onChange={setLateFeeValue} type="number" prefix={lateFeeType === "multiplier" ? "×" : "$"} />
          </div>
        </Field>
        <SaveButton onClick={() => save(setLateFeeSaved)} saved={lateFeeSaved} />
      </div>

      {/* Announcement banner */}
      <div style={card}>
        <p style={{ ...lbl, marginBottom: "1.25rem" }}>Site-wide announcement banner</p>
        <Field label="Banner text" hint="Shown at the top of every storefront page when active. Leave blank to use the default message.">
          <textarea value={bannerText} onChange={e => setBannerText(e.target.value)}
            placeholder="e.g. Free shipping on all orders this weekend only!" rows={3}
            style={{ width: "100%", padding: "0.75rem", background: A.bg, border: `1px solid ${A.border}`,
              fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark,
              outline: "none", resize: "vertical", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = A.accent)}
            onBlur={e => (e.target.style.borderColor = A.border)}
          />
        </Field>

        {/* Toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer", marginBottom: "1.25rem" }}>
          <div onClick={() => setBannerActive(v => !v)} style={{
            width: "40px", height: "22px", borderRadius: "11px",
            background: bannerActive ? A.accent : "#E5E7EB",
            position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{
              position: "absolute", top: "3px",
              left: bannerActive ? "21px" : "3px",
              width: "16px", height: "16px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
          </div>
          <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark }}>
            Banner {bannerActive ? "active" : "inactive"}
          </span>
        </label>

        {/* Live preview */}
        {bannerText && bannerActive && (
          <div style={{ padding: "0.65rem 1rem", marginBottom: "1.25rem",
            background: A.accent, borderRadius: "2px",
            fontFamily: "var(--font-jost)", fontSize: "0.78rem",
            fontWeight: 500, letterSpacing: "0.12em",
            color: "#FAF6F1", textAlign: "center" }}>
            {bannerText}
          </div>
        )}

        <SaveButton onClick={saveBanner} saved={bannerSaved} />
      </div>
    </div>
  );
}
