-- ── Ship-deadline auto-cancel ─────────────────────────────────────────────────
--
-- Adds configurable shipping-deadline settings to platform_settings and the
-- columns needed to track per-order warning emails and per-seller failure counts.
--
-- The cron route /api/orders/process-ship-deadline runs daily and:
--   1. Sends a warning email to the seller at `ship_warning_days` (default 5).
--   2. Cancels the order, refunds the buyer in full, and relists the item at
--      `ship_deadline_days` (default 7) if no tracking has been uploaded.
--   3. Increments seller_profiles.unshipped_cancel_count so admins can identify
--      repeat offenders.

-- ── platform_settings ─────────────────────────────────────────────────────────
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS ship_deadline_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS ship_warning_days  integer NOT NULL DEFAULT 5;

-- ── orders ────────────────────────────────────────────────────────────────────
-- Timestamp of the day-5 warning email. NULL = not yet sent.
-- Guards against sending the warning more than once.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ship_warning_sent_at timestamptz;

-- ── seller_profiles ───────────────────────────────────────────────────────────
-- Running count of orders auto-cancelled due to non-shipment.
-- Visible to admin; used to flag / suspend sellers.
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS unshipped_cancel_count integer NOT NULL DEFAULT 0;
