import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import BuyerReceipt from "@/lib/email/templates/BuyerReceipt";
import SellerSaleAlert from "@/lib/email/templates/SellerSaleAlert";
import RentalReceipt from "@/lib/email/templates/RentalReceipt";
import RentalSellerAlert from "@/lib/email/templates/RentalSellerAlert";
import Stripe from "stripe";

// Node runtime required — Edge runtime doesn't support the raw-body + crypto
// path that Stripe's signature verification depends on.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Always use the admin client in webhooks — no browser session / cookies here.
  const admin = createAdminClient();

  switch (event.type) {
    // ── Payment succeeded ─────────────────────────────────────────────────────
    case "payment_intent.succeeded": {
      const pi      = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      const piRole  = pi.metadata?.pi_role ?? "sale";

      if (!orderId) {
        console.warn("[webhook] payment_intent.succeeded missing order_id metadata", pi.id);
        break;
      }

      if (piRole === "deposit") {
        // ── Deposit PI succeeded ────────────────────────────────────────────
        // Mark deposit as held. Use deposit_held = false as the idempotency
        // guard so re-delivered events are a no-op.
        const { error } = await admin
          .from("orders")
          .update({ deposit_held: true })
          .eq("id", orderId)
          .eq("deposit_held", false); // idempotency guard

        if (error) {
          console.error("[webhook] deposit_held update error:", orderId, error);
        }
        // Do NOT change order status or send email — the rental_fee PI handles that.

      } else {
        // ── Sale or rental_fee PI succeeded ────────────────────────────────
        // Guard on status = 'pending' so re-delivered events are a no-op.
        const { data: updated, error } = await admin
          .from("orders")
          .update({
            status:                    "paid",
            stripe_payment_intent_id:  pi.id,
            paid_at:                   new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("status", "pending")  // idempotency guard — only transition from pending
          .select("id")
          .single();

        if (error) {
          console.error("[webhook] order paid update error:", orderId, error);
          break;
        }

        if (!updated) {
          // Row was not in 'pending' — event already processed, skip email.
          console.log("[webhook] Skipping duplicate event for order:", orderId);
          break;
        }

        // Capture the actual Stripe processing fee from the balance transaction.
        // Fire-and-forget — failure here must never fail the webhook response.
        if (pi.latest_charge) {
          (async () => {
            try {
              const charge = await stripe.charges.retrieve(pi.latest_charge as string);
              if (charge.balance_transaction) {
                const txn = await stripe.balanceTransactions.retrieve(
                  charge.balance_transaction as string,
                );
                await admin
                  .from("orders")
                  .update({ stripe_processing_fee: txn.fee })
                  .eq("id", orderId);
              }
            } catch (err) {
              console.error("[webhook] Failed to capture Stripe fee:", orderId, err);
            }
          })();
        }

        // Fire-and-forget — email failure must NOT cause a non-200 response
        // (that would make Stripe retry indefinitely).
        sendOrderEmails(orderId).catch((err) =>
          console.error("[webhook] Email send error:", err),
        );
      }
      break;
    }

    // ── Payment failed ────────────────────────────────────────────────────────
    case "payment_intent.payment_failed": {
      const pi      = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;

      if (!orderId) break;

      // Only cancel if still pending — avoid overwriting a paid order if the
      // failure event arrives out-of-order after a later success (rare but possible).
      const { error } = await admin
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("status", "pending");

      if (error) {
        console.error("[webhook] payment_failed update error:", orderId, error);
      }
      break;
    }

    // ── Seller Connect account updated ────────────────────────────────────────
    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      const { error } = await admin
        .from("seller_profiles")
        .update({
          stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
          stripe_payouts_enabled:     account.payouts_enabled ?? false,
        })
        .eq("stripe_account_id", account.id);

      if (error) {
        console.error("[webhook] account.updated error:", account.id, error);
      }
      break;
    }

    default:
      // Log but don't error — Stripe sends many event types we don't handle yet.
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }

  // Always return 200 so Stripe doesn't retry for handled event types.
  return NextResponse.json({ received: true });
}

// ── Send buyer receipt + seller sale/rental alert ─────────────────────────────
async function sendOrderEmails(orderId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(`
      id, buyer_id, seller_id, type,
      amount, platform_fee, seller_payout, deposit_amount,
      shipping_cents, shipping_address, created_at,
      rental_start, rental_end,
      listing:listings ( title ),
      seller:seller_profiles ( display_name )
    `)
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    console.error("[email] Could not fetch order:", orderId, orderErr);
    return;
  }

  const [buyerRes, sellerRes] = await Promise.all([
    admin.auth.admin.getUserById(order.buyer_id),
    admin.auth.admin.getUserById(order.seller_id),
  ]);

  const buyerEmail  = buyerRes.data.user?.email;
  const sellerEmail = sellerRes.data.user?.email;
  const buyerName   = buyerRes.data.user?.user_metadata?.full_name ?? buyerEmail ?? "Valued customer";
  const sellerName  = sellerRes.data.user?.user_metadata?.full_name ?? sellerEmail ?? "Seller";

  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const itemTitle = (listing as { title?: string } | null)?.title ?? "Your item";

  const sellerProfile = Array.isArray(order.seller) ? order.seller[0] : order.seller;
  const sellerDisplayName =
    (sellerProfile as { display_name?: string } | null)?.display_name ?? sellerName;

  const shortId   = orderId.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const grossAmount   = order.amount        / 100;
  const platformFee   = order.platform_fee  / 100;
  const sellerPayout  = order.seller_payout / 100;
  const shippingCost  = (order.shipping_cents ?? 0) / 100;
  const depositAmount = (order.deposit_amount ?? 0) / 100;
  const shippingAddress = (order as { shipping_address?: string | null }).shipping_address ?? undefined;

  if (order.type === "rent") {
    // ── Rental-specific emails ──────────────────────────────────────────────
    const rentalStart = order.rental_start
      ? new Date(order.rental_start).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "";
    const rentalEnd = order.rental_end
      ? new Date(order.rental_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "";
    const rentalDays = order.rental_start && order.rental_end
      ? Math.round((new Date(order.rental_end).getTime() - new Date(order.rental_start).getTime()) / 86400000)
      : 0;
    const total = grossAmount + shippingCost + depositAmount;

    if (buyerEmail) {
      await sendEmail({
        to:      buyerEmail,
        subject: `Rental confirmed — ${itemTitle}`,
        react:   createElement(RentalReceipt, {
          orderId: `#${shortId}`,
          buyerName,
          itemTitle,
          sellerDisplayName,
          rentalStart,
          rentalEnd,
          rentalDays,
          rentalFee:     grossAmount,
          depositAmount,
          total,
          shippingCost,
          orderDate,
          shippingAddress,
        }),
      });
    }

    if (sellerEmail) {
      await sendEmail({
        to:      sellerEmail,
        subject: `Your item has been rented — ${itemTitle}`,
        react:   createElement(RentalSellerAlert, {
          orderId:          `#${shortId}`,
          sellerName:       sellerDisplayName,
          itemTitle,
          buyerDisplayName: buyerName,
          rentalStart,
          rentalEnd,
          rentalDays,
          rentalFee:        grossAmount,
          depositAmount,
          sellerPayout,
          shippingAddress,
        }),
      });
    }

  } else {
    // ── Sale emails ─────────────────────────────────────────────────────────
    const total = grossAmount + shippingCost;

    if (buyerEmail) {
      await sendEmail({
        to:      buyerEmail,
        subject: `Your Veeral receipt — Order #${shortId}`,
        react:   createElement(BuyerReceipt, {
          orderId:           `#${shortId}`,
          buyerName,
          itemTitle,
          itemPrice:         grossAmount,
          shippingCost,
          total,
          sellerDisplayName,
          orderDate,
          shippingAddress,
        }),
      });
    }

    if (sellerEmail) {
      await sendEmail({
        to:      sellerEmail,
        subject: `You made a sale on Veeral — ${itemTitle}`,
        react:   createElement(SellerSaleAlert, {
          orderId:          `#${shortId}`,
          sellerName:       sellerDisplayName,
          itemTitle,
          grossAmount,
          platformFee,
          sellerPayout,
          buyerDisplayName: buyerName,
          orderDate,
          shippingAddress,
        }),
      });
    }
  }
}
