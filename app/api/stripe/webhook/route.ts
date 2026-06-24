import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import BuyerReceipt from "@/lib/email/templates/BuyerReceipt";
import SellerSaleAlert from "@/lib/email/templates/SellerSaleAlert";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.order_id;

      if (orderId) {
        const piRole = pi.metadata.pi_role ?? "sale";

        if (piRole === "deposit") {
          // Deposit PI succeeded — mark deposit as captured, don't change order status yet
          // (order status moves to "paid" when the rental_fee PI succeeds)
          await supabase
            .from("orders")
            .update({ deposit_payment_intent_id: pi.id })
            .eq("id", orderId);
        } else {
          // Sale or rental_fee PI succeeded — order is now fully paid
          await supabase
            .from("orders")
            .update({ status: "paid", stripe_payment_intent_id: pi.id })
            .eq("id", orderId);

          sendOrderEmails(orderId).catch((err) =>
            console.error("[webhook] Email send error:", err)
          );
        }
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const onboardingComplete =
        account.details_submitted && account.charges_enabled;
      await supabase
        .from("seller_profiles")
        .update({ stripe_onboarding_complete: onboardingComplete })
        .eq("stripe_account_id", account.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// ── Email helper ──────────────────────────────────────────────────────────────
/**
 * Fetches order details from Supabase and sends two branded emails:
 *   1. A receipt to the buyer
 *   2. A "you made a sale" alert to the seller
 *
 * Uses the service-role admin client so we can read auth.users emails
 * without a logged-in session (webhook runs server-side with no cookies).
 */
async function sendOrderEmails(orderId: string): Promise<void> {
  const admin = createAdminClient();

  // ── Fetch the order with listing + seller profile ────────────────────────
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(`
      id,
      buyer_id,
      seller_id,
      amount,
      platform_fee,
      seller_payout,
      created_at,
      listing:listings ( title ),
      seller:seller_profiles ( display_name )
    `)
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    console.error("[email] Could not fetch order:", orderId, orderErr);
    return;
  }

  // ── Resolve buyer + seller auth emails via admin API ─────────────────────
  const [buyerRes, sellerRes] = await Promise.all([
    admin.auth.admin.getUserById(order.buyer_id),
    admin.auth.admin.getUserById(order.seller_id),  // seller_profiles.id = auth.users.id
  ]);

  const buyerEmail  = buyerRes.data.user?.email;
  const sellerEmail = sellerRes.data.user?.email;

  const buyerName  = buyerRes.data.user?.user_metadata?.full_name  ?? buyerEmail  ?? "Valued customer";
  const sellerName = sellerRes.data.user?.user_metadata?.full_name ?? sellerEmail ?? "Seller";

  // ── Resolve listing title (Supabase join returns an object or array) ──────
  const listing = Array.isArray(order.listing) ? order.listing[0] : order.listing;
  const itemTitle = (listing as { title?: string } | null)?.title ?? "Your item";

  const sellerProfile = Array.isArray(order.seller) ? order.seller[0] : order.seller;
  const sellerDisplayName = (sellerProfile as { display_name?: string } | null)?.display_name ?? sellerName;

  // ── Shared values ─────────────────────────────────────────────────────────
  const shortId   = orderId.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Amounts stored as cents in DB — convert to dollars for display
  const grossAmount  = order.amount        / 100;
  const platformFee  = order.platform_fee  / 100;
  const sellerPayout = order.seller_payout / 100;
  // Shipping is not yet in the DB — hardcode $18 to match the checkout page calculation
  // TODO: store shipping cost in the orders table and read it here
  const shippingCost = 18;
  const total        = grossAmount + shippingCost;

  // ── 1. Buyer receipt ──────────────────────────────────────────────────────
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: `Your Veeral receipt — Order #${shortId}`,
      react: createElement(BuyerReceipt, {
        orderId:           `#${shortId}`,
        buyerName,
        itemTitle,
        itemPrice:         grossAmount,
        shippingCost,
        total,
        sellerDisplayName,
        orderDate,
        // shippingAddress omitted until checkout stores it in the orders table
      }),
    });
  }

  // ── 2. Seller sale alert ──────────────────────────────────────────────────
  if (sellerEmail) {
    await sendEmail({
      to: sellerEmail,
      subject: `You made a sale on Veeral — ${itemTitle}`,
      react: createElement(SellerSaleAlert, {
        orderId:          `#${shortId}`,
        sellerName:       sellerDisplayName,
        itemTitle,
        grossAmount,
        platformFee,
        sellerPayout,
        buyerDisplayName: buyerName,
        orderDate,
        // shippingAddress omitted until checkout stores it in the orders table
      }),
    });
  }
}
