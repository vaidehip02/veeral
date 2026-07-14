import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseDeposit } from "@/lib/rentals/releaseDeposit";
import { getLateFeeSettings, computeLateFee, computeDaysOverdue } from "@/lib/rentals/lateFee";
import { reviewWindowLapsed } from "@/lib/rentals/businessDays";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import DepositReleased from "@/lib/email/templates/DepositReleased";
import { stripe } from "@/lib/stripe";

/**
 * GET /api/rentals/process-auto-release
 *
 * Finds all rentals in return_pending whose 5-business-day review window has
 * lapsed and releases the full deposit (minus any late fee) automatically.
 *
 * Safe to call repeatedly — guarded by deposit_refund_processed idempotency.
 * Protected by CRON_SECRET env var; set that on Vercel and call daily.
 */
export async function GET(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now   = new Date();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawOrders, error } = await (admin as any)
    .from("orders")
    .select(`
      id, buyer_id, seller_id, deposit_amount, return_noted_at, rental_end,
      seller_payout, shipping_cents, payout_released_at,
      listing:listings(title, rent_price)
    `)
    .eq("type", "rent")
    .eq("status", "return_pending");

  if (error) {
    console.error("[auto-release] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const orders = (rawOrders ?? []) as Array<{
    id: string;
    buyer_id: string;
    seller_id: string;
    deposit_amount: number | null;
    return_noted_at: string | null;
    rental_end: string | null;
    seller_payout: number | null;
    shipping_cents: number | null;
    payout_released_at: string | null;
    listing: { title?: string; rent_price?: number } | { title?: string; rent_price?: number }[] | null;
  }>;

  const lapsed = orders.filter(o => {
    if (!o.return_noted_at) return false;
    return reviewWindowLapsed(new Date(o.return_noted_at), now);
  });

  const lfSettings = await getLateFeeSettings();
  let released = 0;
  const errors: string[] = [];

  for (const order of lapsed) {
    const depositCents  = order.deposit_amount ?? 0;
    const listing       = Array.isArray(order.listing) ? order.listing[0] : order.listing;
    const itemTitle     = (listing as { title?: string } | null)?.title ?? "your rental";
    const rentPricePerDay = (listing as { rent_price?: number } | null)?.rent_price ?? 0;

    const overdueDays = computeDaysOverdue(order.rental_end, order.return_noted_at);
    const rawLateFee  = computeLateFee(rentPricePerDay, overdueDays, lfSettings);
    const lateFee     = Math.min(rawLateFee, depositCents);
    const renterRefund = Math.max(0, depositCents - lateFee);
    const sellerAmount = depositCents - renterRefund;

    // Look up seller's connected Stripe account
    const { data: sellerProfile } = await admin
      .from("seller_profiles")
      .select("stripe_account_id")
      .eq("id", order.seller_id)
      .single();
    const connectedAccountId = (sellerProfile as { stripe_account_id?: string } | null)?.stripe_account_id ?? null;

    const releaseReason = overdueDays > 0
      ? `auto-released: review window lapsed — ${overdueDays} day${overdueDays !== 1 ? "s" : ""} late`
      : "auto-released: review window lapsed";

    const result = await releaseDeposit({
      orderId:           order.id,
      renterRefundCents: renterRefund,
      reason:            releaseReason,
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
      errors.push(`${order.id}: ${result.error}`);
      continue;
    }

    await admin
      .from("orders")
      .update({ status: "deposit_released" })
      .eq("id", order.id);

    released++;

    // ── Transfer rental fee if not already paid out ────────────────
    if (!order.payout_released_at && connectedAccountId) {
      const rentalFeePayoutCents = (order.seller_payout ?? 0) + (order.shipping_cents ?? 0);
      if (rentalFeePayoutCents > 0) {
        try {
          const transfer = await stripe.transfers.create(
            { amount: rentalFeePayoutCents, currency: "usd", destination: connectedAccountId,
              metadata: { order_id: order.id, reason: "rental_fee_auto_release" } },
            { idempotencyKey: `rental_fee_${order.id}` },
          );
          await admin.from("orders").update({
            payout_released_at: now.toISOString(),
            payout_transfer_id: transfer.id,
          }).eq("id", order.id);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[auto-release] Rental fee transfer failed:", order.id, msg);
          errors.push(`rental_fee_transfer ${order.id}: ${msg}`);
        }
      }
    }

    // Email buyer (fire-and-forget)
    admin.auth.admin.getUserById(order.buyer_id).then(({ data }) => {
      const buyerEmail = data.user?.email;
      if (!buyerEmail) return;

      const lateNote = overdueDays > 0
        ? ` A late fee of $${(lateFee / 100).toFixed(2)} was applied for ${overdueDays} day${overdueDays !== 1 ? "s" : ""} late return.`
        : "";

      sendEmail({
        to: buyerEmail,
        subject: `Deposit automatically released — ${itemTitle}`,
        react: createElement(DepositReleased, {
          itemTitle,
          depositAmount: renterRefund / 100,
          reason:
            `The seller's 5-day review window lapsed without action, so your deposit was automatically released.` +
            lateNote,
          orderId: order.id.slice(0, 8).toUpperCase(),
        }),
      }).catch(err => console.error("[auto-release] Email error:", err));
    });
  }

  return NextResponse.json({
    checked:  orders.length,
    lapsed:   lapsed.length,
    released,
    errors:   errors.length > 0 ? errors : undefined,
  });
}
