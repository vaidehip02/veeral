"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AIIdentifyPanel from "@/components/seller/AIIdentifyPanel";
import AIPricingSuggestion from "@/components/seller/AIPricingSuggestion";

// ── Constants ─────────────────────────────────────────────────────────────────
const GARMENT_TYPES = [
  { value: "lehenga",       label: "Lehenga" },
  { value: "saree",         label: "Saree" },
  { value: "salwar_kameez", label: "Salwar Kameez / Suit" },
  { value: "sherwani",      label: "Sherwani" },
  { value: "indo_western",  label: "Indo-Western" },
  { value: "jewellery",     label: "Jewellery / Accessories" },
  { value: "other",         label: "Other" },
];
const OCCASIONS = ["Bridal", "Wedding guest", "Engagement", "Festival", "Eid", "Diwali", "Casual", "Party", "Formal"];
const CONDITIONS = [
  { value: "new",       label: "New with tags" },
  { value: "like_new",  label: "Like new — worn once" },
  { value: "good",      label: "Good — worn a few times" },
  { value: "fair",      label: "Fair — visible wear, priced accordingly" },
];
const FABRICS = ["Silk", "Georgette", "Chiffon", "Net", "Velvet", "Brocade", "Cotton", "Linen", "Crepe", "Tissue", "Organza", "Other"];
const EMBELLISHMENTS = ["Zari / Zardozi", "Sequins", "Mirror work", "Thread embroidery", "Beading", "Stone work", "Block print", "Bandhani", "Ikkat", "Plain"];
const WOMENS_SIZES = ["0", "2", "4", "6", "8", "10", "12", "14", "16"];
const MENS_SIZES   = ["36", "38", "40", "42", "44", "46"];
const INCLUDED_OPTS: Record<string, string[]> = {
  lehenga:       ["Lehenga skirt", "Blouse", "Dupatta", "Jacket/Shrug", "Belt/Kamarband"],
  saree:         ["Saree", "Blouse", "Petticoat"],
  salwar_kameez: ["Kameez", "Salwar/Pants", "Dupatta"],
  sherwani:      ["Sherwani", "Pants", "Dupatta/Stole"],
  indo_western:  ["Main piece", "Jacket/Shrug", "Accessories"],
  jewellery:     ["Main piece", "Accessories"],
  other:         ["Main piece", "Accessories"],
};

// ── What's Included Modal ─────────────────────────────────────────────────────
function IncludedModal({ garmentType, selected, onConfirm }: {
  garmentType: string; selected: string[]; onConfirm: (items: string[]) => void;
}) {
  const opts = INCLUDED_OPTS[garmentType] || INCLUDED_OPTS.other;
  const garmentLabel = GARMENT_TYPES.find(g => g.value === garmentType)?.label || "this item";
  const [local, setLocal] = useState<string[]>(selected.length ? selected : opts);
  const toggle = (item: string) => setLocal(l => l.includes(item) ? l.filter(x => x !== item) : [...l, item]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(26,20,16,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--cream)", width: "100%", maxWidth: "420px", border: "1px solid var(--warm-tan)" }}>
        <div style={{ padding: "1.5rem 1.8rem", borderBottom: "1px solid var(--warm-tan)" }}>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.3rem" }}>{garmentLabel}</p>
          <h3 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "1.4rem", color: "#1A1A18" }}>What&apos;s included?</h3>
        </div>
        <div style={{ padding: "1.5rem 1.8rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {opts.map(item => (
            <label key={item} onClick={() => toggle(item)} style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "3px", flexShrink: 0, border: `1.5px solid ${local.includes(item) ? "#C4440A" : "var(--warm-tan)"}`, background: local.includes(item) ? "rgba(196,68,10,0.1)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {local.includes(item) && <span style={{ color: "#C4440A", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontFamily: "var(--font-jost)", fontWeight: local.includes(item) ? 600 : 500, fontSize: "0.88rem", color: "#1A1A18", letterSpacing: "0.02em" }}>{item}</span>
            </label>
          ))}
        </div>
        <div style={{ padding: "1.2rem 1.8rem", borderTop: "1px solid var(--warm-tan)" }}>
          <button onClick={() => onConfirm(local)} style={{ width: "100%", padding: "0.9rem", background: "#C4440A", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--cream)" }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const label: React.CSSProperties = { fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#1A1A18", display: "block", marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.72rem", color: "var(--muted)", marginTop: "0.3rem" };
const inp: React.CSSProperties = { width: "100%", background: "transparent", border: "none", borderBottom: "1.5px solid var(--warm-tan)", outline: "none", fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "#0D0906", padding: "0.5rem 0", caretColor: "#C4440A" };
const selectStyle: React.CSSProperties = { width: "100%", background: "var(--cream)", border: "none", borderBottom: "1.5px solid var(--warm-tan)", outline: "none", fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.9rem", color: "#0D0906", padding: "0.5rem 0", cursor: "pointer" };
const sectionHead: React.CSSProperties = { fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "1.4rem", color: "#1A1A18", marginBottom: "1.4rem" };
const divider: React.CSSProperties = { height: "1px", background: "var(--warm-tan)", margin: "2.5rem 0" };

// ── Toggle chip ───────────────────────────────────────────────────────────────
function Chip({ label: l, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ padding: "0.45rem 0.9rem", border: `1px solid ${selected ? "#C4440A" : "var(--warm-tan)"}`, background: selected ? "rgba(196,68,10,0.08)" : "transparent", fontFamily: "var(--font-jost)", fontWeight: selected ? 700 : 500, fontSize: "0.78rem", letterSpacing: "0.06em", color: selected ? "#C4440A" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>
      {l}
    </button>
  );
}

// ── Photo slot ────────────────────────────────────────────────────────────────
// Accepts either a saved Cloudinary URL (string) or a new pending File
type PhotoEntry =
  | { kind: "saved"; url: string }
  | { kind: "new";   file: File; preview: string };

function PhotoSlot({ entry, onAdd, onRemove, isFirst }: {
  entry?: PhotoEntry; onAdd: (f: File) => void; onRemove: () => void; isFirst: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = entry?.kind === "saved" ? entry.url : entry?.kind === "new" ? entry.preview : undefined;

  return (
    <div style={{ aspectRatio: "3/4", position: "relative" }}>
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="listing photo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {isFirst && <span style={{ position: "absolute", top: "0.5rem", left: "0.5rem", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", background: "#C4440A", color: "var(--cream)", padding: "0.2rem 0.5rem" }}>Cover</span>}
          <button onClick={onRemove} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "24px", height: "24px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", color: "white", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </>
      ) : (
        <div onClick={() => inputRef.current?.click()} style={{ width: "100%", height: "100%", border: "1.5px dashed var(--warm-tan)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "0.4rem", transition: "border-color 0.2s, background 0.2s" }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = "#C4440A"; (e.currentTarget as HTMLElement).style.background = "rgba(196,68,10,0.03)"; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--warm-tan)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <span style={{ fontSize: "1.4rem", color: "var(--warm-tan)" }}>+</span>
          <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{isFirst ? "Cover photo" : "Add photo"}</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) onAdd(f); }} />
    </div>
  );
}

// ── Auto-save status indicator ────────────────────────────────────────────────
type SaveStatus = "idle" | "saving" | "saved" | "error";

function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const configs = {
    saving: { color: "#9A8A7E", text: "Saving draft…" },
    saved:  { color: "#2D6A4F", text: "Draft saved" },
    error:  { color: "#C4440A", text: "Couldn't save draft" },
  } as const;
  const c = configs[status];
  return (
    <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: c.color, letterSpacing: "0.04em" }}>
      {status === "saved" && "✓ "}{c.text}
    </span>
  );
}

// ── Inner form (needs useSearchParams, must be inside Suspense) ───────────────
function NewListingForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  // Draft tracking
  const draftIdRef     = useRef<string | null>(searchParams.get("draft"));
  const autoSaveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef     = useRef(false); // don't auto-save until user changes something
  const isLoadingDraft = useRef(false);

  // Photo state: savedImages = already-uploaded Cloudinary URLs; newPhotos = pending
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [newPhotos, setNewPhotos]     = useState<{ file: File; preview: string }[]>([]);

  // Form fields
  const [form, setForm] = useState({
    title: "", description: "", garmentType: "",
    brand: "", originalPrice: "", price: "", color: "",
    condition: "", fabric: "", careInstructions: "",
    dryCleanOnly: false, isRental: false,
    rentPrice: "", maxRentalDays: "14", depositPercent: "40",
    us_size: "",
  });
  const [occasions,       setOccasions]       = useState<string[]>([]);
  const [embellishments,  setEmbellishments]  = useState<string[]>([]);
  const [included,        setIncluded]        = useState<string[]>([]);
  const [includedModal,   setIncludedModal]   = useState(false);
  const [identifyOpen,    setIdentifyOpen]    = useState(false);
  const [saveStatus,      setSaveStatus]      = useState<SaveStatus>("idle");
  const [saving,          setSaving]          = useState(false);
  const [publishing,      setPublishing]      = useState(false);
  const [error,           setError]           = useState("");
  const [fieldErrors,     setFieldErrors]     = useState<Record<string, string>>({});
  const [loadingDraft,    setLoadingDraft]    = useState(false);

  // ── Load draft on mount if ?draft=<id> is in the URL ────────────────────────
  useEffect(() => {
    const id = searchParams.get("draft");
    if (!id) return;

    draftIdRef.current = id;
    setLoadingDraft(true);
    isLoadingDraft.current = true;

    fetch(`/api/listings/draft?id=${id}`)
      .then(r => r.json())
      .then((data: {
        title?: string; description?: string; category?: string; condition?: string;
        price?: number | null; rent_price?: number | null; rent_duration_days?: number | null;
        type?: string; size?: string; color?: string; brand?: string;
        images?: string[];
        draft_data?: {
          fabric?: string; occasions?: string[]; embellishments?: string[];
          included?: string[]; careInstructions?: string; originalPrice?: string;
          dryCleanOnly?: boolean; isRental?: boolean; rentPrice?: string;
          maxRentalDays?: string; depositPercent?: string;
        } | null;
      }) => {
        if (data.images?.length) setSavedImages(data.images);
        const dd = data.draft_data ?? {};
        setForm(f => ({
          ...f,
          title:            data.title            ?? "",
          description:      data.description      ?? "",
          garmentType:      data.category         ?? "",
          condition:        data.condition        ?? "",
          price:            data.price != null    ? (data.price / 100).toString() : "",
          rentPrice:        data.rent_price != null ? (data.rent_price / 100).toString() : "",
          maxRentalDays:    data.rent_duration_days?.toString() ?? "14",
          us_size:          data.size             ?? "",
          color:            data.color            ?? "",
          brand:            data.brand            ?? "",
          fabric:           dd.fabric             ?? "",
          careInstructions: dd.careInstructions   ?? "",
          originalPrice:    dd.originalPrice      ?? "",
          dryCleanOnly:     dd.dryCleanOnly       ?? false,
          isRental:         dd.isRental           ?? (data.type === "rent" || data.type === "both"),
          depositPercent:   dd.depositPercent     ?? "40",
        }));
        if (dd.occasions?.length)      setOccasions(dd.occasions);
        if (dd.embellishments?.length) setEmbellishments(dd.embellishments);
        if (dd.included?.length)       setIncluded(dd.included);
      })
      .catch(() => { /* silently ignore load failure */ })
      .finally(() => {
        setLoadingDraft(false);
        isLoadingDraft.current = false;
        isDirtyRef.current = false; // don't treat the restore as a change
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save: debounced 4 s after any form change ──────────────────────────
  const buildDraftPayload = useCallback(() => ({
    id:                draftIdRef.current ?? undefined,
    title:             form.title            || null,
    description:       form.description      || null,
    category:          form.garmentType      || null,
    condition:         form.condition        || null,
    price:             form.price            ? Math.round(parseFloat(form.price) * 100) : null,
    rent_price:        form.rentPrice        ? Math.round(parseFloat(form.rentPrice) * 100) : null,
    rent_duration_days: form.maxRentalDays   ? parseInt(form.maxRentalDays) : null,
    type:              form.isRental
                         ? (form.price ? "both" : "rent")
                         : (form.price ? "sale" : null),
    size:              form.us_size          || null,
    color:             form.color            || null,
    brand:             form.brand            || null,
    images:            savedImages,
    draft_data: {
      fabric:           form.fabric,
      occasions,
      embellishments,
      included,
      careInstructions: form.careInstructions,
      originalPrice:    form.originalPrice,
      dryCleanOnly:     form.dryCleanOnly,
      isRental:         form.isRental,
      rentPrice:        form.rentPrice,
      maxRentalDays:    form.maxRentalDays,
      depositPercent:   form.depositPercent,
    },
  }), [form, occasions, embellishments, included, savedImages]);

  const performAutoSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res  = await fetch("/api/listings/draft", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(buildDraftPayload()),
      });
      const json = await res.json() as { id?: string; error?: string };
      if (!res.ok) { setSaveStatus("error"); return; }

      if (json.id && !draftIdRef.current) {
        draftIdRef.current = json.id;
        router.replace(`/dashboard/listings/new?draft=${json.id}`, { scroll: false });
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [buildDraftPayload, router]);

  // Watch all form state and schedule auto-save
  useEffect(() => {
    if (isLoadingDraft.current || loadingDraft) return;
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
      return; // skip first render
    }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("idle");
    autoSaveTimer.current = setTimeout(performAutoSave, 4000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, occasions, embellishments, included, savedImages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Photo helpers ────────────────────────────────────────────────────────────
  const totalPhotos = savedImages.length + newPhotos.length;

  function addPhoto(file: File) {
    if (totalPhotos >= 8) return;
    setNewPhotos(p => [...p, { file, preview: URL.createObjectURL(file) }]);
  }

  function removePhoto(index: number) {
    // index is into the combined [savedImages..., newPhotos...] array
    if (index < savedImages.length) {
      setSavedImages(imgs => imgs.filter((_, i) => i !== index));
    } else {
      const newIdx = index - savedImages.length;
      setNewPhotos(ps => ps.filter((_, i) => i !== newIdx));
    }
  }

  async function uploadNewPhotos(): Promise<string[]> {
    const urls: string[] = [];
    for (const p of newPhotos) {
      const fd = new FormData(); fd.append("file", p.file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json() as { url?: string };
      if (json.url) urls.push(json.url);
    }
    return urls;
  }

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const sizeOptions = form.garmentType === "sherwani" ? MENS_SIZES : WOMENS_SIZES;

  function setF(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function toggleArr<T>(arr: T[], val: T, set: (a: T[]) => void) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  // ── Save as draft (explicit button) ─────────────────────────────────────────
  async function saveDraft() {
    setSaving(true);
    setError("");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    // Upload any new photos first so the draft stores the full Cloudinary URL set
    let allImages = [...savedImages];
    if (newPhotos.length > 0) {
      const uploaded = await uploadNewPhotos();
      allImages = [...allImages, ...uploaded];
      setSavedImages(allImages);
      setNewPhotos([]);
    }

    try {
      const res  = await fetch("/api/listings/draft", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...buildDraftPayload(), id: draftIdRef.current ?? undefined, images: allImages }),
      });
      const json = await res.json() as { id?: string; error?: string };
      if (!res.ok) { setError(json.error ?? "Failed to save draft."); return; }
      if (json.id) draftIdRef.current = json.id;
    } finally {
      setSaving(false);
    }

    router.push("/dashboard/listings");
  }

  // ── Publish ──────────────────────────────────────────────────────────────────
  async function publish() {
    setError("");
    setFieldErrors({});

    // Validate all required fields
    const errs: Record<string, string> = {};
    if (!form.title.trim())                          errs.title       = "Please complete this field before publishing";
    if (!form.garmentType)                           errs.garmentType = "Please complete this field before publishing";
    if (!form.condition)                             errs.condition   = "Please complete this field before publishing";
    if (!form.description.trim())                    errs.description = "Please add a description before publishing";
    if (!form.price || parseFloat(form.price) <= 0) errs.price       = "Please enter a price greater than $0 before publishing";
    if (form.isRental && (!form.rentPrice || parseFloat(form.rentPrice) <= 0))
                                                     errs.rentPrice   = "Please enter a rental price greater than $0";
    if (!form.us_size)                               errs.us_size     = "Please complete this field before publishing";
    if (totalPhotos === 0)                           errs.photos      = "Add at least one photo before publishing";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      document.getElementById(`field-${Object.keys(errs)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setPublishing(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in."); setPublishing(false); return; }

    // Upload any remaining new photos
    let allImages = [...savedImages];
    if (newPhotos.length > 0) {
      const uploaded = await uploadNewPhotos();
      allImages = [...allImages, ...uploaded];
    }

    const payload = {
      seller_id:          user.id,
      title:              form.title,
      description:        form.description,
      category:           form.garmentType || "other",
      condition:          form.condition   || "good",
      price:              Math.round(parseFloat(form.price) * 100),
      rent_price:         form.isRental ? Math.round(parseFloat(form.rentPrice || "0") * 100) : null,
      rent_duration_days: form.isRental ? parseInt(form.maxRentalDays) : null,
      type:               form.isRental ? (form.price ? "both" : "rent") : "sale",
      status:             "active" as const,
      images:             allImages,
      size:               form.us_size,
      color:              form.color,
      brand:              form.brand || null,
      location:           null,
      draft_data:         null, // clear draft blob once published
      updated_at:         new Date().toISOString(),
    };

    let dbErr: { message: string } | null = null;

    if (draftIdRef.current) {
      // Promote existing draft → active
      const { error } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", draftIdRef.current)
        .eq("seller_id", user.id);
      dbErr = error;
    } else {
      // No draft id — fresh insert (happens if the seller never triggered auto-save)
      const { error } = await supabase.from("listings").insert(payload);
      dbErr = error;
    }

    if (dbErr) { setError(dbErr.message); setPublishing(false); }
    else router.push("/dashboard?published=true");
  }

  // ── Combined photo slot entries ──────────────────────────────────────────────
  const photoEntries: (PhotoEntry | undefined)[] = [
    ...savedImages.map(url => ({ kind: "saved" as const, url })),
    ...newPhotos.map(p => ({ kind: "new" as const, file: p.file, preview: p.preview })),
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loadingDraft) {
    return (
      <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6 }}>Loading your draft…</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", color: "#1A1A18" }}>
              {draftIdRef.current ? "Continue your draft" : "Create a listing"}
            </h1>
            <AutoSaveIndicator status={saveStatus} />
          </div>
          <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.3rem" }}>
            Your progress is saved automatically. You can come back to this on any device.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

          {/* ── Photos ──────────────────────────────────────────── */}
          <section id="field-photos">
            <p style={sectionHead}>Photos</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }} className="photo-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <PhotoSlot
                  key={i}
                  entry={photoEntries[i]}
                  onAdd={addPhoto}
                  onRemove={() => removePhoto(i)}
                  isFirst={i === 0}
                />
              ))}
            </div>
            {fieldErrors.photos
              ? <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.5rem" }}>{fieldErrors.photos}</p>
              : <p style={hint}>First photo is the cover. Up to 8 photos total.</p>
            }
            <button type="button" onClick={() => setIdentifyOpen(true)} style={{ marginTop: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.06em", color: "#C4440A", textDecoration: "underline", textUnderlineOffset: "3px", display: "flex", alignItems: "center", gap: "0.35rem" }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.7")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              ✦ Not sure what you have? Let AI identify it →
            </button>
          </section>

          <div style={divider} />

          {/* ── Item details ────────────────────────────────────── */}
          <section>
            <p style={sectionHead}>Item details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              <div id="field-title">
                <label style={label}>Title</label>
                <input style={inp} value={form.title} onChange={setF("title")} placeholder="e.g. Red Bridal Lehenga with Gold Zari Embroidery" maxLength={80} />
                {fieldErrors.title
                  ? <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.title}</p>
                  : <p style={hint}>{80 - form.title.length} characters remaining</p>
                }
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div id="field-garmentType">
                  <label style={label}>Garment type</label>
                  <select style={selectStyle} value={form.garmentType}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, garmentType: val }));
                      setIncluded([]);
                      if (val) setIncludedModal(true);
                    }}>
                    <option value="">Select type</option>
                    {GARMENT_TYPES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  {form.garmentType && included.length > 0 && (
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.75rem", color: "#1A1A18", marginTop: "0.5rem", lineHeight: 1.5 }}>
                      Includes: {included.join(", ")} —{" "}
                      <button type="button" onClick={() => setIncludedModal(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem", color: "#C4440A", textDecoration: "underline", textUnderlineOffset: "3px" }}>Edit</button>
                    </p>
                  )}
                  {fieldErrors.garmentType && <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.garmentType}</p>}
                </div>
                <div id="field-condition">
                  <label style={label}>Condition</label>
                  <select style={selectStyle} value={form.condition} onChange={setF("condition")}>
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {fieldErrors.condition && <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.condition}</p>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div>
                  <label style={label}>Designer / Brand</label>
                  <input style={inp} value={form.brand} onChange={setF("brand")} placeholder="Anita Dongre, Sabyasachi, Independent…" />
                </div>
                <div>
                  <label style={label}>Color</label>
                  <input style={inp} value={form.color} onChange={setF("color")} placeholder="e.g. Red & Gold" />
                </div>
              </div>

              <div>
                <label style={label}>Occasion</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {OCCASIONS.map(o => <Chip key={o} label={o} selected={occasions.includes(o)} onClick={() => toggleArr(occasions, o, setOccasions)} />)}
                </div>
              </div>

              <div>
                <label style={label}>Fabric</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {FABRICS.map(f => <Chip key={f} label={f} selected={form.fabric === f} onClick={() => setForm(fm => ({ ...fm, fabric: fm.fabric === f ? "" : f }))} />)}
                </div>
              </div>

              <div>
                <label style={label}>Embellishments</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {EMBELLISHMENTS.map(e => <Chip key={e} label={e} selected={embellishments.includes(e)} onClick={() => toggleArr(embellishments, e, setEmbellishments)} />)}
                </div>
              </div>

              <div id="field-us_size">
                <label style={label}>US Size</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {sizeOptions.map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, us_size: f.us_size === s ? "" : s }))}
                      style={{ width: "48px", height: "48px", border: `1px solid ${form.us_size === s ? "#C4440A" : "var(--warm-tan)"}`, background: form.us_size === s ? "rgba(196,68,10,0.08)" : "transparent", fontFamily: "var(--font-jost)", fontWeight: form.us_size === s ? 700 : 500, fontSize: "0.78rem", color: form.us_size === s ? "#C4440A" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>
                      {s}
                    </button>
                  ))}
                </div>
                {fieldErrors.us_size
                  ? <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.us_size}</p>
                  : <p style={hint}>{form.garmentType === "sherwani" ? "Men's chest size in inches" : "Women's US dress size"}</p>
                }
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <button type="button" onClick={() => setForm(f => ({ ...f, dryCleanOnly: !f.dryCleanOnly }))} style={{ width: "44px", height: "24px", borderRadius: "12px", background: form.dryCleanOnly ? "#C4440A" : "var(--warm-tan)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: "3px", left: form.dryCleanOnly ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
                </button>
                <div>
                  <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18" }}>Dry clean only</p>
                  <p style={{ ...hint, marginTop: 0 }}>Buyers will see a dry clean badge on the listing</p>
                </div>
              </div>

              <div id="field-description">
                <label style={label}>Description</label>
                <textarea value={form.description} onChange={setF("description")} rows={5} maxLength={1000} placeholder="Describe the item — include fabric details, embellishments, condition notes, any flaws or repairs, and note if any pieces are missing from the set" style={{ ...inp, border: `1px solid ${fieldErrors.description ? "#C4440A" : "var(--warm-tan)"}`, borderBottom: undefined, padding: "0.75rem", resize: "none" }} />
                {fieldErrors.description
                  ? <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.description}</p>
                  : <p style={hint}>{1000 - form.description.length} characters remaining</p>
                }
              </div>

              <div>
                <label style={label}>Care instructions <span style={{ opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                <textarea value={form.careInstructions} onChange={setF("careInstructions")} rows={2} maxLength={300} placeholder="e.g. Dry clean only. Store in the garment bag provided." style={{ ...inp, border: "1px solid var(--warm-tan)", borderBottom: undefined, padding: "0.75rem", resize: "none" }} />
              </div>
            </div>
          </section>

          <div style={divider} />

          {/* ── Pricing ─────────────────────────────────────────── */}
          <section>
            <p style={sectionHead}>Pricing</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                <div id="field-price">
                  <label style={label}>Sale price ($)</label>
                  <input type="number" min="1" step="0.01" style={inp} value={form.price} onChange={setF("price")} placeholder="450" />
                  {fieldErrors.price && <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.price}</p>}
                  <AIPricingSuggestion
                    garmentType={form.garmentType} condition={form.condition}
                    fabric={form.fabric} embellishments={embellishments} brand={form.brand}
                    onApply={(salePrice, rentPrice) => setForm(f => ({ ...f, price: salePrice, rentPrice, isRental: true }))}
                  />
                </div>
                <div>
                  <label style={label}>Original / retail price ($) <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input type="number" min="1" step="0.01" style={inp} value={form.originalPrice} onChange={setF("originalPrice")} placeholder="1200" />
                  <p style={hint}>Shows &ldquo;You save $X&rdquo; to buyers</p>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1rem" }}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isRental: !f.isRental }))} style={{ width: "44px", height: "24px", borderRadius: "12px", background: form.isRental ? "#C4440A" : "var(--warm-tan)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                    <span style={{ position: "absolute", top: "3px", left: form.isRental ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", display: "block" }} />
                  </button>
                  <div>
                    <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18" }}>Also available to rent</p>
                    <p style={{ ...hint, marginTop: 0 }}>Buyers can rent this item by the day in addition to buying</p>
                  </div>
                </div>

                {form.isRental && (
                  <div style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                      <div id="field-rentPrice">
                        <label style={label}>Rental price per day ($)</label>
                        <input type="number" min="1" step="0.01" style={inp} value={form.rentPrice} onChange={setF("rentPrice")} placeholder="120" />
                        {fieldErrors.rentPrice && <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.75rem", color: "#C4440A", marginTop: "0.3rem" }}>{fieldErrors.rentPrice}</p>}
                      </div>
                      <div>
                        <label style={label}>Max rental duration (days)</label>
                        <input type="number" min="1" max="90" style={inp} value={form.maxRentalDays} onChange={setF("maxRentalDays")} placeholder="14" />
                      </div>
                    </div>
                    <div>
                      <label style={label}>Security deposit</label>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        {["35", "40", "50"].map(pct => (
                          <button key={pct} type="button"
                            onClick={() => setForm(f => ({ ...f, depositPercent: pct }))}
                            style={{ flex: 1, padding: "0.65rem", border: `1px solid ${form.depositPercent === pct ? "#C4440A" : "var(--warm-tan)"}`, background: form.depositPercent === pct ? "rgba(196,68,10,0.08)" : "transparent", fontFamily: "var(--font-jost)", fontWeight: form.depositPercent === pct ? 700 : 500, fontSize: "0.82rem", color: form.depositPercent === pct ? "#C4440A" : "var(--muted)", cursor: "pointer", transition: "all 0.15s" }}>
                            {pct}% of sale price
                          </button>
                        ))}
                      </div>
                      <p style={hint}>Deposit is refunded to the buyer when the item is returned in good condition</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div style={divider} />

          {/* ── Error + Actions ──────────────────────────────────── */}
          {error && <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#C4440A", marginBottom: "1rem" }}>{error}</p>}

          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="button" onClick={saveDraft} disabled={saving || publishing}
              style={{ flex: 1, padding: "1rem", border: "1px solid var(--warm-tan)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", opacity: saving ? 0.6 : 1, transition: "opacity 0.2s" }}>
              {saving ? "Saving…" : "Save as draft"}
            </button>
            <button type="button" onClick={publish} disabled={saving || publishing}
              style={{ flex: 2, padding: "1rem", background: "#C4440A", border: "none", cursor: "pointer", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--cream)", opacity: publishing ? 0.6 : 1, transition: "opacity 0.2s" }}>
              {publishing ? "Publishing…" : "Publish listing"}
            </button>
          </div>
          <p style={{ ...hint, textAlign: "center" }}>Published listings are immediately visible to buyers.</p>
        </div>
      </div>

      {identifyOpen && (
        <AIIdentifyPanel onClose={() => setIdentifyOpen(false)}
          onApply={result => {
            setForm(f => ({ ...f, garmentType: result.garmentType || f.garmentType, fabric: result.fabric || f.fabric, brand: result.designerStyle || f.brand }));
            if (result.embellishments?.length) setEmbellishments(result.embellishments);
            if (result.garmentType && result.garmentType !== form.garmentType) { setIncluded([]); setIncludedModal(true); }
            setIdentifyOpen(false);
          }}
        />
      )}

      {includedModal && form.garmentType && (
        <IncludedModal garmentType={form.garmentType} selected={included}
          onConfirm={items => { setIncluded(items); setIncludedModal(false); }}
        />
      )}

      <style>{`
        @media (max-width: 640px) { .photo-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  );
}

// ── Default export: Suspense wrapper (required for useSearchParams) ────────────
export default function NewListingPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "var(--cream)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "var(--muted)", opacity: 0.6 }}>Loading…</p>
      </div>
    }>
      <NewListingForm />
    </Suspense>
  );
}
