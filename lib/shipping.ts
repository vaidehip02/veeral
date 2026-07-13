/**
 * lib/shipping.ts — single source of truth for shipping tier logic.
 *
 * Replaces all instances of the hardcoded `SHIPPING_CENTS = 1800` constant.
 * The Veeral fee (10%) is always calculated on item price only — never on
 * shipping. That invariant is enforced in lib/fees.ts; shipping is always
 * passed separately to Stripe as part of the PaymentIntent amount but is
 * excluded from application_fee_amount.
 *
 * TODO (future): replace tiers with real-weight pricing via EasyPost or Shippo
 * once in-app label purchase is built. At that point, sellers enter dimensions /
 * weight and the carrier API returns the actual rate.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export type ShippingTier = "small" | "medium" | "large" | "custom" | "free";

// ── Garment category → default tier ──────────────────────────────────────────
// Used to pre-select the tier picker when a seller sets a garment type.
// Sellers can always override.
export const CATEGORY_DEFAULT_TIER: Record<string, ShippingTier> = {
  jewellery:     "small",
  saree:         "medium",
  salwar_kameez: "medium",
  indo_western:  "medium",
  lehenga:       "large",
  sherwani:      "large",
  other:         "medium",
};

// ── Tier display labels ───────────────────────────────────────────────────────
export const TIER_LABEL: Record<ShippingTier, string> = {
  small:  "Small",
  medium: "Medium",
  large:  "Large",
  custom: "Custom",
  free:   "Free shipping",
};

export const TIER_DESCRIPTION: Record<ShippingTier, string> = {
  small:  "Jewellery, accessories, dupatta, stole",
  medium: "Saree, kurta, salwar kameez, indo-western",
  large:  "Lehenga, sherwani, heavy bridal",
  custom: "Enter an amount between the min and max",
  free:   "You pay the label cost out of pocket",
};

// ── Settings shape ────────────────────────────────────────────────────────────
export interface ShippingSettings {
  smallCents:  number;
  mediumCents: number;
  largeCents:  number;
  minCents:    number;
  maxCents:    number;
}

const DEFAULTS: ShippingSettings = {
  smallCents:  800,
  mediumCents: 1400,
  largeCents:  2400,
  minCents:    500,
  maxCents:    4500,
};

// ── Read settings from DB (server-side only) ─────────────────────────────────
export async function getShippingSettings(): Promise<ShippingSettings> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data, error } = await admin
    .from("platform_settings")
    .select("shipping_small_cents, shipping_medium_cents, shipping_large_cents, shipping_min_cents, shipping_max_cents")
    .eq("id", 1)
    .single() as { data: { shipping_small_cents: number; shipping_medium_cents: number; shipping_large_cents: number; shipping_min_cents: number; shipping_max_cents: number } | null; error: unknown };

  if (error || !data) {
    console.error("[shipping] falling back to defaults:", error);
    return DEFAULTS;
  }

  return {
    smallCents:  data.shipping_small_cents  ?? DEFAULTS.smallCents,
    mediumCents: data.shipping_medium_cents ?? DEFAULTS.mediumCents,
    largeCents:  data.shipping_large_cents  ?? DEFAULTS.largeCents,
    minCents:    data.shipping_min_cents    ?? DEFAULTS.minCents,
    maxCents:    data.shipping_max_cents    ?? DEFAULTS.maxCents,
  };
}

// ── Resolve tier → cents (pure, no DB) ───────────────────────────────────────
// customCents is only used when tier === 'custom'.
export function resolveTierCents(
  tier: ShippingTier | null | undefined,
  customCents: number | null | undefined,
  settings: ShippingSettings,
): number {
  switch (tier) {
    case "free":   return 0;
    case "small":  return settings.smallCents;
    case "medium": return settings.mediumCents;
    case "large":  return settings.largeCents;
    case "custom": return customCents ?? settings.mediumCents;
    default:       return settings.mediumCents; // fallback for old listings without a tier
  }
}

// ── Tier cents → display string ───────────────────────────────────────────────
export function tierCentsLabel(tier: ShippingTier | null | undefined, settings: ShippingSettings): string {
  const cents = resolveTierCents(tier, null, settings);
  if (tier === "free") return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}
