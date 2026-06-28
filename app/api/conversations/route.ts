import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/conversations — inbox: all conversations for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      participant_a_id,
      participant_b_id,
      listing_id,
      order_id,
      last_message_at,
      last_message_preview,
      a_last_read_at,
      b_last_read_at,
      created_at,
      listings ( id, title, images ),
      orders ( id, type )
    `)
    .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("GET /api/conversations:", error);
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }

  // Fetch counterparty profiles
  const counterpartyIds = (data ?? []).map(c =>
    c.participant_a_id === user.id ? c.participant_b_id : c.participant_a_id
  );
  const uniqueIds = counterpartyIds.filter((id, i, arr) => arr.indexOf(id) === i);

  const profileMap: Record<string, { username: string; display_name: string; avatar_url: string | null }> = {};
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from("seller_profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", uniqueIds);
    (profiles ?? []).forEach(p => { profileMap[p.id] = p; });
  }

  const conversations = (data ?? []).map(c => {
    const isA = c.participant_a_id === user.id;
    const counterpartyId = isA ? c.participant_b_id : c.participant_a_id;
    const myLastRead = isA ? c.a_last_read_at : c.b_last_read_at;
    const listing = Array.isArray(c.listings) ? c.listings[0] : c.listings as { id: string; title: string; images: string[] } | null;
    return {
      id: c.id,
      counterpartyId,
      counterparty: profileMap[counterpartyId] ?? null,
      listingId: c.listing_id,
      listing: listing ?? null,
      orderId: c.order_id,
      lastMessageAt: c.last_message_at,
      lastMessagePreview: c.last_message_preview,
      myLastReadAt: myLastRead,
      createdAt: c.created_at,
    };
  });

  return NextResponse.json({ conversations });
}

// POST /api/conversations — find or create a conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { recipientId, listingId, orderId } = body as {
    recipientId: string;
    listingId?: string;
    orderId?: string;
  };

  if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 });
  if (recipientId === user.id) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  const admin = createAdminClient();

  // Check recipient exists (suspended check can be added later when that column exists)
  const { data: recipientCheck } = await admin
    .from("seller_profiles")
    .select("id")
    .eq("id", recipientId)
    .maybeSingle();
  // If they have no seller profile at all they may still be a valid buyer — allow it.
  void recipientCheck;

  // Try to find existing conversation for this pair + listing
  const aId = user.id < recipientId ? user.id : recipientId;
  const bId = user.id < recipientId ? recipientId : user.id;

  let query = supabase
    .from("conversations")
    .select("id")
    .eq("participant_a_id", aId)
    .eq("participant_b_id", bId);

  if (listingId) {
    query = query.eq("listing_id", listingId);
  } else {
    query = query.is("listing_id", null);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    return NextResponse.json({ conversationId: existing.id, created: false });
  }

  // Create new conversation
  const { data: created, error: createErr } = await supabase
    .from("conversations")
    .insert({
      participant_a_id: aId,
      participant_b_id: bId,
      listing_id: listingId ?? null,
      order_id: orderId ?? null,
    })
    .select("id")
    .single();

  if (createErr) {
    // Race condition: someone else created it between our check and insert
    if (createErr.code === "23505") {
      const { data: retry } = await supabase
        .from("conversations")
        .select("id")
        .eq("participant_a_id", aId)
        .eq("participant_b_id", bId)
        .eq("listing_id", listingId ?? null)
        .single();
      if (retry) return NextResponse.json({ conversationId: retry.id, created: false });
    }
    console.error("POST /api/conversations:", createErr);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversationId: created.id, created: true }, { status: 201 });
}
