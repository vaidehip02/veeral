import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import DepositReleased from "@/lib/email/templates/DepositReleased";

export async function POST(
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = params;

  // Verify this order belongs to this seller and is awaiting confirmation
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, buyer_id, deposit_amount, status, type, listing:listings(title)")
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .eq("type", "rent")
    .eq("status", "return_pending")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found or not eligible" }, { status: 404 });
  }

  const depositCents = order.deposit_amount ?? 0;

  // Release full deposit — happy path
  const result = await releaseDeposit(orderId, depositCents, "returned in good condition");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Set status
  const { error: statusErr } = await supabase
    .from("orders")
    .update({ status: "deposit_released" })
    .eq("id", orderId);

  if (statusErr) {
    console.error("[confirm-return] Status update error:", statusErr);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }

  // Email the buyer (fire-and-forget)
  const admin = createAdminClient();
  admin.auth.admin.getUserById(order.buyer_id).then(({ data }) => {
    const buyerEmail = data.user?.email;
    const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
    const itemTitle = (listing as { title?: string } | null)?.title ?? "your rental";
    if (buyerEmail) {
      sendEmail({
        to: buyerEmail,
        subject: `Deposit released — ${itemTitle}`,
        react: createElement(DepositReleased, {
          itemTitle,
          depositAmount: depositCents / 100,
          reason: "The seller confirmed the item was returned in good condition.",
          orderId: orderId.slice(0, 8).toUpperCase(),
        }),
      }).catch(err => console.error("[confirm-return] Email error:", err));
    }
  });

  return NextResponse.json({ ok: true });
}
