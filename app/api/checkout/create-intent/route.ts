import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateFees } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

const SHIPPING_CENTS = 1800; // $18.00

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
    start_date?: string;  // ISO date string
    return_date?: string; // ISO date string
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
    .select("id, title, price, rent_price, deposit_pct, seller_id, status, type")
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

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", listing.seller_id)
    .single();

  if (!seller?.stripe_account_id || !seller.stripe_onboarding_complete) {
    return NextResponse.json(
      { error: "Seller has not completed Stripe onboarding" },
      { status: 422 }
    );
  }

  // ── Compute amounts (all in cents) ────────────────────────────────────────
  const depositPct = listing.deposit_pct ?? 40;

  let rentalFeeCents  = 0;
  let depositCents    = 0;
  let itemCents       = 0;

  if (type === "rent") {
    rentalFeeCents = (listing.rent_price ?? 0) * (body.days ?? 1) * 100;
    depositCents   = Math.round(listing.price * depositPct / 100) * 100;
  } else {
    itemCents = listing.price * 100;
  }

  const subtotalCents = type === "rent" ? rentalFeeCents : itemCents;
  const { platformFee: commissionCents, sellerPayout: sellerPayoutCents } =
    calculateFees(subtotalCents);

  // ── Create pending order row ──────────────────────────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      listing_id,
      buyer_id:    user.id,
      seller_id:   listing.seller_id,
      type,
      amount:          subtotalCents,
      platform_fee:    commissionCents,
      seller_payout:   sellerPayoutCents,
      deposit_amount:  type === "rent" ? depositCents : null,
      status:          "pending",
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
      // PI 1: rental fee + shipping, transferred to seller (minus commission).
      // PI 2: deposit, retained by platform — never transferred to seller.

      const rentalPi = await stripe.paymentIntents.create({
        amount:   rentalFeeCents + SHIPPING_CENTS,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        application_fee_amount: commissionCents,
        transfer_data: { destination: seller.stripe_account_id },
        metadata: {
          order_id:    orderId,
          pi_role:     "rental_fee",
          listing_id,
          buyer_id:    user.id,
          seller_id:   listing.seller_id,
        },
      });

      const depositPi = await stripe.paymentIntents.create({
        amount:   depositCents,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        // No transfer_data — deposit stays on platform until return confirmed
        metadata: {
          order_id:    orderId,
          pi_role:     "deposit",
          listing_id,
          buyer_id:    user.id,
          seller_id:   listing.seller_id,
        },
      });

      // Store deposit PI id on the order now (rental PI id set by webhook on success)
      await supabase
        .from("orders")
        .update({ deposit_payment_intent_id: depositPi.id })
        .eq("id", orderId);

      return NextResponse.json({
        orderId,
        rentalClientSecret:  rentalPi.client_secret,
        depositClientSecret: depositPi.client_secret,
        amounts: {
          rentalFee:  rentalFeeCents,
          shipping:   SHIPPING_CENTS,
          deposit:    depositCents,
          commission: commissionCents,
          sellerPayout: sellerPayoutCents,
        },
      });

    } else {
      // ── Single PaymentIntent for sale ──────────────────────────────────────
      const pi = await stripe.paymentIntents.create({
        amount:   itemCents + SHIPPING_CENTS,
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        application_fee_amount: commissionCents,
        transfer_data: { destination: seller.stripe_account_id },
        metadata: {
          order_id:  orderId,
          pi_role:   "sale",
          listing_id,
          buyer_id:  user.id,
          seller_id: listing.seller_id,
        },
      });

      return NextResponse.json({
        orderId,
        clientSecret: pi.client_secret,
        amounts: {
          itemPrice:    itemCents,
          shipping:     SHIPPING_CENTS,
          commission:   commissionCents,
          sellerPayout: sellerPayoutCents,
        },
      });
    }
  } catch (err) {
    // Clean up the pending order if Stripe creation failed
    await supabase.from("orders").delete().eq("id", orderId);
    console.error("[checkout] Stripe PI creation error:", err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
