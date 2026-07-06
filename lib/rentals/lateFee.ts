/**
 * Late-fee helpers — server-side only.
 *
 * getLateFeeSettings()  reads late_fee_type / late_fee_multiplier from platform_settings.
 * computeLateFee()      pure function: dailyRate × daysOverdue × multiplier.
 * computeDaysOverdue()  how many days late the renter shipped (or is still shipping).
 *
 * Late fees are ONLY ever deducted from the renter's deposit — never charged separately.
 * If the late fee would exceed the deposit, it is capped at the deposit amount.
 * The capping is the caller's responsibility.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LateFeeSettings {
  type: "multiplier";
  multiplier: number; // e.g. 1.5 → 1.5× daily rate per overdue day
}

// ── Read settings ─────────────────────────────────────────────────────────────

export async function getLateFeeSettings(): Promise<LateFeeSettings> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("platform_settings")
    .select("late_fee_multiplier")
    .eq("id", 1)
    .single();

  return {
    type: "multiplier",
    multiplier: Number(data?.late_fee_multiplier ?? 1.5),
  };
}

// ── Pure calculations ─────────────────────────────────────────────────────────

/**
 * Returns the late fee in cents.
 * Always 0 if daysOverdue ≤ 0.
 */
export function computeLateFee(
  rentPriceCentsPerDay: number,
  daysOverdue: number,
  settings: LateFeeSettings,
): number {
  if (daysOverdue <= 0 || rentPriceCentsPerDay <= 0) return 0;
  return Math.round(rentPriceCentsPerDay * daysOverdue * settings.multiplier);
}

/**
 * How many days late did the renter return the item?
 * Uses the postmark proxy: return_noted_at (when the renter marked it shipped in the app).
 * Falls back to now() if return_noted_at is null (item still in transit — for auto-release).
 * Returns 0 if on time.
 */
export function computeDaysOverdue(
  rentalEnd: string | null,
  returnNotedAt: string | null,
): number {
  if (!rentalEnd) return 0;
  const endDate = new Date(rentalEnd);
  const returnDate = returnNotedAt ? new Date(returnNotedAt) : new Date();
  const diffMs = returnDate.getTime() - endDate.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
