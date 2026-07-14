import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tracking = (body.tracking ?? "").trim();
  if (!tracking) return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Fetch the order and verify the authenticated user is the seller
  const { data: order } = await admin
    .from("orders")
    .select("id, status, seller_id")
    .eq("id", params.id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.seller_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "paid") return NextResponse.json({ error: "Order cannot be marked as shipped in its current status" }, { status: 409 });

  // Compute payout_due_at from platform_settings.payout_hold_days
  const { data: settings } = await admin
    .from("platform_settings")
    .select("payout_hold_days")
    .eq("id", 1)
    .single() as { data: { payout_hold_days?: number } | null };
  const holdDays   = settings?.payout_hold_days ?? 14;
  const payoutDueAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString();

  // Fetch listing_id before updating so we can mark it sold
  const { data: fullOrder } = await admin
    .from("orders")
    .select("listing_id")
    .eq("id", params.id)
    .single();

  const { error } = await admin
    .from("orders")
    .update({ status: "shipped", return_tracking_number: tracking, payout_due_at: payoutDueAt })
    .eq("id", params.id)
    .eq("status", "paid"); // idempotency guard

  if (error) return NextResponse.json({ error: "Failed to update order" }, { status: 500 });

  // Mark listing as sold so it no longer appears in browse/search
  if (fullOrder?.listing_id) {
    await admin.from("listings").update({ status: "sold" }).eq("id", fullOrder.listing_id);
  }

  return NextResponse.json({ ok: true, payoutDueAt });
}
