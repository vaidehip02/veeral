/**
 * Fee calculation — server-side only.
 *
 * getFeeSettings()   reads platform_settings from Supabase (admin client, bypasses RLS).
 * calculateFees()    is a pure function: takes the amount, transaction type, and
 *                    already-fetched settings → returns all the numbers the checkout
 *                    API and the orders table need.
 *
 * The fee is charged to the BUYER (added on top of the item/rental price).
 * It is taken only on the item/rental cost — never on shipping or the deposit.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeeSettings {
  buyerFeePct:           number; // default fee (fallback for both types)
  saleFeePct:            number; // resolved: sale_fee_pct ?? buyer_fee_pct
  rentalFeePct:          number; // resolved: rental_fee_pct ?? buyer_fee_pct
  splitStructurePct:     number; // accounting split — structure portion
  splitMarginPct:        number; // accounting split — margin portion
}

export interface FeeResult {
  feePct:            number; // rate used (e.g. 10)
  feeAmount:         number; // cents charged to buyer on top of item price
  buyerTotal:        number; // item price + feeAmount (before shipping/deposit)
  applicationFee:    number; // = feeAmount — what goes to Stripe application_fee_amount
  sellerReceives:    number; // item price — Stripe's own processing fee comes out of this
  splitStructure:    number; // cents — internal accounting only (2% portion)
  splitMargin:       number; // cents — internal accounting only (8% portion)
}

// ── Read settings from DB ─────────────────────────────────────────────────────

export async function getFeeSettings(): Promise<FeeSettings> {
  const admin = createAdminClient();
  type SettingsRow = {
    buyer_fee_pct:           number;
    sale_fee_pct:            number | null;
    rental_fee_pct:          number | null;
    fee_split_structure_pct: number;
    fee_split_margin_pct:    number;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawData, error } = await (admin as any)
    .from("platform_settings")
    .select(
      "buyer_fee_pct, sale_fee_pct, rental_fee_pct, " +
      "fee_split_structure_pct, fee_split_margin_pct"
    )
    .eq("id", 1)
    .single();
  const data = rawData as SettingsRow | null;

  if (error || !data) {
    // Fall back to hardcoded defaults so checkout never breaks even if the row
    // is accidentally deleted or the migration hasn't run yet.
    console.error("[getFeeSettings] falling back to defaults:", error?.message);
    return {
      buyerFeePct:       10,
      saleFeePct:        10,
      rentalFeePct:      10,
      splitStructurePct: 2,
      splitMarginPct:    8,
    };
  }

  const buyerFeePct = data.buyer_fee_pct;
  return {
    buyerFeePct,
    saleFeePct:        data.sale_fee_pct    ?? buyerFeePct,
    rentalFeePct:      data.rental_fee_pct  ?? buyerFeePct,
    splitStructurePct: data.fee_split_structure_pct,
    splitMarginPct:    data.fee_split_margin_pct,
  };
}

// ── Pure fee calculation (no DB calls) ────────────────────────────────────────

export function calculateFees(
  itemAmountCents: number,   // item price or rental cost only — NOT shipping or deposit
  type: "sale" | "rent",
  settings: FeeSettings,
): FeeResult {
  const feePct       = type === "rent" ? settings.rentalFeePct : settings.saleFeePct;
  const feeAmount    = Math.round(itemAmountCents * (feePct / 100));
  const buyerTotal   = itemAmountCents + feeAmount;  // what the buyer actually pays (ex. shipping/deposit)

  // Split is proportional to the total fee
  const splitStructure = Math.round(feeAmount * (settings.splitStructurePct / (settings.splitStructurePct + settings.splitMarginPct)));
  const splitMargin    = feeAmount - splitStructure; // remainder so they always sum to feeAmount exactly

  return {
    feePct,
    feeAmount,
    buyerTotal,
    applicationFee:  feeAmount,  // passed to Stripe as application_fee_amount
    sellerReceives:  itemAmountCents,  // nominal; Stripe subtracts its own processing fee from this
    splitStructure,
    splitMargin,
  };
}
