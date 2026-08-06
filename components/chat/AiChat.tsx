"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types";

const ORANGE = "#C4440A";
const CREAM  = "#FAF6F1";

const SUGGESTIONS = [
  "How should I price my lehenga?",
  "How do I create a good listing?",
  "Where can I get clothes tailored near me?",
  "Is renting better than selling for a one-time outfit?",
];

export default function AiChat({ externalOpen, onClose }: { externalOpen?: boolean; onClose?: () => void } = {}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (externalOpen) setOpen(true);
  }, [externalOpen]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res  = await fetch("/api/ai-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: updated }) });
      const data = await res.json();
      setMessages([...updated, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button — hidden when panel is open */}
      {!open && <button
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
        style={{
          position: "fixed", bottom: "5rem", right: "1.5rem", zIndex: 50,
          width: "52px", height: "52px", borderRadius: "50%",
          background: ORANGE, color: "#fff", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(196,68,10,0.35)",
          cursor: "pointer", fontSize: "1.25rem", transition: "opacity 0.2s",
        }}
        onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseOut={e => (e.currentTarget.style.opacity = "1")}
      >
        💬
      </button>}

      {/* Backdrop — click outside to close */}
      {open && <div onClick={() => { setOpen(false); onClose?.(); }} style={{ position: "fixed", inset: 0, zIndex: 49 }} />}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 0, right: "1.5rem", zIndex: 50,
          width: "min(380px, calc(100vw - 2rem))",
          maxHeight: "calc(100vh - 5rem)",
          background: CREAM, border: "1px solid #EDE6DE", borderBottom: "none",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ background: ORANGE, padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.1rem", color: "#fff", lineHeight: 1.2 }}>
                Veeral AI
              </p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em" }}>
                Ask me anything about South Asian fashion
              </p>
            </div>
            <button
              onClick={() => { setOpen(false); onClose?.(); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: "0.2rem" }}
              onMouseOver={e => (e.currentTarget.style.color = "#fff")}
              onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.65rem", maxHeight: "320px" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.72rem", color: "#9C8B7E", marginBottom: "0.25rem" }}>Try asking:</p>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)} style={{
                    textAlign: "left", padding: "0.55rem 0.75rem",
                    background: "#fff", border: "1px solid #EDE6DE",
                    fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "#3D3830",
                    cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = ORANGE; e.currentTarget.style.color = ORANGE; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#EDE6DE"; e.currentTarget.style.color = "#3D3830"; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "0.55rem 0.8rem",
                  fontFamily: "var(--font-jost)", fontSize: "0.82rem", lineHeight: 1.55,
                  background: m.role === "user" ? ORANGE : "#fff",
                  color: m.role === "user" ? "#fff" : "#3D3830",
                  border: m.role === "user" ? "none" : "1px solid #EDE6DE",
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "0.55rem 0.8rem", background: "#fff", border: "1px solid #EDE6DE", fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#9C8B7E" }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid #EDE6DE", padding: "0.75rem", display: "flex", gap: "0.5rem", background: "#fff" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about pricing, styling…"
              style={{
                flex: 1, padding: "0.5rem 0.75rem",
                border: "1px solid #EDE6DE", background: CREAM,
                fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: "#3D3830",
                outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = ORANGE)}
              onBlur={e => (e.target.style.borderColor = "#EDE6DE")}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px", flexShrink: 0,
                background: loading || !input.trim() ? "#EDE6DE" : ORANGE,
                color: loading || !input.trim() ? "#9C8B7E" : "#fff",
                border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem", transition: "background 0.15s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
