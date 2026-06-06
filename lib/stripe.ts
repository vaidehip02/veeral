import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

// Platform fee: 10% of each transaction
export const PLATFORM_FEE_PERCENT = 10;

export function calculateFees(amountInPaise: number) {
  const platformFee = Math.round(amountInPaise * (PLATFORM_FEE_PERCENT / 100));
  const sellerPayout = amountInPaise - platformFee;
  return { platformFee, sellerPayout };
}
