"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";

interface IdentifyResult {
  confident: boolean;
  garmentType: string;
  garmentLabel: string;
  fabric: string;
  embellishments: string[];
  designerStyle: string | null;
  retailValueUSD: { low: number; high: number };
  summary: string;
}

interface AIIdentifyPanelProps {
  onApply: (result: IdentifyResult) => void;
  onClose: () => void;
}

export default function AIIdentifyPanel({ onApply, onClose }: AIIdentifyPanelProps) {
  const [preview, setPreview]     = useState<string>("");
  const [file, setFile]           = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<IdentifyResult | null>(null);
  const [error, setError]         = useState("");
  const inputRef                  = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  async function identify() {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);

    const fd = new FormData();
    fd.append("image", file);

    try {
      const res  = await fetch("/api/seller/identify", { method: "POST", body: fd });
      const data = await res.json();

      if (data.error) { setError("We couldn't identify this item. Try a clearer photo or fill in the details manually."); }
      else if (!data.confident) {
        setResult(data);
        setError("We couldn't identify this item with full confidence — review the suggestions below carefully.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const panelLabel: React.CSSProperties = {
    fontFamily: "var(--font-jost)", fontWeight: 600,
    fontSize: "0.68rem", letterSpacing: "0.2em",
    textTransform: "uppercase", color: "#2A2118",
    display: "block", marginBottom: "0.3rem",
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: "var(--font-jost)", fontWeight: 500,
    fontSize: "0.88rem", color: "#1A1A18",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "rgba(26,20,16,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <div style={{
        background: "var(--cream)", width: "100%", maxWidth: "480px",
        border: "1px solid var(--warm-tan)", maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>

        {/* Header */}
        <div style={{
          padding: "1.4rem 1.8rem", borderBottom: "1px solid var(--warm-tan)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0
        }}>
          <div>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.2rem" }}>
              ✦ AI Item Identification
            </p>
            <h3 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 500, fontSize: "1.35rem", color: "#1A1A18" }}>
              Not sure what you have?
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--muted)", flexShrink: 0, marginLeft: "1rem" }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.8rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* Upload area */}
          <div>
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.7, marginBottom: "0.9rem" }}>
              Upload a clear photo of the item and our AI will identify the garment type, fabric, embellishments, and estimated value.
            </p>

            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: "1.5px dashed var(--warm-tan)", padding: "1.5rem",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: "0.6rem", cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                background: preview ? "transparent" : undefined
              }}
              onMouseOver={e => { if (!preview) { (e.currentTarget as HTMLElement).style.borderColor = "#C4440A"; (e.currentTarget as HTMLElement).style.background = "rgba(196,68,10,0.02)"; } }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--warm-tan)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {preview ? (
                <img src={preview} alt="Upload preview" style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain", display: "block" }} />
              ) : (
                <>
                  <Camera size={28} color="#C4440A" strokeWidth={1.5} />
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
                    Click to upload a photo
                  </span>
                  <span style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.72rem", color: "var(--muted)", opacity: 0.7 }}>
                    JPG or PNG · Max 10MB
                  </span>
                </>
              )}
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {preview && !result && (
              <button
                onClick={() => { setPreview(""); setFile(null); }}
                style={{
                  marginTop: "0.5rem", background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.72rem",
                  color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "3px"
                }}
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.82rem", color: "#C4440A", lineHeight: 1.6 }}>
              {error}
            </p>
          )}

          {/* Results */}
          {result && (
            <div style={{ border: "1px solid var(--warm-tan)", padding: "1.2rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#C4440A", marginBottom: "0.1rem" }}>
                ✦ AI Analysis
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.85rem", color: "#1A1A18", lineHeight: 1.7 }}>
                {result.summary}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem 1.5rem" }}>
                <div>
                  <span style={panelLabel}>Garment type</span>
                  <span style={valueStyle}>{result.garmentLabel}</span>
                </div>
                <div>
                  <span style={panelLabel}>Fabric</span>
                  <span style={valueStyle}>{result.fabric}</span>
                </div>
                {result.embellishments?.length > 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={panelLabel}>Embellishments</span>
                    <span style={valueStyle}>{result.embellishments.join(", ")}</span>
                  </div>
                )}
                {result.designerStyle && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={panelLabel}>Style / Era</span>
                    <span style={valueStyle}>{result.designerStyle}</span>
                  </div>
                )}
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={panelLabel}>Estimated original retail</span>
                  <span style={{ ...valueStyle, color: "#C4440A" }}>
                    ${result.retailValueUSD.low.toLocaleString()} – ${result.retailValueUSD.high.toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1.2rem 1.8rem", borderTop: "1px solid var(--warm-tan)", flexShrink: 0, display: "flex", gap: "0.75rem", flexDirection: "column" }}>
          {!result ? (
            <button
              onClick={identify} disabled={!file || loading}
              style={{
                width: "100%", padding: "0.9rem", background: (!file || loading) ? "var(--warm-tan)" : "#C4440A",
                border: "none", cursor: (!file || loading) ? "not-allowed" : "pointer",
                fontFamily: "var(--font-jost)", fontWeight: 700,
                fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--cream)", transition: "opacity 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                  Analysing…
                </>
              ) : "Identify item →"}
            </button>
          ) : (
            <>
              <button
                onClick={() => onApply(result)}
                style={{
                  width: "100%", padding: "0.9rem", background: "#C4440A", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-jost)", fontWeight: 700,
                  fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "var(--cream)", transition: "opacity 0.2s"
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                Use these details
              </button>
              <button
                onClick={() => { setResult(null); setPreview(""); setFile(null); setError(""); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "var(--font-jost)", fontWeight: 500, fontSize: "0.72rem",
                  letterSpacing: "0.1em", color: "var(--muted)",
                  textDecoration: "underline", textUnderlineOffset: "3px"
                }}
              >
                Try a different photo
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
