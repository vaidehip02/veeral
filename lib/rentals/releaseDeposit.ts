import { createAdminClient } from "@/lib/supabase/admin";

export interface ReleaseResult {
  ok: boolean;
  error?: string;
}

/**
 * Records a deposit release decision in the database.
 *
 * IMPORTANT: This function does NOT move real money. The Stripe refund is
 * stubbed out below — deposit_refund_processed is always left false until
 * the Stripe call is wired in a future task.
 */
export async function releaseDeposit(
  orderId: string,
  refundAmountCents: number,
  reason: string,
): Promise<ReleaseResult> {
  const admin = createAdminClient();

  // Fetch the order to validate the deposit amount
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

  // TODO[STRIPE]: refund refundAmountCents of the deposit to the buyer using
  // the stored deposit PaymentIntent id. Uncomment once Stripe is wired:
  //
  // await stripe.refunds.create({
  //   payment_intent: order.deposit_payment_intent_id,
  //   amount: refundAmountCents,
  // });

  // Record the release in the DB.
  // deposit_refund_processed stays false — no real money has moved.
  const { error: updateErr } = await admin
    .from("orders")
    .update({
      deposit_release_amount:    refundAmountCents,
      deposit_release_reason:    reason,
      deposit_released_at:       new Date().toISOString(),
      deposit_refund_processed:  false, // always false until Stripe is wired
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("[releaseDeposit] DB update error:", updateErr);
    return { ok: false, error: "Failed to record deposit release" };
  }

  return { ok: true };
}
