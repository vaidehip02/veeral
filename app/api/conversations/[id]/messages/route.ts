import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import NewMessage from "@/lib/email/templates/NewMessage";

// GET /api/conversations/[id]/messages
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS ensures only participants can read — this select will return nothing if not a participant
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("GET messages:", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body: messageBody } = await req.json() as { body: string };
  if (!messageBody?.trim()) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 });
  }
  if (messageBody.length > 4000) {
    return NextResponse.json({ error: "Message too long (max 4000 chars)" }, { status: 400 });
  }

  // Verify participant (RLS will also enforce, but we need conversation data for email)
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .select("id, participant_a_id, participant_b_id, listing_id, a_last_read_at, b_last_read_at, listings(title)")
    .eq("id", params.id)
    .single();

  if (convErr || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isA = conversation.participant_a_id === user.id;
  const recipientId = isA ? conversation.participant_b_id : conversation.participant_a_id;
  const recipientLastRead = isA ? conversation.b_last_read_at : conversation.a_last_read_at;

  // Check if recipient has any unread messages already (to avoid email spam)
  const { count: unreadCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", params.id)
    .neq("sender_id", recipientId)
    .gt("created_at", recipientLastRead ?? "1970-01-01");

  // Insert message
  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.id,
      sender_id: user.id,
      body: messageBody.trim(),
    })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();

  if (msgErr) {
    console.error("POST message:", msgErr);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  // Update conversation metadata
  const preview = messageBody.trim().slice(0, 80) + (messageBody.trim().length > 80 ? "…" : "");
  const readUpdate = isA ? { a_last_read_at: new Date().toISOString() } : { b_last_read_at: new Date().toISOString() };
  await supabase
    .from("conversations")
    .update({ last_message_at: message.created_at, last_message_preview: preview, ...readUpdate })
    .eq("id", params.id);

  // Email notification — only if recipient had zero unread before this message
  if ((unreadCount ?? 0) === 0) {
    const { data: senderProfile } = await supabase
      .from("seller_profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single();

    const admin = createAdminClient();
    const { data: recipientUser } = await admin.auth.admin.getUserById(recipientId);
    const recipientProfile = recipientUser?.user ? { email: recipientUser.user.email } : null;

    const listing = Array.isArray(conversation.listings)
      ? conversation.listings[0]
      : (conversation.listings as { title: string } | null);

    if (recipientProfile?.email) {
      sendEmail({
        to: recipientProfile.email,
        subject: `New message from ${senderProfile?.display_name ?? "someone"} on Veeral`,
        react: NewMessage({
          senderName: senderProfile?.display_name ?? "A Veeral user",
          senderUsername: senderProfile?.username ?? "",
          listingTitle: listing?.title ?? null,
          preview: preview,
          threadUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/account/messages?thread=${params.id}`,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
