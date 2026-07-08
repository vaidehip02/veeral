import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import ReturnReceived from "@/lib/email/templates/ReturnReceived";
import { validateTrackingNumber } from "@/lib/rentals/validateTracking";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tracking_number } = (await req.json()) as { tracking_number?: string };
  const { orderId } = params;

  const trackingValidation = validateTrackingNumber(tracking_number ?? "");
  if (!trackingValidation.valid) {
    return NextResponse.json({ error: trackingValidation.error }, { status: 400 });
  }

  // Verify this order belongs to this buyer and is an active rental
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, seller_id, status, listing:listings(title)")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .not("rental_start", "is", null)
    .in("status", ["paid", "shipped", "delivered"])
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found or not eligible" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("orders")
    .update({
      status:                 "return_pending",
      return_noted_at:        new Date().toISOString(),
      return_tracking_number: tracking_number?.trim() || null,
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("[mark-returned] Update error:", updateErr);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  // Email the seller (fire-and-forget)
  const admin = createAdminClient();
  admin.auth.admin.getUserById(order.seller_id).then(({ data }) => {
    const sellerEmail = data.user?.email;
    const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
    const itemTitle = (listing as { title?: string } | null)?.title ?? "your item";
    if (sellerEmail) {
      sendEmail({
        to: sellerEmail,
        subject: `Return received — ${itemTitle}`,
        react: createElement(ReturnReceived, {
          itemTitle,
          trackingNumber: tracking_number?.trim(),
          orderId: orderId.slice(0, 8).toUpperCase(),
        }),
      }).catch(err => console.error("[mark-returned] Email error:", err));
    }
  });

  return NextResponse.json({ ok: true });
}
