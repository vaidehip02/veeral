/**
 * Late-fee helpers — server-side only.
 *
 * getLateFeeSettings()  reads late_fee_type / late_fee_multiplier / grace_period_days
 *                       from platform_settings.
 * computeLateFee()      pure function: dailyRate × daysOverdue × multiplier.
 * computeDaysOverdue()  how many days late the renter shipped (or is still shipping),
 *                       after subtracting the grace period.
 *
 * Late fees are ONLY ever deducted from the renter's deposit — never charged separately.
 * If the late fee would exceed the deposit, it is capped at the deposit amount.
 * The capping is the caller's responsibility.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LateFeeSettings {
  type: "multiplier";
  multiplier: number;      // e.g. 1.5 → 1.5× daily rate per overdue day
  gracePeriodDays: number; // 0 = no grace period (default)
}

// ── Read settings ─────────────────────────────────────────────────────────────

export async function getLateFeeSettings(): Promise<LateFeeSettings> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("platform_settings")
    .select("late_fee_multiplier, grace_period_days")
    .eq("id", 1)
    .single();

  return {
    type:            "multiplier",
    multiplier:      Number(data?.late_fee_multiplier ?? 1.5),
    gracePeriodDays: Number(data?.grace_period_days   ?? 0),
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
 *
 * - Clock STARTS at rental_end date.
 * - Clock STOPS when the renter logs a tracking number (return_noted_at timestamp).
 * - If return_noted_at is null and today is past rental_end, accrues against now().
 * - grace_period_days is subtracted before returning (0 = no grace period).
 * - Returns 0 if on time or within the grace period.
 */
export function computeDaysOverdue(
  rentalEnd: string | null,
  returnNotedAt: string | null,
  gracePeriodDays = 0,
): number {
  if (!rentalEnd) return 0;
  const endDate    = new Date(rentalEnd);
  const returnDate = returnNotedAt ? new Date(returnNotedAt) : new Date();
  const diffMs     = returnDate.getTime() - endDate.getTime();
  const rawDays    = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return Math.max(0, rawDays - gracePeriodDays);
}
