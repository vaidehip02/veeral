import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/orders/process-payout-release
 *
 * Daily cron that finds sale orders whose payout hold window has elapsed and
 * transfers the seller's share from Veeral's Stripe balance to their connected account.
 *
 * Eligibility: status IN ('shipped','delivered'), payout_due_at <= now,
 *              payout_released_at IS NULL, payout_frozen = false.
 *
 * If the seller hasn't completed Stripe onboarding, the transfer is skipped and
 * payout_blocked_reason is set. The cron retries daily until they onboard.
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db    = admin as any;
  const now   = new Date().toISOString();

  const { data: rawOrders, error } = await db
    .from("orders")
    .select("id, seller_id, seller_payout, shipping_cents, stripe_payment_intent_id")
    .in("status", ["shipped", "delivered"])
    .in("type", ["sale"])
    .lte("payout_due_at", now)
    .is("payout_released_at", null)
    .eq("payout_frozen", false)
    .not("payout_due_at", "is", null);

  if (error) {
    console.error("[payout-release] Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  interface OrderRow {
    id: string;
    seller_id: string;
    seller_payout: number;
    shipping_cents: number | null;
    stripe_payment_intent_id: string | null;
  }

  const orders   = (rawOrders ?? []) as OrderRow[];
  const released: string[] = [];
  const blocked:  string[] = [];
  const errors:   string[] = [];

  for (const order of orders) {
    // ── Check seller onboarding ─────────────────────────────────────
    const { data: sellerProfile } = await admin
      .from("seller_profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", order.seller_id)
      .single() as { data: { stripe_account_id?: string; stripe_onboarding_complete?: boolean } | null };

    const connectedAccountId = sellerProfile?.stripe_account_id ?? null;
    const onboarded          = !!sellerProfile?.stripe_onboarding_complete;

    if (!connectedAccountId || !onboarded) {
      // Block until seller completes onboarding; retry daily.
      await admin.from("orders").update({ payout_blocked_reason: "seller_not_onboarded" }).eq("id", order.id);
      blocked.push(order.id);
      console.warn("[payout-release] Seller not onboarded, payout blocked:", order.id, order.seller_id);
      continue;
    }

    // ── Transfer seller's share ─────────────────────────────────────
    // Transfer = item price + shipping (seller_payout + shipping_cents).
    // Veeral's fee (platform_fee) was never transferred — stays on platform balance.
    const transferCents = (order.seller_payout ?? 0) + (order.shipping_cents ?? 0);
    if (transferCents <= 0) {
      errors.push(`${order.id}: transfer amount is 0 — skipped`);
      continue;
    }

    try {
      const transfer = await stripe.transfers.create(
        {
          amount:      transferCents,
          currency:    "usd",
          destination: connectedAccountId,
          metadata:    {
            order_id:         order.id,
            reason:           "sale_payout_release",
            seller_payout:    String(order.seller_payout),
            shipping_cents:   String(order.shipping_cents ?? 0),
          },
        },
        { idempotencyKey: `sale_payout_${order.id}` },
      );

      await admin.from("orders").update({
        payout_released_at:    new Date().toISOString(),
        payout_transfer_id:    transfer.id,
        payout_blocked_reason: null,
      }).eq("id", order.id);

      released.push(order.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[payout-release] Transfer failed:", order.id, msg);
      errors.push(`${order.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    checked:   orders.length,
    released:  released.length,
    blocked:   blocked.length,
    errors:    errors.length > 0 ? errors : undefined,
  });
}
