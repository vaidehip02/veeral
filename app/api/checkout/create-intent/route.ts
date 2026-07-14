import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getFeeSettings, calculateFees } from "@/lib/fees";
import { getShippingSettings, resolveTierCents, type ShippingTier } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    listing_id: string;
    type: "sale" | "rent";
    days?: number;
    start_date?: string;
    return_date?: string;
    shipping_address?: string;
  };

  const { listing_id, type } = body;
  if (!listing_id || !type) {
    return NextResponse.json({ error: "Missing listing_id or type" }, { status: 400 });
  }
  if (type === "rent" && (!body.days || !body.start_date || !body.return_date)) {
    return NextResponse.json({ error: "Rental requires days, start_date, return_date" }, { status: 400 });
  }

  // ── Fetch listing + seller ────────────────────────────────────────────────
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, title, price, rent_price, deposit_pct, seller_id, status, type, shipping_tier, shipping_cents")
    .eq("id", listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.status !== "active") {
    return NextResponse.json({ error: "Listing is not available" }, { status: 409 });
  }
  if (type === "rent" && listing.type === "sale") {
    return NextResponse.json({ error: "This listing is not available for rent" }, { status: 400 });
  }

  // ── Fee + shipping settings from platform_settings ───────────────────────
  // NOTE: With separate charges + transfers, no seller Stripe account is needed
  // at checkout — the full payment lands on Veeral's platform balance and the
  // seller's share is transferred later by the payout-release cron.
  // Onboarding is checked at transfer time, not here.
  const [feeSettings, shippingSettings] = await Promise.all([
    getFeeSettings(),
    getShippingSettings(),
  ]);

  // Resolve the listing's chosen shipping tier to cents.
  // Fee is NEVER applied to shipping — only to item/rental cost.
  const SHIPPING_CENTS = resolveTierCents(
    (listing.shipping_tier as ShippingTier | null) ?? null,
    listing.shipping_cents ?? null,
    shippingSettings,
  );

  // ── Compute amounts (all in cents) ────────────────────────────────────────
  // Deposit is based on the item's listed price regardless of transaction type.
  // Fee applies ONLY to the item/rental cost — never to shipping or deposit.
  const depositPct = listing.deposit_pct ?? 40;

  let itemCents      = 0;
  let rentalFeeCents = 0;
  let depositCents   = 0;

  if (type === "rent") {
    rentalFeeCents = (listing.rent_price ?? 0) * (body.days ?? 1) * 100;
    depositCents   = Math.round(listing.price * depositPct / 100) * 100;
  } else {
    itemCents = listing.price * 100;
  }

  // subtotalCents = item/rental cost only (not shipping, not deposit)
  const subtotalCents = type === "rent" ? rentalFeeCents : itemCents;
  const fees = calculateFees(subtotalCents, type, feeSettings);

  // ── Create pending order row ──────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      listing_id,
      buyer_id:    user.id,
      seller_id:   listing.seller_id,
      type,
      amount:         subtotalCents,
      platform_fee:   fees.applicationFee,
      seller_payout:  fees.sellerReceives,
      deposit_amount: type === "rent" ? depositCents : null,
      status:           "pending",
      shipping_cents:   SHIPPING_CENTS,
      shipping_address: body.shipping_address ?? null,
      ...(type === "rent" && {
        rental_start: body.start_date,
        rental_end:   body.return_date,
      }),
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error("[checkout] Order insert error:", orderErr);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const orderId = order.id;

  try {
    if (type === "rent") {
      // ── TWO PaymentIntents for rental ──────────────────────────────────────
      // PI 1: rental cost + Veeral fee + shipping.
      //        No transfer_data — funds land on Veeral's platform balance.
      //        Seller's share is transferred by confirm-return or process-auto-release.
      // PI 2: deposit — no transfer, no fee, platform-held until return confirmed.
      // platform_fee is recorded on the order for internal accounting only.

      const rentalPi = await stripe.paymentIntents.create({
        // Buyer pays: rental cost + fee + shipping
        amount:   rentalFeeCents + fees.feeAmount + SHIPPING_CENTS,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        // No application_fee_amount / transfer_data — separate charges model.
        metadata: {
          order_id:    orderId,
          pi_role:     "rental_fee",
          listing_id,
          buyer_id:    user.id,
          seller_id:   listing.seller_id,
          fee_pct:     String(fees.feePct),
        },
      });

      const depositPi = await stripe.paymentIntents.create({
        amount:   depositCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        // No application_fee_amount — deposit is fully refundable, no Veeral cut.
        // No transfer_data — stays on platform until return is confirmed.
        metadata: {
          order_id:    orderId,
          pi_role:     "deposit",
          listing_id,
          buyer_id:    user.id,
          seller_id:   listing.seller_id,
        },
      });

      await admin
        .from("orders")
        .update({ deposit_payment_intent_id: depositPi.id })
        .eq("id", orderId);

      return NextResponse.json({
        orderId,
        rentalClientSecret:  rentalPi.client_secret,
        depositClientSecret: depositPi.client_secret,
        // Expose fee pct so the UI can confirm it matches
        feePct: fees.feePct,
        amounts: {
          rentalFee:    rentalFeeCents,
          veeralFee:    fees.feeAmount,
          shipping:     SHIPPING_CENTS,
          deposit:      depositCents,
          commission:   fees.applicationFee,
          sellerPayout: fees.sellerReceives,
        },
      });

    } else {
      // ── Single PaymentIntent for sale ──────────────────────────────────────
      // Buyer pays: item price + Veeral fee + shipping.
      // No transfer_data — funds land on Veeral's platform balance.
      // Seller's share is transferred by process-payout-release after hold window.
      // platform_fee is recorded on the order for internal accounting only.

      const pi = await stripe.paymentIntents.create({
        amount:   itemCents + fees.feeAmount + SHIPPING_CENTS,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        // No application_fee_amount / transfer_data — separate charges model.
        metadata: {
          order_id:  orderId,
          pi_role:   "sale",
          listing_id,
          buyer_id:  user.id,
          seller_id: listing.seller_id,
          fee_pct:   String(fees.feePct),
        },
      });

      return NextResponse.json({
        orderId,
        clientSecret: pi.client_secret,
        feePct: fees.feePct,
        amounts: {
          itemPrice:    itemCents,
          veeralFee:    fees.feeAmount,
          shipping:     SHIPPING_CENTS,
          commission:   fees.applicationFee,
          sellerPayout: fees.sellerReceives,
        },
      });
    }
  } catch (err) {
    await admin.from("orders").delete().eq("id", orderId);
    console.error("[checkout] Stripe PI creation error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
