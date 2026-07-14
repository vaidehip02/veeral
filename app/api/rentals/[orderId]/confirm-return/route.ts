import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { getLateFeeSettings, computeLateFee, computeDaysOverdue } from "@/lib/rentals/lateFee";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import DepositReleased from "@/lib/email/templates/DepositReleased";
import { stripe } from "@/lib/stripe";

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
  const overdueDays = computeDaysOverdue(order.rental_end, order.return_noted_at, lfSettings.gracePeriodDays);
  const rawLateFee  = computeLateFee(rentPricePerDay, overdueDays, lfSettings);
  const lateFee     = Math.min(rawLateFee, depositCents); // cap at deposit

  const renterRefund = Math.max(0, depositCents - lateFee);
  const sellerAmount = depositCents - renterRefund; // = lateFee (capped)

  // ── Seller's Stripe Connect account + rental fee payout amount ───
  const [{ data: sellerProfile }, { data: rentalOrder }] = await Promise.all([
    admin.from("seller_profiles").select("stripe_account_id, stripe_onboarding_complete").eq("id", user.id).single(),
    admin.from("orders").select("seller_payout, shipping_cents, payout_released_at").eq("id", orderId).single(),
  ]);

  const connectedAccountId   = (sellerProfile as { stripe_account_id?: string } | null)?.stripe_account_id ?? null;
  const sellerOnboarded      = !!(sellerProfile as { stripe_onboarding_complete?: boolean } | null)?.stripe_onboarding_complete;
  const rentalFeePayoutCents = ((rentalOrder as { seller_payout?: number } | null)?.seller_payout ?? 0)
                             + ((rentalOrder as { shipping_cents?: number | null } | null)?.shipping_cents ?? 0);
  const rentalFeePaidOut     = !!(rentalOrder as { payout_released_at?: string | null } | null)?.payout_released_at;

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

  // ── Transfer rental fee to seller (event-triggered, immediate) ────
  // The deposit has its own review window; the rental fee releases now
  // because the seller has the item back and has inspected it.
  let rentalFeeTransferId: string | null = null;
  if (connectedAccountId && sellerOnboarded && rentalFeePayoutCents > 0 && !rentalFeePaidOut) {
    try {
      const transfer = await stripe.transfers.create(
        {
          amount:      rentalFeePayoutCents,
          currency:    "usd",
          destination: connectedAccountId,
          metadata:    { order_id: orderId, reason: "rental_fee_release" },
        },
        { idempotencyKey: `rental_fee_${orderId}` },
      );
      rentalFeeTransferId = transfer.id;
      await admin.from("orders").update({
        payout_released_at: new Date().toISOString(),
        payout_transfer_id: transfer.id,
        payout_blocked_reason: null,
      }).eq("id", orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[confirm-return] Rental fee transfer failed:", msg);
      // Don't fail the whole request — deposit already released. Log for admin.
    }
  } else if (!rentalFeePaidOut) {
    // Seller not onboarded yet — mark blocked so admin can see it
    await admin.from("orders").update({
      payout_blocked_reason: "seller_not_onboarded",
    }).eq("id", orderId);
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
    ok:                   true,
    renterRefundCents:    renterRefund,
    lateFee,
    overdueDays,
    rentalFeeTransferId,
    warning:              result.warning,
  });
}
