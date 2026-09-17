/**
 * Cron: process-unreturned
 *
 * Runs daily. Finds rentals past their return date with no tracking submitted.
 *   - Day 3+: send buyer + seller reminder email (once per threshold)
 *   - Day 7+: send second reminder (once per threshold)
 *   - Day 14+: charge buyer (item_price - deposit) via saved Stripe customer,
 *              mark order 'unreturned', email both parties
 *
 * Protected by CRON_SECRET header (set in Vercel env → cron config).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email/send";
import { createElement } from "react";
import RentalReminder from "@/lib/email/templates/RentalReminder";
import RentalForcePurchase from "@/lib/email/templates/RentalForcePurchase";

const REMINDER_DAYS = [3, 7] as const;
const FORCE_PURCHASE_DAYS = 14;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Find all active rentals with no tracking submitted, rental_end in the past,
  // and not yet marked unreturned or deposit_released.
  const { data: orders, error } = await admin
    .from("orders")
    .select(`
      id, buyer_id, seller_id,
      rental_end, deposit_amount, buyer_stripe_customer_id,
      unreturned_reminder_sent_day,
      listing:listings(id, title, price)
    `)
    .eq("type", "rent")
    .is("return_tracking_number", null)
    .in("status", ["paid", "shipped", "delivered"])
    .lt("rental_end", now.toISOString());

  if (error) {
    console.error("[process-unreturned] Query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const results = { reminders: 0, charged: 0, errors: 0 };

  for (const order of orders ?? []) {
    try {
      const rentalEnd = new Date(order.rental_end as string);
      const daysOverdue = Math.floor((now.getTime() - rentalEnd.getTime()) / 86400000);
      const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
      const itemTitle = (listing as { title?: string } | null)?.title ?? "your rental";
      const itemPriceCents = (listing as { price?: number } | null)?.price ?? 0;
      const depositCents = (order.deposit_amount as number) ?? 0;
      const orderId = order.id as string;
      const rentalEndFormatted = rentalEnd.toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });

      // Fetch buyer + seller emails
      const [{ data: buyerData }, { data: sellerData }] = await Promise.all([
        admin.auth.admin.getUserById(order.buyer_id as string),
        admin.auth.admin.getUserById(order.seller_id as string),
      ]);
      const buyerEmail = buyerData.user?.email;
      const sellerEmail = sellerData.user?.email;

      // ── Day 14+: force purchase ──────────────────────────────────────────
      if (daysOverdue >= FORCE_PURCHASE_DAYS) {
        const customerId = order.buyer_stripe_customer_id as string | null;
        if (!customerId) {
          console.warn(`[process-unreturned] No stripe customer for order ${orderId} — skipping charge`);
          results.errors++;
          continue;
        }

        // Charge = item price - deposit already collected
        const chargeCents = Math.max(0, itemPriceCents - depositCents);

        // Retrieve customer's saved payment methods
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
        });

        const pm = paymentMethods.data[0];
        if (!pm) {
          console.warn(`[process-unreturned] No saved payment method for customer ${customerId} (order ${orderId})`);
          results.errors++;
          continue;
        }

        // Create and confirm off-session charge
        const pi = await stripe.paymentIntents.create(
          {
            amount:         chargeCents,
            currency:       "usd",
            customer:       customerId,
            payment_method: pm.id,
            off_session:    true,
            confirm:        true,
            description:    `Force purchase — unreturned rental: ${itemTitle}`,
            metadata: {
              order_id:  orderId,
              pi_role:   "unreturned_force_purchase",
              buyer_id:  order.buyer_id as string,
              seller_id: order.seller_id as string,
            },
          },
          { idempotencyKey: `unreturned_charge_${orderId}` },
        );

        // Mark order unreturned
        await admin
          .from("orders")
          .update({
            status:                   "unreturned",
            unreturned_at:            now.toISOString(),
            unreturned_charge_id:     pi.id,
            unreturned_charge_cents:  chargeCents,
          })
          .eq("id", orderId);

        // Email buyer + seller
        const emailPromises = [];
        if (buyerEmail) {
          emailPromises.push(
            sendEmail({
              to: buyerEmail,
              subject: `Purchase completed — ${itemTitle}`,
              react: createElement(RentalForcePurchase, {
                itemTitle,
                orderId: orderId.slice(0, 8).toUpperCase(),
                chargedCents: chargeCents,
                recipientType: "buyer",
              }),
            }),
          );
        }
        if (sellerEmail) {
          emailPromises.push(
            sendEmail({
              to: sellerEmail,
              subject: `Item not returned — ${itemTitle}`,
              react: createElement(RentalForcePurchase, {
                itemTitle,
                orderId: orderId.slice(0, 8).toUpperCase(),
                chargedCents: chargeCents,
                recipientType: "seller",
              }),
            }),
          );
        }
        await Promise.allSettled(emailPromises);

        results.charged++;
        continue;
      }

      // ── Day 3 / 7: send reminder (once per threshold) ────────────────────
      const lastReminderDay = (order.unreturned_reminder_sent_day as number | null) ?? 0;

      // Determine if we should send a reminder for the highest applicable threshold
      const targetDay = [...REMINDER_DAYS].reverse().find(
        (d) => daysOverdue >= d && lastReminderDay < d,
      );

      if (targetDay !== undefined) {
        const daysUntilCharge = Math.max(0, FORCE_PURCHASE_DAYS - daysOverdue);
        const emailPromises = [];

        if (buyerEmail) {
          emailPromises.push(
            sendEmail({
              to: buyerEmail,
              subject: `Return your rental — ${itemTitle}`,
              react: createElement(RentalReminder, {
                itemTitle,
                orderId: orderId.slice(0, 8).toUpperCase(),
                rentalEndDate: rentalEndFormatted,
                daysOverdue,
                daysUntilCharge,
                recipientType: "buyer",
              }),
            }),
          );
        }
        if (sellerEmail) {
          emailPromises.push(
            sendEmail({
              to: sellerEmail,
              subject: `Item not yet returned — ${itemTitle}`,
              react: createElement(RentalReminder, {
                itemTitle,
                orderId: orderId.slice(0, 8).toUpperCase(),
                rentalEndDate: rentalEndFormatted,
                daysOverdue,
                daysUntilCharge,
                recipientType: "seller",
              }),
            }),
          );
        }
        await Promise.allSettled(emailPromises);

        await admin
          .from("orders")
          .update({ unreturned_reminder_sent_day: targetDay })
          .eq("id", orderId);

        results.reminders++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[process-unreturned] Error on order ${order.id}:`, msg);
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, processed: orders?.length ?? 0, ...results });
}
