import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "vaidehip02@gmail.com";

/**
 * GET /api/admin/orders
 *
 * Returns sale orders for the admin orders page, including payout status fields.
 * Query params:
 *   status — filter by order status (default: all)
 *   q      — search by order id, listing title substring
 *   limit  — max rows (default 100)
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const q            = searchParams.get("q") ?? "";
  const limit        = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("orders")
    .select(`
      id, created_at, status, amount, platform_fee, shipping_cents,
      seller_payout,
      payout_due_at, payout_released_at, payout_transfer_id,
      payout_frozen, payout_frozen_reason, payout_frozen_at,
      payout_blocked_reason,
      return_tracking_number,
      buyer_id, seller_id,
      listing:listings ( id, title )
    `)
    .eq("type", "sale")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (q) {
    query = query.ilike("listings.title", `%${q}%`);
  }

  const { data: rawOrders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve user emails for buyer/seller (batch)
  const orders = rawOrders ?? [];
  const userIds: string[] = Array.from(new Set(orders.flatMap((o: { buyer_id: string; seller_id: string }) => [o.buyer_id, o.seller_id])));

  const emailMap: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await admin.auth.admin.getUserById(uid);
      if (data.user?.email) emailMap[uid] = data.user.email;
    })
  );

  const result = orders.map((o: {
    id: string; created_at: string; status: string;
    amount: number; platform_fee: number; shipping_cents: number | null; seller_payout: number | null;
    payout_due_at: string | null; payout_released_at: string | null; payout_transfer_id: string | null;
    payout_frozen: boolean; payout_frozen_reason: string | null; payout_frozen_at: string | null;
    payout_blocked_reason: string | null; return_tracking_number: string | null;
    buyer_id: string; seller_id: string;
    listing: { id: string; title: string } | { id: string; title: string }[] | null;
  }) => {
    const listing = Array.isArray(o.listing) ? o.listing[0] : o.listing;
    return {
      id:                   o.id,
      created_at:           o.created_at,
      status:               o.status,
      amount:               o.amount,
      platform_fee:         o.platform_fee,
      shipping_cents:       o.shipping_cents,
      seller_payout:        o.seller_payout,
      item:                 listing?.title ?? "—",
      buyer_email:          emailMap[o.buyer_id] ?? o.buyer_id,
      seller_email:         emailMap[o.seller_id] ?? o.seller_id,
      return_tracking:      o.return_tracking_number,
      payout_due_at:        o.payout_due_at,
      payout_released_at:   o.payout_released_at,
      payout_transfer_id:   o.payout_transfer_id,
      payout_frozen:        o.payout_frozen,
      payout_frozen_reason: o.payout_frozen_reason,
      payout_frozen_at:     o.payout_frozen_at,
      payout_blocked_reason:o.payout_blocked_reason,
    };
  });

  return NextResponse.json({ orders: result });
}
