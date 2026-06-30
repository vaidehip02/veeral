import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ReleaseResult {
  ok: boolean;
  error?: string;
}

export async function releaseDeposit(
  orderId: string,
  refundAmountCents: number,
  reason: string,
): Promise<ReleaseResult> {
  const admin = createAdminClient();

  const { data: order, error: fetchErr } = await admin
    .from("orders")
    .select("id, deposit_amount, deposit_payment_intent_id, status")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    return { ok: false, error: "Order not found" };
  }

  const depositCents = order.deposit_amount ?? 0;
  if (refundAmountCents > depositCents) {
    return { ok: false, error: "Refund amount exceeds deposit" };
  }

  // Skip Stripe refund if there's nothing to refund or no PI on file.
  // (retain_all path — amount is 0 — passes through cleanly.)
  if (refundAmountCents > 0) {
    if (!order.deposit_payment_intent_id) {
      return { ok: false, error: "No deposit payment intent on record" };
    }
    try {
      await stripe.refunds.create({
        payment_intent: order.deposit_payment_intent_id,
        amount: refundAmountCents,
        reason: "requested_by_customer",
        metadata: { order_id: orderId, release_reason: reason },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[releaseDeposit] Stripe refund error:", msg);
      return { ok: false, error: `Stripe refund failed: ${msg}` };
    }
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      deposit_release_amount:   refundAmountCents,
      deposit_release_reason:   reason,
      deposit_released_at:      new Date().toISOString(),
      deposit_refund_processed: refundAmountCents > 0,
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("[releaseDeposit] DB update error:", updateErr);
    return { ok: false, error: "Stripe refund succeeded but DB update failed" };
  }

  return { ok: true };
}
