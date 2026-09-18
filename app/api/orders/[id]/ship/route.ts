import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import ItemShipped from "@/lib/email/templates/ItemShipped";

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
  if (!["paid", "active", "pending"].includes(order.status)) return NextResponse.json({ error: "Order cannot be marked as shipped in its current status" }, { status: 409 });

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
    .in("status", ["paid", "active", "pending"]); // idempotency guard

  if (error) return NextResponse.json({ error: "Failed to update order" }, { status: 500 });

  // Mark listing as sold so it no longer appears in browse/search
  if (fullOrder?.listing_id) {
    await admin.from("listings").update({ status: "sold" }).eq("id", fullOrder.listing_id);
  }

  // Email buyer: your order has shipped
  const { data: orderDetails } = await admin
    .from("orders")
    .select("buyer_id, shipping_address, listing:listings(title), seller:seller_profiles(display_name)")
    .eq("id", params.id)
    .single();

  if (orderDetails) {
    admin.auth.admin.getUserById(orderDetails.buyer_id).then(({ data }: { data: { user?: { email?: string; user_metadata?: { full_name?: string } } | null } }) => {
      const buyerEmail = data.user?.email;
      const buyerName = data.user?.user_metadata?.full_name ?? buyerEmail ?? "Valued customer";
      const listing = Array.isArray(orderDetails.listing) ? orderDetails.listing[0] : orderDetails.listing;
      const itemTitle = (listing as { title?: string } | null)?.title ?? "your item";
      const sellerProfile = Array.isArray(orderDetails.seller) ? orderDetails.seller[0] : orderDetails.seller;
      const sellerDisplayName = (sellerProfile as { display_name?: string } | null)?.display_name ?? "Your seller";
      if (buyerEmail) {
        sendEmail({
          to: buyerEmail,
          subject: `Your order has shipped — ${itemTitle}`,
          react: createElement(ItemShipped, {
            orderId: params.id.slice(0, 8).toUpperCase(),
            buyerName,
            itemTitle,
            trackingNumber: tracking,
            sellerDisplayName,
            shippingAddress: orderDetails.shipping_address ?? undefined,
          }),
        }).catch(err => console.error("[ship] Email error:", err));
      }
    });
  }

  return NextResponse.json({ ok: true, payoutDueAt });
}
