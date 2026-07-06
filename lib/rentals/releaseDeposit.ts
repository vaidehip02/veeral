/**
 * releaseDeposit — the single place that moves deposit money.
 *
 * Safety guarantees:
 *  1. Idempotency guard: if deposit_refund_processed is already true we return
 *     ok immediately without touching Stripe again.
 *  2. Stripe idempotency keys: even if we call Stripe twice due to a retry,
 *     Stripe deduplicates — no double-refund, no double-transfer.
 *  3. DB is only marked processed AFTER every Stripe call succeeds.
 *     If a Stripe call fails the function returns an error and leaves the
 *     order retryable (processed stays false).
 *  4. If the seller transfer fails AFTER the renter refund already succeeded,
 *     we surface a specific error message telling the admin to complete the
 *     transfer manually in the Stripe dashboard. The idempotency key means
 *     a retry will safely re-attempt only the transfer (refund is a no-op).
 */

import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SellerTransfer {
  /** Cents to transfer to seller's Stripe Connect account. */
  amountCents: number;
  /** Seller's Stripe Express account id (acct_xxx). */
  connectedAccountId: string;
}

export interface ReleaseTracking {
  lateFeeAmountCents: number;
  daysOverdue: number;
  damageRetainCents: number;
}

export interface ReleaseDepositParams {
  orderId: string;
  /** Cents to refund to the renter. Pass 0 for retain-all (no renter refund). */
  renterRefundCents: number;
  /** Plain-English reason stored in the DB and Stripe metadata. */
  reason: string;
  /** If set, transfer this amount to the seller's Connect account. */
  sellerTransfer?: SellerTransfer;
  /** Optional breakdown stored in the orders table for display purposes. */
  tracking?: ReleaseTracking;
}

export interface ReleaseResult {
  ok: boolean;
  error?: string;
  /** Set when the release succeeded but requires manual follow-up (e.g. no connected account). */
  warning?: string;
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function releaseDeposit(params: ReleaseDepositParams): Promise<ReleaseResult> {
  const { orderId, renterRefundCents, reason, sellerTransfer, tracking } = params;
  const admin = createAdminClient();

  // ── Fetch order ───────────────────────────────────────────────────
  const { data: order, error: fetchErr } = await admin
    .from("orders")
    .select("id, deposit_amount, deposit_payment_intent_id, deposit_refund_processed")
    .eq("id", orderId)
    .single();

  if (fetchErr || !order) {
    return { ok: false, error: "Order not found" };
  }

  // ── Idempotency guard — never process twice ───────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((order as any).deposit_refund_processed === true) {
    return { ok: true }; // already settled — safe no-op
  }

  const depositCents = (order as { deposit_amount?: number }).deposit_amount ?? 0;

  if (renterRefundCents > depositCents) {
    return { ok: false, error: "Refund amount exceeds deposit" };
  }

  let refundStripeId: string | null = null;
  let transferStripeId: string | null = null;

  // ── Step 1 — Refund renter ────────────────────────────────────────
  // Skip if renterRefundCents is 0 (retain-all / full-late-fee scenarios).
  if (renterRefundCents > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const piId = (order as any).deposit_payment_intent_id as string | null;
    if (!piId) {
      return { ok: false, error: "No deposit payment intent on record" };
    }
    try {
      const refund = await stripe.refunds.create(
        {
          payment_intent: piId,
          amount: renterRefundCents,
          reason: "requested_by_customer",
          metadata: { order_id: orderId, release_reason: reason },
        },
        // Idempotency key: Stripe returns the same refund object on retries.
        { idempotencyKey: `deposit_refund_${orderId}` },
      );
      refundStripeId = refund.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[releaseDeposit] Stripe refund error:", msg);
      return { ok: false, error: `Stripe refund failed: ${msg}` };
    }
  }

  // ── Step 2 — Transfer retained amount to seller ───────────────────
  // Covers late fee + damage retain (or the full deposit for retain-all).
  let warning: string | undefined;
  if (sellerTransfer && sellerTransfer.amountCents > 0) {
    try {
      const transfer = await stripe.transfers.create(
        {
          amount: sellerTransfer.amountCents,
          currency: "usd",
          destination: sellerTransfer.connectedAccountId,
          metadata: {
            order_id: orderId,
            reason: "deposit_retain",
            late_fee_cents:     String(tracking?.lateFeeAmountCents ?? 0),
            damage_retain_cents: String(tracking?.damageRetainCents ?? 0),
          },
        },
        // Idempotency key: safe to retry — Stripe deduplicates.
        { idempotencyKey: `deposit_transfer_${orderId}` },
      );
      transferStripeId = transfer.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[releaseDeposit] Stripe transfer error:", msg);
      // The renter was already refunded. Surface a clear message so an admin
      // can complete the seller transfer manually.
      return {
        ok: false,
        error:
          `Stripe transfer to seller failed: ${msg}. ` +
          `The renter refund (${refundStripeId ?? "none"}) already went through — ` +
          `please transfer $${(sellerTransfer.amountCents / 100).toFixed(2)} to the seller manually in the Stripe dashboard, ` +
          `then mark this order as processed in Supabase (set deposit_refund_processed = true).`,
      };
    }
  }

  // ── Step 3 — Mark processed in DB (only after all Stripe calls) ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, unknown> = {
    deposit_release_amount:    renterRefundCents,
    deposit_release_reason:    reason,
    deposit_released_at:       new Date().toISOString(),
    deposit_refund_processed:  true,
    deposit_refund_stripe_id:  refundStripeId,
    deposit_transfer_stripe_id: transferStripeId,
  };

  if (tracking) {
    updatePayload.late_fee_cents = tracking.lateFeeAmountCents;
    updatePayload.late_fee_days  = tracking.daysOverdue;
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId);

  if (updateErr) {
    console.error("[releaseDeposit] DB update error after successful Stripe calls:", updateErr);
    // Money moved — flag for manual reconciliation rather than surfacing as hard failure.
    return {
      ok: true,
      warning:
        `Stripe calls succeeded (refund: ${refundStripeId}, transfer: ${transferStripeId}) ` +
        `but DB update failed. Please manually set deposit_refund_processed = true on order ${orderId}.`,
    };
  }

  return { ok: true, warning };
}
