"use client";

const A = {
  dark:   "#0D0906",
  muted:  "#6B5E52",
  card:   "#FFFFFF",
  border: "#EDE6DE",
  accent: "#C4440A",
};

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** "danger" = red confirm button (suspend, reject, remove). Default = "danger". */
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm",
  variant = "danger", onConfirm, onCancel,
}: Props) {
  if (!open) return null;

  const confirmStyle: React.CSSProperties = variant === "danger"
    ? { background: "#DC2626", color: "#fff", border: "none" }
    : { background: "#D97706", color: "#fff", border: "none" };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(13,9,6,0.35)", zIndex: 200,
        }}
      />
      {/* Dialog */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: A.card, border: `1px solid ${A.border}`,
        padding: "1.75rem", width: "min(400px, 90vw)",
        zIndex: 201, boxShadow: "0 8px 32px rgba(13,9,6,0.12)",
      }}>
        <p style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic",
          fontWeight: 400, fontSize: "1.4rem", color: A.dark, marginBottom: "0.5rem",
        }}>
          {title}
        </p>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "0.65rem", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "0.6rem 1.2rem",
              background: "transparent", color: A.muted,
              border: `1px solid ${A.border}`, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              fontFamily: "var(--font-jost)", fontWeight: 600,
              fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "0.6rem 1.2rem",
              cursor: "pointer", ...confirmStyle,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
