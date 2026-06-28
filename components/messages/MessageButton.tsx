"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MessageButtonProps {
  recipientId: string;        // UUID of the person to message
  listingId?: string;         // optional listing context
  orderId?: string;           // optional order context
  label?: string;             // button label, default "Message"
  style?: React.CSSProperties;
}

export default function MessageButton({ recipientId, listingId, orderId, label = "Message", style }: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, listingId, orderId }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        alert(error ?? "Could not open conversation.");
        return;
      }
      const { conversationId } = await res.json();
      router.push(`/account/messages?thread=${conversationId}`);
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        fontFamily: "var(--font-jost)", fontWeight: 600,
        fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase",
        color: "#C4440A", background: "transparent",
        border: "1px solid #C4440A", padding: "0.6rem 1.2rem",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
        transition: "opacity 0.2s",
        ...style,
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}
