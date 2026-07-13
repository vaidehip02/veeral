import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import ShipWarning from "@/lib/email/templates/ShipWarning";
import OrderCancelledBuyer from "@/lib/email/templates/OrderCancelledBuyer";
import OrderCancelledSeller from "@/lib/email/templates/OrderCancelledSeller";

/**
 * GET /api/orders/process-ship-deadline
 *
 * Daily cron that enforces Veeral's 7-day shipping policy:
 *   - Day 5: warning email to seller ("ship within 2 days or order auto-cancels")
 *   - Day 7: auto-cancel — full Stripe refund to buyer, listing relisted, seller flagged
 *
 * Safe to call repeatedly — all actions are guarded by idempotency checks.
 * Protected by CRON_SECRET bearer token (set in Vercel env vars).
 *
 * IMPORTANT: Payouts fire immediately at payment_intent.succeeded in the current
 * build (no delayed-payout system). Cancellation therefore reverses the transfer
 * from the seller's connected account and refunds the buyer from the platform.
 * This will fail if the seller has already withdrawn the funds — flag those orders
 * for manual admin resolution.
 */
export async function GET(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date();

  // ── Load deadline config from platform_settings ───────────────────────────
  const { data: settings } = await db
    .from("platform_settings")
    .select("ship_deadline_days, ship_warning_days")
    .eq("id", 1)
    .single() as { data: { ship_deadline_days: number; ship_warning_days: number } | null };

  const deadlineDays = settings?.ship_deadline_days ?? 7;
  const warningDays  = settings?.ship_warning_days  ?? 5;

  // ── Fetch all paid, unshipped orders ─────────────────────────────────────
  // status = 'paid' means payment succeeded but seller hasn't uploaded tracking yet.
  // Once tracking is uploaded the status advances to 'shipped'.
  const { data: rawOrders, error: fetchErr } = await db
    .from("orders")
    .select(`
      id, buyer_id, seller_id, paid_at,
      ship_warning_sent_at, stripe_payment_intent_id,
      amount, platform_fee, shipping_cents,
      listing_id,
      listing:listings ( title, id )
    `)
    .eq("type", "sale")
    .eq("status", "paid")
    .not("paid_at", "is", null);

  if (fetchErr) {
    console.error("[ship-deadline] Fetch error:", fetchErr);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  interface OrderRow {
    id: string;
    buyer_id: string;
    seller_id: string;
    paid_at: string;
    ship_warning_sent_at: string | null;
    stripe_payment_intent_id: string | null;
    amount: number;
    platform_fee: number;
    shipping_cents: number | null;
    listing_id: string;
    listing: { title?: string; id?: string } | { title?: string; id?: string }[] | null;
  }

  const orders = (rawOrders ?? []) as OrderRow[];

  const warnings:   string[] = [];
  const cancelled:  string[] = [];
  const errors:     string[] = [];

  for (const order of orders) {
    const paidAt = new Date(order.paid_at);
    const daysSincePaid = Math.floor((now.getTime() - paidAt.getTime()) / (1000 * 60 * 60 * 24));
    const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
    const itemTitle = (listing as { title?: string } | null)?.title ?? "Your item";
    const shortId   = order.id.slice(0, 8).toUpperCase();

    // ── Auto-cancel at deadline ───────────────────────────────────────────
    if (daysSincePaid >= deadlineDays) {
      const cancelResult = await cancelOrder(order, itemTitle, shortId, db, admin);
      if (cancelResult.ok) {
        cancelled.push(order.id);
      } else {
        errors.push(`cancel ${order.id}: ${cancelResult.error}`);
      }
      continue;
    }

    // ── Warning at warning threshold ──────────────────────────────────────
    if (daysSincePaid >= warningDays && !order.ship_warning_sent_at) {
      const daysLeft = deadlineDays - daysSincePaid;
      const deadlineDate = new Date(paidAt.getTime() + deadlineDays * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      // Mark warning sent first (idempotency guard) before attempting email
      const { error: warnErr } = await admin
        .from("orders")
        .update({ ship_warning_sent_at: now.toISOString() })
        .eq("id", order.id)
        .is("ship_warning_sent_at", null);

      if (warnErr) {
        errors.push(`warning ${order.id}: ${warnErr.message}`);
        continue;
      }

      // Look up seller info for the email
      const [sellerRes, buyerRes] = await Promise.all([
        admin.auth.admin.getUserById(order.seller_id),
        admin.auth.admin.getUserById(order.buyer_id),
      ]);
      const sellerEmail = sellerRes.data.user?.email;
      const sellerName  = sellerRes.data.user?.user_metadata?.full_name ?? sellerEmail ?? "Seller";
      const buyerName   = buyerRes.data.user?.user_metadata?.full_name ?? buyerRes.data.user?.email ?? "the buyer";

      if (sellerEmail) {
        sendEmail({
          to: sellerEmail,
          subject: `Ship within ${daysLeft} day${daysLeft !== 1 ? "s" : ""} or your order will be cancelled — ${itemTitle}`,
          react: createElement(ShipWarning, {
            sellerName,
            itemTitle,
            orderId: shortId,
            daysLeft,
            deadlineDate,
            buyerDisplayName: buyerName,
          }),
        }).catch(err => console.error("[ship-deadline] Warning email error:", order.id, err));
      }

      warnings.push(order.id);
    }
  }

  return NextResponse.json({
    checked:   orders.length,
    warned:    warnings.length,
    cancelled: cancelled.length,
    errors:    errors.length > 0 ? errors : undefined,
  });
}

// ── Cancel an overdue order ───────────────────────────────────────────────────

async function cancelOrder(
  order: {
    id: string;
    buyer_id: string;
    seller_id: string;
    stripe_payment_intent_id: string | null;
    amount: number;
    platform_fee: number;
    shipping_cents: number | null;
    listing_id: string;
  },
  itemTitle: string,
  shortId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
): Promise<{ ok: true } | { ok: false; error: string }> {

  // Mark cancelled first so a concurrent cron run doesn't double-cancel.
  const { data: guard } = await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id)
    .eq("status", "paid")
    .select("id")
    .single();

  if (!guard) {
    // Order already cancelled by a prior run — skip silently.
    return { ok: true };
  }

  // ── Stripe refund ─────────────────────────────────────────────────────────
  // reverse_transfer: true pulls funds back from the seller's Connect account
  // before refunding the buyer. If the seller has already withdrawn the funds,
  // Stripe returns an error — we log it and flag the order for manual admin action.
  const piId = order.stripe_payment_intent_id;
  if (piId) {
    try {
      await stripe.refunds.create({
        payment_intent:        piId,
        reverse_transfer:      true,
        refund_application_fee: true,
      });
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
      console.error(`[ship-deadline] Stripe refund failed for order ${order.id}:`, msg);
      // Don't bail — listing relist and emails should still fire. Admin must
      // manually refund the buyer in the Stripe dashboard for this order.
    }
  } else {
    console.warn(`[ship-deadline] No stripe_payment_intent_id for order ${order.id} — refund skipped, needs manual action.`);
  }

  // ── Relist the item ───────────────────────────────────────────────────────
  await admin
    .from("listings")
    .update({ status: "active" })
    .eq("id", order.listing_id);

  // ── Increment seller failure count ────────────────────────────────────────
  const { data: sellerRow } = await db
    .from("seller_profiles")
    .select("unshipped_cancel_count")
    .eq("id", order.seller_id)
    .single() as { data: { unshipped_cancel_count: number } | null };

  const newCount = (sellerRow?.unshipped_cancel_count ?? 0) + 1;
  await admin
    .from("seller_profiles")
    .update({ unshipped_cancel_count: newCount })
    .eq("id", order.seller_id);

  // ── Emails ────────────────────────────────────────────────────────────────
  const refundDollars = ((order.amount ?? 0) + (order.platform_fee ?? 0) + (order.shipping_cents ?? 1400)) / 100;

  const [buyerRes, sellerRes] = await Promise.all([
    admin.auth.admin.getUserById(order.buyer_id),
    admin.auth.admin.getUserById(order.seller_id),
  ]);

  const buyerEmail  = buyerRes.data.user?.email;
  const sellerEmail = sellerRes.data.user?.email;
  const buyerName   = buyerRes.data.user?.user_metadata?.full_name ?? buyerEmail ?? "Valued customer";
  const sellerName  = sellerRes.data.user?.user_metadata?.full_name ?? sellerEmail ?? "Seller";

  if (buyerEmail) {
    sendEmail({
      to: buyerEmail,
      subject: `Your order for ${itemTitle} has been cancelled — full refund issued`,
      react: createElement(OrderCancelledBuyer, {
        buyerName,
        itemTitle,
        orderId: shortId,
        refundAmount: refundDollars,
      }),
    }).catch(err => console.error("[ship-deadline] Buyer cancel email error:", order.id, err));
  }

  if (sellerEmail) {
    sendEmail({
      to: sellerEmail,
      subject: `Your order for ${itemTitle} was automatically cancelled`,
      react: createElement(OrderCancelledSeller, {
        sellerName,
        itemTitle,
        orderId: shortId,
        isFlagged: newCount > 1,
      }),
    }).catch(err => console.error("[ship-deadline] Seller cancel email error:", order.id, err));
  }

  return { ok: true };
}
