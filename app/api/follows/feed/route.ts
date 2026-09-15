import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/follows/feed — listings from sellers the current user follows
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ listings: [] });

  // Get followed seller ids
  const { data: follows } = await supabase
    .from("seller_follows")
    .select("seller_id")
    .eq("follower_id", user.id);

  const sellerIds = (follows ?? []).map(f => f.seller_id);
  if (!sellerIds.length) return NextResponse.json({ listings: [] });

  // Get their recent active listings
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, price, rent_price, type, images, condition, created_at, seller_id")
    .in("seller_id", sellerIds)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(40);

  // Fetch seller display names
  const { data: sellers } = await supabase
    .from("seller_profiles")
    .select("id, username, display_name")
    .in("id", sellerIds);

  const sellerMap = Object.fromEntries((sellers ?? []).map(s => [s.id, s]));

  const result = (listings ?? []).map(l => ({
    ...l,
    seller_username: sellerMap[l.seller_id]?.username ?? null,
    seller_display_name: sellerMap[l.seller_id]?.display_name ?? null,
  }));

  return NextResponse.json({ listings: result });
}
