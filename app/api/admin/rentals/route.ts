import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "vaidehip02@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: orders, error } = await admin
    .from("orders")
    .select("*")
    .in("status", ["active", "return_pending", "damage_claimed", "deposit_released", "deposit_resolved"])
    .not("rental_start", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin rentals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders?.length) return NextResponse.json({ rentals: [] });

  const allProfileIds = [...orders.map(o => o.buyer_id), ...orders.map(o => o.seller_id)].filter(Boolean);
  const profileIds = allProfileIds.filter((id, i) => allProfileIds.indexOf(id) === i);
  const allListingIds = orders.map(o => o.listing_id).filter(Boolean);
  const listingIds = allListingIds.filter((id, i) => allListingIds.indexOf(id) === i);

  const [{ data: profiles }, { data: listings }] = await Promise.all([
    admin.from("seller_profiles").select("id, username").in("id", profileIds),
    admin.from("listings").select("id, title").in("id", listingIds),
  ]);

  const profileMap: Record<string, { username: string }> = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  const listingMap: Record<string, { title: string }> = Object.fromEntries((listings ?? []).map(l => [l.id, l]));

  const rentals = orders.map(o => ({
    id: o.id,
    buyerUsername: profileMap[o.buyer_id]?.username ?? "unknown",
    buyerId: o.buyer_id ?? "",
    sellerUsername: profileMap[o.seller_id]?.username ?? "unknown",
    sellerId: o.seller_id ?? "",
    item: listingMap[o.listing_id]?.title ?? "Unknown item",
    start: o.rental_start ?? "",
    end: o.rental_end ?? "",
    dailyRate: o.rent_price_per_day ?? 0,
    deposit: o.deposit_amount ?? 0,
    status: o.status,
    damageClaim: o.damage_claim_description ? {
      photos: o.damage_claim_photos ?? [],
      description: o.damage_claim_description,
      retainAmount: o.damage_claim_retain_amount ?? 0,
    } : null,
  }));

  return NextResponse.json({ rentals });
}
