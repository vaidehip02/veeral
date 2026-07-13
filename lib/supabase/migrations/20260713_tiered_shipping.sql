-- ── Tiered shipping ───────────────────────────────────────────────────────────
--
-- Replaces the hardcoded $18 flat rate with three configurable tiers (small /
-- medium / large) plus a custom-amount option (bounded min–max) and a free
-- option (seller absorbs label cost).
--
-- Tier defaults (all amounts in cents):
--   small  $8   — jewellery, accessories, dupatta, stole
--   medium $14  — saree, kurta, salwar kameez, indo-western
--   large  $24  — lehenga, sherwani, heavy bridal
--   min    $5   — floor for custom amounts (anti-gaming)
--   max    $45  — ceiling for custom amounts (anti-gaming)
--
-- The Veeral fee (10%) is calculated on item price only — never on shipping.
-- That invariant is enforced in lib/fees.ts and lib/shipping.ts, not here.

-- ── platform_settings: add shipping tier amounts ──────────────────────────────
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS shipping_small_cents  integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS shipping_medium_cents integer NOT NULL DEFAULT 1400,
  ADD COLUMN IF NOT EXISTS shipping_large_cents  integer NOT NULL DEFAULT 2400,
  ADD COLUMN IF NOT EXISTS shipping_min_cents    integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS shipping_max_cents    integer NOT NULL DEFAULT 4500;

-- ── listings: seller's shipping selection ─────────────────────────────────────
-- shipping_tier: which tier or option the seller chose
-- shipping_cents: set only for 'custom' and 'free' (0 for free); derived from
--   platform_settings at checkout time for named tiers (small/medium/large).
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS shipping_tier  text
    CHECK (shipping_tier IN ('small','medium','large','custom','free')),
  ADD COLUMN IF NOT EXISTS shipping_cents integer
    CHECK (shipping_cents >= 0);

-- ── orders: persist shipping amount at time of purchase ───────────────────────
-- Stored so order history stays accurate even if tier prices change later.
-- Nullable with default null rather than NOT NULL DEFAULT 1800 so old orders
-- (created before this migration) remain readable; UI falls back to 1800 for
-- null rows.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_cents integer;
