import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/follows/[sellerId] — follow a seller
export async function POST(_req: NextRequest, { params }: { params: { sellerId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sellerId } = params;
  if (sellerId === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { error } = await supabase
    .from("seller_follows")
    .upsert({ follower_id: user.id, seller_id: sellerId }, { onConflict: "follower_id,seller_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: true });
}

// DELETE /api/follows/[sellerId] — unfollow a seller
export async function DELETE(_req: NextRequest, { params }: { params: { sellerId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("seller_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("seller_id", params.sellerId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ following: false });
}
