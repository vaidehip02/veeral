import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/follows — returns { following: string[] } (seller_ids the current user follows)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ following: [] });

  const { data } = await supabase
    .from("seller_follows")
    .select("seller_id")
    .eq("follower_id", user.id);

  return NextResponse.json({ following: (data ?? []).map(r => r.seller_id) });
}
