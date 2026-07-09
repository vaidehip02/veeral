"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CounterpartyProfile {
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface ConversationListing {
  id: string;
  title: string;
  images: string[];
}

interface Conversation {
  id: string;
  counterpartyId: string;
  counterparty: CounterpartyProfile | null;
  listingId: string | null;
  listing: ConversationListing | null;
  orderId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  myLastReadAt: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isUnread(conv: Conversation): boolean {
  if (!conv.lastMessageAt) return false;
  if (!conv.myLastReadAt) return true;
  return new Date(conv.lastMessageAt) > new Date(conv.myLastReadAt);
}

const A = {
  accent: "#C4440A",
  muted: "var(--muted)",
  border: "var(--warm-tan)",
  dark: "#1A1A18",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadParam = searchParams.get("thread");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(threadParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load current user id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load inbox
  const loadInbox = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return;
    const { conversations: data } = await res.json() as { conversations: Conversation[] };
    setConversations(data ?? []);
    setLoadingInbox(false);
    if (!activeId && data?.length > 0) {
      setActiveId(data[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadInbox(); }, [loadInbox]);

  // Load messages when active thread changes
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingThread(true);
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (res.ok) {
      const { messages: data } = await res.json() as { messages: Message[] };
      setMessages(data ?? []);
    }
    setLoadingThread(false);
    fetch(`/api/conversations/${convId}/read`, { method: "POST" }).then(() => {
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, myLastReadAt: new Date().toISOString() } : c
      ));
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    router.replace(`/account/messages?thread=${activeId}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
          if (newMsg.sender_id !== currentUserId) {
            fetch(`/api/conversations/${activeId}/read`, { method: "POST" }).then(() => {
              setConversations(prev => prev.map(c =>
                c.id === activeId
                  ? { ...c, myLastReadAt: new Date().toISOString(), lastMessageAt: newMsg.created_at, lastMessagePreview: newMsg.body.slice(0, 80) }
                  : c
              ));
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, currentUserId]);

  async function sendMessage() {
    if (!draft.trim() || !activeId || sending) return;
    setSending(true);
    const body = draft.trim();
    setDraft("");
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const { message } = await res.json() as { message: Message };
      setMessages(prev => prev.find(m => m.id === message.id) ? prev : [...prev, message]);
      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, lastMessageAt: message.created_at, lastMessagePreview: body.slice(0, 80), myLastReadAt: new Date().toISOString() }
            : c
        ).sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""))
      );
    } else {
      setDraft(body);
      try {
        const { error } = await res.json() as { error?: string };
        setSendError(error ?? "Failed to send. Please try again.");
      } catch {
        setSendError("Failed to send. Please try again.");
      }
    }
    setSending(false);
  }

  const activeConv = conversations.find(c => c.id === activeId);
  const totalUnread = conversations.filter(isUnread).length;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 140px)", minHeight: "500px", overflow: "hidden", margin: "-2.5rem -2rem -4rem", borderLeft: "1px solid var(--warm-tan)" }}>

      {/* ── Inbox list ── */}
      <div style={{ width: "360px", flexShrink: 0, borderRight: `1px solid ${A.border}`, display: "flex", flexDirection: "column", background: "#fff" }}>

        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: `1px solid ${A.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: A.dark, margin: 0 }}>
              Messages
            </h1>
            {totalUnread > 0 && (
              <span style={{ minWidth: "20px", height: "20px", borderRadius: "10px", background: A.accent, color: "#fff", fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 0.35rem" }}>
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingInbox ? (
            <div style={{ padding: "2rem 1.25rem", fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: A.muted, opacity: 0.6 }}>Loading…</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "2rem 1.25rem" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1.1rem", color: A.dark, marginBottom: "0.5rem" }}>No messages yet</p>
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: A.muted, opacity: 0.7, lineHeight: 1.6 }}>When you message a seller or buyer, threads appear here.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const unread = isUnread(conv);
              const active = conv.id === activeId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  style={{ width: "100%", textAlign: "left", padding: "1rem 1.25rem", background: active ? "rgba(196,68,10,0.06)" : "transparent", borderBottom: `1px solid ${A.border}`, borderLeft: active ? `3px solid ${A.accent}` : "3px solid transparent", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0, background: "#EDE6DE", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {conv.counterparty?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={conv.counterparty.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.75rem", color: A.muted }}>
                        {(conv.counterparty?.display_name ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem" }}>
                      <span style={{ fontFamily: "var(--font-jost)", fontWeight: unread ? 700 : 500, fontSize: "0.95rem", color: A.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.counterparty?.display_name ?? "Unknown"}
                      </span>
                      {conv.lastMessageAt && (
                        <span style={{ fontFamily: "var(--font-jost)", fontSize: "0.75rem", color: A.muted, opacity: 0.6, flexShrink: 0 }}>
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.listing && (
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: A.accent, margin: "0 0 0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {conv.listing.title}
                      </p>
                    )}
                    <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.82rem", color: A.muted, opacity: unread ? 1 : 0.65, fontWeight: unread ? 600 : 400, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.lastMessagePreview ?? "Start the conversation"}
                    </p>
                  </div>

                  {unread && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: A.accent, flexShrink: 0, marginTop: "0.35rem" }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Thread panel ── */}
      {activeConv ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Thread header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${A.border}`, background: "#fff", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-jost)", fontWeight: 600, fontSize: "0.9rem", color: A.dark, margin: 0 }}>
                {activeConv.counterparty?.display_name ?? "Unknown"}
                {activeConv.counterparty?.username && (
                  <Link href={`/sellers/${activeConv.counterparty.username}`} style={{ fontWeight: 400, color: A.muted, fontSize: "0.78rem", marginLeft: "0.5rem", textDecoration: "none" }}
                    onMouseOver={e => (e.currentTarget.style.color = A.accent)}
                    onMouseOut={e => (e.currentTarget.style.color = A.muted)}
                  >
                    @{activeConv.counterparty.username}
                  </Link>
                )}
              </p>
              {activeConv.listing && (
                <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", color: A.accent, margin: "0.15rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Re: {activeConv.listing.title}
                </p>
              )}
            </div>
            {activeConv.listing?.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeConv.listing.images[0]} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }} />
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", background: "#FAF6F1" }}>
            {loadingThread ? (
              <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.8rem", color: A.muted, opacity: 0.6, textAlign: "center" }}>Loading…</p>
            ) : messages.length === 0 ? (
              <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontSize: "1rem", color: A.muted, textAlign: "center", opacity: 0.7 }}>
                No messages yet — say hello.
              </p>
            ) : (
              messages.map(msg => {
                const mine = msg.sender_id === currentUserId;
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "68%", padding: "0.65rem 0.9rem", background: mine ? A.accent : "#fff", color: mine ? "#fff" : A.dark, borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.85rem", lineHeight: 1.55, margin: 0, wordBreak: "break-word" }}>{msg.body}</p>
                      <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.7rem", margin: "0.35rem 0 0", opacity: 0.65, textAlign: mine ? "right" : "left" }}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div style={{ borderTop: `1px solid ${A.border}`, background: "#fff" }}>
            {sendError && (
              <p style={{ margin: "0", padding: "0.6rem 1.5rem", fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: "#991B1B", background: "#FEF2F2", borderBottom: `1px solid #FECACA` }}>
                {sendError}
              </p>
            )}
            <div style={{ padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <textarea
              value={draft}
              onChange={e => { setDraft(e.target.value); if (sendError) setSendError(null); }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{ flex: 1, padding: "0.65rem 0.85rem", background: "#FAF6F1", border: `1px solid ${A.border}`, fontFamily: "var(--font-jost)", fontSize: "0.85rem", color: A.dark, resize: "none", outline: "none", borderRadius: "4px", lineHeight: 1.5 }}
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              style={{ padding: "0.65rem 1.25rem", background: draft.trim() && !sending ? A.accent : "#EDE6DE", color: draft.trim() && !sending ? "#fff" : A.muted, fontFamily: "var(--font-jost)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", border: "none", cursor: draft.trim() && !sending ? "pointer" : "not-allowed", flexShrink: 0 }}
            >
              {sending ? "…" : "Send"}
            </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF6F1" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant)", fontStyle: "italic", fontWeight: 400, fontSize: "1.5rem", color: A.dark, marginBottom: "0.5rem" }}>
              Select a conversation
            </p>
            <p style={{ fontFamily: "var(--font-jost)", fontSize: "0.78rem", color: A.muted, opacity: 0.65 }}>
              Choose a thread from the left to read and reply.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
