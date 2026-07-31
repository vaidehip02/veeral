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
  const [commError,  setCommError]  = useState<string | null>(null);

  const [depositMultiplier, setDepositMultiplier] = useState("5");
  const [depositMin,        setDepositMin]        = useState("50");
  const [depositMax,        setDepositMax]        = useState("2000");
  const [depositSaved,      setDepositSaved]      = useState(false);
  const [depositError,      setDepositError]      = useState<string | null>(null);

  const [lateFeeType,       setLateFeeType]       = useState<"flat" | "multiplier">("multiplier");
  const [lateFeeValue,      setLateFeeValue]      = useState("1.5");
  const [gracePeriodDays,   setGracePeriodDays]   = useState("0");
  const [lateFeeSaved,      setLateFeeSaved]      = useState(false);
  const [lateFeeError,      setLateFeeError]      = useState<string | null>(null);

  const [bannerText,   setBannerText]   = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerSaved,  setBannerSaved]  = useState(false);

  // Hero slides
  interface HeroSlide { id: number; label: string; heading: string; sub: string; cta: string; href: string; image_url: string | null; order_index: number; active: boolean; }
  const [slides,      setSlides]      = useState<HeroSlide[]>([]);
  const [slidesDirty, setSlidesDirty] = useState<Record<number, Partial<HeroSlide>>>({});
  const [slidesSaved, setSlidesSaved] = useState<Record<number, boolean>>({});
  const [slidesErr,   setSlidesErr]   = useState<string | null>(null);
  const [addingSlide, setAddingSlide] = useState(false);
  const [newSlide,    setNewSlide]    = useState({ label: "", heading: "", sub: "", cta: "Shop Now", href: "/listings", image_url: "" });

  // Load hero slides
  useEffect(() => {
    fetch("/api/admin/hero-slides")
      .then(r => r.json())
      .then(data => setSlides(data))
      .catch(() => {});
  }, []);

  const patchSlide = async (id: number, updates: Partial<HeroSlide>) => {
    setSlidesErr(null);
    const res = await fetch("/api/admin/hero-slides", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
    if (!res.ok) { const d = await res.json(); setSlidesErr(d.error ?? "Save failed."); return; }
    const updated = await res.json();
    setSlides(prev => prev.map(s => s.id === id ? updated : s));
    setSlidesDirty(prev => { const n = { ...prev }; delete n[id]; return n; });
    setSlidesSaved(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSlidesSaved(prev => { const n = { ...prev }; delete n[id]; return n; }), 2500);
  };

  const deleteSlide = async (id: number) => {
    setSlidesErr(null);
    const res = await fetch("/api/admin/hero-slides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) { setSlidesErr("Delete failed."); return; }
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const addSlide = async () => {
    setSlidesErr(null);
    const res = await fetch("/api/admin/hero-slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newSlide, image_url: newSlide.image_url || null, order_index: slides.length }) });
    if (!res.ok) { const d = await res.json(); setSlidesErr(d.error ?? "Add failed."); return; }
    const created = await res.json();
    setSlides(prev => [...prev, created]);
    setNewSlide({ label: "", heading: "", sub: "", cta: "Shop Now", href: "/listings", image_url: "" });
    setAddingSlide(false);
  };

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

  // Load commission/deposit settings from DB on mount
  useEffect(() => {
    fetch("/api/admin/settings/fees")
      .then(r => r.json())
      .then(d => {
        if (d.sale_fee_pct != null)       setCommission(String(d.sale_fee_pct));
        if (d.deposit_multiplier != null)  setDepositMultiplier(String(d.deposit_multiplier));
        if (d.deposit_min_cents != null)   setDepositMin(String(d.deposit_min_cents / 100));
        if (d.deposit_max_cents != null)   setDepositMax(String(d.deposit_max_cents / 100));
      })
      .catch(() => { /* use defaults */ });
  }, []);

  // Load late-fee settings from DB on mount
  useEffect(() => {
    fetch("/api/admin/settings/late-fee")
      .then(r => r.json())
      .then(d => {
        if (d.late_fee_multiplier != null) setLateFeeValue(String(d.late_fee_multiplier));
        if (d.late_fee_type)               setLateFeeType(d.late_fee_type as "multiplier" | "flat");
        if (d.grace_period_days != null)   setGracePeriodDays(String(d.grace_period_days));
      })
      .catch(() => { /* use defaults */ });
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
        {commError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem" }}>{commError}</p>}
        <SaveButton
          onClick={async () => {
            setCommError(null);
            const pct = parseFloat(commission);
            if (isNaN(pct) || pct < 0 || pct > 100) { setCommError("Enter a valid percentage (0–100)."); return; }
            try {
              const res = await fetch("/api/admin/settings/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sale_fee_pct: pct, rental_fee_pct: pct }),
              });
              if (!res.ok) { const d = await res.json(); setCommError(d.error ?? "Save failed."); return; }
              save(setCommSaved);
            } catch { setCommError("Network error — try again."); }
          }}
          saved={commSaved}
        />
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
        {depositError && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem" }}>{depositError}</p>}
        <SaveButton
          onClick={async () => {
            setDepositError(null);
            const mult = parseFloat(depositMultiplier);
            const minC = Math.round(parseFloat(depositMin) * 100);
            const maxC = Math.round(parseFloat(depositMax) * 100);
            if (isNaN(mult) || mult <= 0) { setDepositError("Enter a valid multiplier."); return; }
            if (isNaN(minC) || minC < 0)  { setDepositError("Enter a valid minimum deposit."); return; }
            if (isNaN(maxC) || maxC < minC) { setDepositError("Maximum must be greater than minimum."); return; }
            try {
              const res = await fetch("/api/admin/settings/fees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deposit_multiplier: mult, deposit_min_cents: minC, deposit_max_cents: maxC }),
              });
              if (!res.ok) { const d = await res.json(); setDepositError(d.error ?? "Save failed."); return; }
              save(setDepositSaved);
            } catch { setDepositError("Network error — try again."); }
          }}
          saved={depositSaved}
        />
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
        <Field label="Grace period (days)" hint="Renter has this many days past the return date before the late fee starts. Default 0.">
          <div style={{ width: "100px" }}>
            <LightInput value={gracePeriodDays} onChange={setGracePeriodDays} type="number" />
          </div>
        </Field>
        {lateFeeError && (
          <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem" }}>
            {lateFeeError}
          </p>
        )}
        <SaveButton
          onClick={async () => {
            setLateFeeError(null);
            const mult = parseFloat(lateFeeValue);
            const grace = parseInt(gracePeriodDays, 10);
            if (isNaN(mult) || mult <= 0) { setLateFeeError("Enter a valid multiplier (e.g. 1.5)."); return; }
            if (isNaN(grace) || grace < 0) { setLateFeeError("Grace period must be 0 or more days."); return; }
            try {
              const res = await fetch("/api/admin/settings/late-fee", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lateFeeMultiplier: mult, gracePeriodDays: grace }),
              });
              if (!res.ok) { const d = await res.json(); setLateFeeError(d.error ?? "Save failed."); return; }
              save(setLateFeeSaved);
            } catch { setLateFeeError("Network error — try again."); }
          }}
          saved={lateFeeSaved}
        />
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

      {/* Hero carousel slides */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <p style={lbl}>Homepage carousel slides</p>
          <button onClick={() => setAddingSlide(v => !v)} style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.35rem 0.8rem", background: addingSlide ? "#F3F4F6" : A.accent, color: addingSlide ? A.muted : "#fff", border: `1px solid ${addingSlide ? A.border : A.accent}`, cursor: "pointer" }}>
            {addingSlide ? "Cancel" : "+ Add slide"}
          </button>
        </div>

        {slidesErr && <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#991B1B", marginBottom: "0.75rem" }}>{slidesErr}</p>}

        {/* Add slide form */}
        {addingSlide && (
          <div style={{ padding: "1rem", background: A.bg, border: `1px solid ${A.border}`, marginBottom: "1.25rem" }}>
            <p style={{ ...lbl, marginBottom: "0.75rem" }}>New slide</p>
            {[
              { key: "label",     label: "Label (small text, e.g. Wedding Season)", ph: "Wedding Season" },
              { key: "heading",   label: "Heading (main title)",                    ph: "Dress for Every Occasion" },
              { key: "sub",       label: "Subtext",                                 ph: "Lehengas, sarees & sherwanis…" },
              { key: "cta",       label: "Button text",                             ph: "Shop Now" },
              { key: "href",      label: "Button link",                             ph: "/listings?category=lehenga" },
              { key: "image_url", label: "Image URL (Cloudinary or leave blank)",   ph: "https://res.cloudinary.com/…" },
            ].map(({ key, label, ph }) => (
              <div key={key} style={{ marginBottom: "0.65rem" }}>
                <label style={{ ...lbl, display: "block", marginBottom: "0.3rem" }}>{label}</label>
                <input value={(newSlide as Record<string, string>)[key]} onChange={e => setNewSlide(prev => ({ ...prev, [key]: e.target.value }))} placeholder={ph}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", background: "#fff", border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.dark, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = A.accent)}
                  onBlur={e => (e.target.style.borderColor = A.border)}
                />
              </div>
            ))}
            <button onClick={addSlide} style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.6rem 1.25rem", background: A.accent, color: "#fff", border: "none", cursor: "pointer" }}>
              Add slide
            </button>
          </div>
        )}

        {/* Existing slides */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: A.border }}>
          {slides.map(slide => {
            const dirty = slidesDirty[slide.id] ?? {};
            const val = (k: keyof HeroSlide) => (dirty[k] ?? slide[k] ?? "") as string;
            const set = (k: keyof HeroSlide, v: string) => setSlidesDirty(prev => ({ ...prev, [slide.id]: { ...prev[slide.id], [k]: v } }));
            return (
              <div key={slide.id} style={{ background: A.card, padding: "1rem 1.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ ...lbl }}>{slide.label || "Slide"}</span>
                    {/* Active toggle */}
                    <div onClick={() => patchSlide(slide.id, { active: !slide.active })} style={{ width: "32px", height: "18px", borderRadius: "9px", background: slide.active ? A.accent : "#E5E7EB", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "2px", left: slide.active ? "16px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: A.muted }}>{slide.active ? "Live" : "Hidden"}</span>
                  </div>
                  <button onClick={() => deleteSlide(slide.id)} style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.25rem 0.55rem", background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", cursor: "pointer" }}>
                    Delete
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  {([
                    ["label",   "Label"],
                    ["heading", "Heading"],
                    ["sub",     "Subtext"],
                    ["cta",     "Button text"],
                    ["href",    "Button link"],
                    ["image_url","Image URL"],
                  ] as [keyof HeroSlide, string][]).map(([k, lbTxt]) => (
                    <div key={k} style={k === "sub" || k === "image_url" ? { gridColumn: "1 / -1" } : {}}>
                      <label style={{ ...lbl, display: "block", marginBottom: "0.2rem" }}>{lbTxt}</label>
                      <input value={val(k)} onChange={e => set(k, e.target.value)}
                        style={{ width: "100%", padding: "0.45rem 0.65rem", background: A.bg, border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: A.dark, outline: "none", boxSizing: "border-box" }}
                        onFocus={e => (e.target.style.borderColor = A.accent)}
                        onBlur={e => (e.target.style.borderColor = A.border)}
                      />
                    </div>
                  ))}
                </div>

                {Object.keys(dirty).length > 0 && (
                  <button
                    onClick={() => patchSlide(slide.id, dirty)}
                    style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.45rem 1rem", background: slidesSaved[slide.id] ? "#D1FAE5" : A.accent, color: slidesSaved[slide.id] ? "#065F46" : "#fff", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {slidesSaved[slide.id] ? "✓ Saved" : "Save slide"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ ...muted, fontSize: "0.68rem", marginTop: "0.75rem" }}>
          Changes go live immediately. Toggle a slide off to hide it without deleting.
        </p>
      </div>
    </div>
  );
}
