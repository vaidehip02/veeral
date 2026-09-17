import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import ReturnReceived from "@/lib/email/templates/ReturnReceived";
import { validateTrackingNumber } from "@/lib/rentals/validateTracking";
import { getLateFeeSettings, computeLateFee, computeDaysOverdue } from "@/lib/rentals/lateFee";
import { stripe } from "@/lib/stripe";

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

  const admin = createAdminClient();

  // Verify this order belongs to this buyer and is an active rental
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, seller_id, status, rental_end, deposit_amount, deposit_payment_intent_id, listing:listings(title, rent_price)")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .not("rental_start", "is", null)
    .in("status", ["paid", "shipped", "delivered"])
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found or not eligible" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // ── Late fee: charge immediately at return time ────────────────────
  const lfSettings  = await getLateFeeSettings();
  const overdueDays = computeDaysOverdue(order.rental_end, now, lfSettings.gracePeriodDays);
  const depositCents = (order as { deposit_amount?: number }).deposit_amount ?? 0;
  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const rentPricePerDay = (listing as { rent_price?: number } | null)?.rent_price ?? 0;
  const rawLateFee  = computeLateFee(rentPricePerDay, overdueDays, lfSettings);
  const lateFee     = Math.min(rawLateFee, depositCents); // cap at deposit
  const renterRefund = Math.max(0, depositCents - lateFee);

  // Immediately partial-refund the non-late-fee portion of the deposit to the buyer
  let depositPartiallySettled = false;
  if (depositCents > 0 && lateFee > 0) {
    const piId = (order as { deposit_payment_intent_id?: string | null }).deposit_payment_intent_id;
    if (piId && renterRefund > 0) {
      try {
        await stripe.refunds.create(
          {
            payment_intent: piId,
            amount: renterRefund,
            reason: "requested_by_customer",
            metadata: { order_id: orderId, release_reason: `late_fee_${overdueDays}_days` },
          },
          { idempotencyKey: `late_fee_refund_${orderId}` },
        );
        depositPartiallySettled = true;
      } catch (err) {
        console.error("[mark-returned] Late fee partial refund error:", err);
        // Non-fatal — continue, seller confirm-return will handle deposit
      }
    } else if (renterRefund === 0) {
      // Entire deposit kept as late fee — nothing to refund
      depositPartiallySettled = true;
    }
  }

  // ── Update order ──────────────────────────────────────────────────
  const updatePayload: Record<string, unknown> = {
    status:                 "return_pending",
    return_noted_at:        now,
    return_tracking_number: tracking_number?.trim() || null,
    late_fee_cents:         lateFee,
    late_fee_days:          overdueDays,
  };

  // If late fee settled the deposit, mark it so confirm-return skips re-processing
  if (depositPartiallySettled && lateFee >= depositCents) {
    updatePayload.deposit_refund_processed = true;
    updatePayload.deposit_release_amount   = renterRefund;
    updatePayload.deposit_release_reason   = `late fee: ${overdueDays} day${overdueDays !== 1 ? "s" : ""} overdue`;
    updatePayload.deposit_released_at      = now;
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateErr) {
    console.error("[mark-returned] Update error:", updateErr);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  // ── Email seller ──────────────────────────────────────────────────
  admin.auth.admin.getUserById(order.seller_id).then(({ data }) => {
    const sellerEmail = data.user?.email;
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

  return NextResponse.json({
    ok: true,
    lateFee,
    overdueDays,
    renterRefund,
  });
}
