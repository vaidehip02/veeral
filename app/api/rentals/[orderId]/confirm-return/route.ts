import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { getLateFeeSettings, computeLateFee, computeDaysOverdue } from "@/lib/rentals/lateFee";
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
  const admin = createAdminClient();

  // Verify order belongs to this seller and is awaiting confirmation.
  // Use admin client so the join on listings (rent_price) is unrestricted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawOrder, error: orderErr } = await (admin as any)
    .from("orders")
    .select(`
      id, buyer_id, seller_id, deposit_amount, status, type,
      rental_end, return_noted_at,
      listing:listings(title, rent_price)
    `)
    .eq("id", orderId)
    .eq("seller_id", user.id)
    .eq("type", "rent")
    .eq("status", "return_pending")
    .single();

  if (orderErr || !rawOrder) {
    return NextResponse.json({ error: "Order not found or not eligible" }, { status: 404 });
  }

  const order = rawOrder as {
    id: string;
    buyer_id: string;
    seller_id: string;
    deposit_amount: number | null;
    rental_end: string | null;
    return_noted_at: string | null;
    listing: { title: string; rent_price: number } | { title: string; rent_price: number }[] | null;
  };

  const depositCents  = order.deposit_amount ?? 0;
  const listing       = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const itemTitle     = (listing as { title?: string } | null)?.title ?? "your rental";
  const rentPricePerDay = (listing as { rent_price?: number } | null)?.rent_price ?? 0;

  // ── Late-fee calculation ──────────────────────────────────────────
  const lfSettings  = await getLateFeeSettings();
  const overdueDays = computeDaysOverdue(order.rental_end, order.return_noted_at);
  const rawLateFee  = computeLateFee(rentPricePerDay, overdueDays, lfSettings);
  const lateFee     = Math.min(rawLateFee, depositCents); // cap at deposit

  const renterRefund = Math.max(0, depositCents - lateFee);
  const sellerAmount = depositCents - renterRefund; // = lateFee (capped)

  // ── Seller's Stripe Connect account ──────────────────────────────
  const { data: sellerProfile } = await admin
    .from("seller_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const connectedAccountId = (sellerProfile as { stripe_account_id?: string } | null)?.stripe_account_id ?? null;

  // ── Release deposit ───────────────────────────────────────────────
  const releaseReason = overdueDays > 0
    ? `returned in good condition — ${overdueDays} day${overdueDays !== 1 ? "s" : ""} late`
    : "returned in good condition";

  const result = await releaseDeposit({
    orderId,
    renterRefundCents: renterRefund,
    reason: releaseReason,
    sellerTransfer: connectedAccountId && sellerAmount > 0
      ? { amountCents: sellerAmount, connectedAccountId }
      : undefined,
    tracking: {
      lateFeeAmountCents: lateFee,
      daysOverdue:        overdueDays,
      damageRetainCents:  0,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.warning) {
    console.warn("[confirm-return] releaseDeposit warning:", result.warning);
  }

  // ── Update order status ───────────────────────────────────────────
  await admin
    .from("orders")
    .update({ status: "deposit_released" })
    .eq("id", orderId);

  // ── Email buyer (fire-and-forget) ─────────────────────────────────
  admin.auth.admin.getUserById(order.buyer_id).then(({ data }) => {
    const buyerEmail = data.user?.email;
    if (!buyerEmail) return;

    const depositLine = overdueDays > 0
      ? `The seller confirmed the item was returned in good condition. ` +
        `A late fee of $${(lateFee / 100).toFixed(2)} was applied for ${overdueDays} day${overdueDays !== 1 ? "s" : ""} late return. ` +
        `You will receive $${(renterRefund / 100).toFixed(2)} back.`
      : "The seller confirmed the item was returned in good condition.";

    sendEmail({
      to: buyerEmail,
      subject: `Deposit released — ${itemTitle}`,
      react: createElement(DepositReleased, {
        itemTitle,
        depositAmount: renterRefund / 100,
        reason: depositLine,
        orderId: orderId.slice(0, 8).toUpperCase(),
      }),
    }).catch(err => console.error("[confirm-return] Email error:", err));
  });

  return NextResponse.json({
    ok:                 true,
    renterRefundCents:  renterRefund,
    lateFee,
    overdueDays,
    warning:            result.warning,
  });
}
