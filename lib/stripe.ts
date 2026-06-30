import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

// Fee calculation and settings live in lib/fees.ts.
// calculateFees() reads the rate from platform_settings — nothing is hardcoded here.
