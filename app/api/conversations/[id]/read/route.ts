import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations/[id]/read — mark thread as read for current user
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conversation } = await supabase
    .from("conversations")
    .select("participant_a_id, participant_b_id")
    .eq("id", params.id)
    .single();

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isA = conversation.participant_a_id === user.id;
  const field = isA ? "a_last_read_at" : "b_last_read_at";

  await supabase
    .from("conversations")
    .update({ [field]: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
