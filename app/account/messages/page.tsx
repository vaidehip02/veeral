"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  from: "buyer" | "seller";
  text: string;
  time: string;
}

interface Thread {
  id: string;
  seller: string;
  sellerInitial: string;
  sellerBg: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  item: string;
  messages: Message[];
}

const THREADS: Thread[] = [
  {
    id:"t1", seller:"priya_sharma", sellerInitial:"P", sellerBg:"#D4C5B5",
    lastMessage:"Yes, it fits true to size! The lehenga has a drawstring waist so it's adjustable.",
    lastTime:"2h ago", unread:2, item:"Red Bridal Lehenga with Gold Embroidery",
    messages:[
      { id:"m1", from:"buyer",  text:"Hi! I'm interested in the Red Bridal Lehenga. Does it fit true to size?", time:"Jun 9, 10:42 AM" },
      { id:"m2", from:"seller", text:"Hi! Yes, it fits true to size — the lehenga has a drawstring waist so it's quite adjustable. What size are you usually?", time:"Jun 9, 11:05 AM" },
      { id:"m3", from:"buyer",  text:"I'm usually a US 6. Would that work?", time:"Jun 9, 11:20 AM" },
      { id:"m4", from:"seller", text:"Yes, it fits true to size! The lehenga has a drawstring waist so it's adjustable.", time:"Jun 9, 3:14 PM" },
    ],
  },
  {
    id:"t2", seller:"meera_b", sellerInitial:"M", sellerBg:"#CFC0AF",
    lastMessage:"Of course! I can hold it for 24 hours if you'd like to think it over.",
    lastTime:"Yesterday", unread:0, item:"Silk Sharara Set — Sage Green",
    messages:[
      { id:"m1", from:"buyer",  text:"Hi Meera, is this still available?", time:"Jun 8, 2:30 PM" },
      { id:"m2", from:"seller", text:"Yes it is! Are you interested in buying or renting?", time:"Jun 8, 3:00 PM" },
      { id:"m3", from:"buyer",  text:"Buying! Can you hold it for a day while I check measurements?", time:"Jun 8, 3:15 PM" },
      { id:"m4", from:"seller", text:"Of course! I can hold it for 24 hours if you'd like to think it over.", time:"Jun 8, 4:02 PM" },
    ],
  },
  {
    id:"t3", seller:"kavitha_wears", sellerInitial:"K", sellerBg:"#DDD5CA",
    lastMessage:"It was dry cleaned professionally before listing, so it's in great condition.",
    lastTime:"3 days ago", unread:0, item:"Embroidered Chanderi Saree",
    messages:[
      { id:"m1", from:"buyer",  text:"Hi! Has the saree been dry cleaned recently?", time:"Jun 8, 9:00 AM" },
      { id:"m2", from:"seller", text:"It was dry cleaned professionally before listing, so it's in great condition.", time:"Jun 8, 9:45 AM" },
    ],
  },
];

export default function MessagesPage() {
  const [threads, setThreads]           = useState(THREADS);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [input, setInput]               = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const openThread = (thread: Thread) => {
    // Mark as read
    setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread: 0 } : t));
    setActiveThread({ ...thread, unread: 0 });
    setInput("");
  };

  const sendMessage = () => {
    if (!activeThread || !input.trim()) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      from: "buyer",
      text: input.trim(),
      time: "Just now",
    };
    const updated = { ...activeThread, messages: [...activeThread.messages, newMsg], lastMessage: input.trim(), lastTime: "Just now" };
    setActiveThread(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    setInput("");
  };

  return (
    <div style={{ maxWidth: "860px" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400,
          fontSize: "2rem", color: "#1A1A18", marginBottom: "0.25rem",
        }}>
          Messages
        </h1>
        <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.65 }}>
          {threads.reduce((s, t) => s + t.unread, 0)} unread
        </p>
      </div>

      <div style={{ display: "flex", gap: "0", border: "1px solid var(--warm-tan)", background: "#fff", minHeight: "480px" }} className="messages-layout">

        {/* Thread list */}
        <div style={{
          width: "280px", flexShrink: 0,
          borderRight: "1px solid var(--warm-tan)",
          overflowY: "auto",
        }} className="thread-list">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              style={{
                width: "100%", display: "flex", gap: "0.85rem",
                alignItems: "flex-start", padding: "1rem 1.1rem",
                background: activeThread?.id === thread.id ? "rgba(201,92,26,0.05)" : "transparent",
                borderTop: "none", borderRight: "none",
                borderLeft: activeThread?.id === thread.id ? "2px solid var(--burnt-orange)" : "2px solid transparent",
                borderBottom: "1px solid var(--warm-tan)",
                cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: thread.sellerBg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "1.1rem", color: "var(--muted)", position: "relative",
              }}>
                {thread.sellerInitial}
                {thread.unread > 0 && (
                  <span style={{
                    position: "absolute", top: "-2px", right: "-2px",
                    width: "12px", height: "12px", borderRadius: "50%",
                    background: "var(--burnt-orange)", border: "2px solid #fff",
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.15rem" }}>
                  <p style={{
                    fontFamily: "var(--font-jost)", fontWeight: thread.unread ? 700 : 500,
                    fontSize: "0.8rem", color: "#1A1A18",
                  }}>
                    @{thread.seller}
                  </p>
                  <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.62rem", color: "var(--muted)", opacity: 0.5, flexShrink: 0, marginLeft: "0.5rem" }}>
                    {thread.lastTime}
                  </span>
                </div>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.68rem",
                  color: "var(--muted)", opacity: 0.5,
                  marginBottom: "0.25rem", letterSpacing: "0.02em",
                }}>
                  Re: {thread.item}
                </p>
                <p style={{
                  fontFamily: "var(--font-jost)", fontSize: "0.72rem",
                  color: thread.unread ? "#1A1A18" : "var(--muted)",
                  opacity: thread.unread ? 0.85 : 0.6,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontWeight: thread.unread ? 600 : 400,
                }}>
                  {thread.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        {activeThread ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Chat header */}
            <div style={{
              padding: "0.9rem 1.25rem",
              borderBottom: "1px solid var(--warm-tan)",
              display: "flex", alignItems: "center", gap: "0.75rem",
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: activeThread.sellerBg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-cormorant)", fontStyle: "italic",
                fontSize: "1rem", color: "var(--muted)",
              }}>
                {activeThread.sellerInitial}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.82rem", color: "#1A1A18" }}>
                  @{activeThread.seller}
                </p>
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.65rem", color: "var(--muted)", opacity: 0.55 }}>
                  {activeThread.item}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "1.25rem", display: "flex",
              flexDirection: "column", gap: "0.75rem",
              minHeight: 0,
            }}>
              {activeThread.messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: msg.from === "buyer" ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={{ maxWidth: "72%" }}>
                    <div style={{
                      padding: "0.65rem 0.9rem",
                      background: msg.from === "buyer" ? "var(--burnt-orange)" : "var(--warm-tan)",
                      color: msg.from === "buyer" ? "var(--cream)" : "#1A1A18",
                      fontFamily: "var(--font-jost)", fontSize: "0.82rem", lineHeight: 1.6,
                    }}>
                      {msg.text}
                    </div>
                    <p style={{
                      fontFamily: "var(--font-jost)", fontSize: "0.6rem",
                      color: "var(--muted)", opacity: 0.45, marginTop: "0.25rem",
                      textAlign: msg.from === "buyer" ? "right" : "left",
                    }}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "0.9rem 1.25rem",
              borderTop: "1px solid var(--warm-tan)",
              display: "flex", gap: "0.6rem",
            }}>
              <input
                type="text"
                placeholder="Type a message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{
                  flex: 1, padding: "0.6rem 0.85rem",
                  border: "1px solid var(--warm-tan)", background: "var(--cream)",
                  fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: "#1A1A18",
                  outline: "none", minWidth: 0,
                }}
                onFocus={e => (e.target.style.borderColor = "var(--burnt-orange)")}
                onBlur={e => (e.target.style.borderColor = "var(--warm-tan)")}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{
                  padding: "0.6rem 1.1rem", flexShrink: 0,
                  fontFamily: "var(--font-jost)", fontWeight: 600,
                  fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  background: input.trim() ? "var(--burnt-orange)" : "var(--warm-tan)",
                  color: input.trim() ? "var(--cream)" : "var(--muted)",
                  border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", flexDirection: "column", gap: "0.5rem",
          }}>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontStyle: "italic",
              fontSize: "1.3rem", color: "#1A1A18",
            }}>
              Select a conversation
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: "var(--muted)", opacity: 0.5 }}>
              Choose a thread on the left to read and reply
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .messages-layout { flex-direction: column !important; }
          .thread-list { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--warm-tan); max-height: 240px; }
        }
      `}</style>
    </div>
  );
}
