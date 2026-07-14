-- ── Delayed seller payouts ────────────────────────────────────────────────────
--
-- Moves from Stripe destination charges (immediate seller transfer) to separate
-- charges + transfers (Veeral holds funds, releases after hold window).
--
-- SALE flow:
--   buyer pays → funds land on Veeral's platform balance
--   seller marks shipped → payout_due_at = shipped_at + payout_hold_days
--   daily cron fires transfer when payout_due_at <= now and payout_frozen = false
--
-- RENTAL flow:
--   buyer pays rental fee → funds land on Veeral's platform balance
--   seller clicks "confirm return" → rental fee transfers immediately
--   deposit keeps its existing 5-business-day review window (unchanged)
--   if review window lapses (auto-release) → deposit + rental fee settle together

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS payout_hold_days        integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS rental_payout_hold_days integer NOT NULL DEFAULT 0;
-- payout_hold_days: days after ship before sale payout releases (default 14)
-- rental_payout_hold_days: reserved for future rental-specific timer; 0 = event-triggered

ALTER TABLE public.orders
  -- Sale payout timing (set when seller uploads tracking)
  ADD COLUMN IF NOT EXISTS payout_due_at         timestamptz,
  -- Transfer record (set when cron fires the transfer)
  ADD COLUMN IF NOT EXISTS payout_released_at    timestamptz,
  ADD COLUMN IF NOT EXISTS payout_transfer_id    text,
  -- Admin freeze (admin sets this to pause an imminent release)
  ADD COLUMN IF NOT EXISTS payout_frozen         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_frozen_reason  text,
  ADD COLUMN IF NOT EXISTS payout_frozen_at      timestamptz,
  -- Blocked reason (set by cron when seller hasn't completed Stripe onboarding)
  ADD COLUMN IF NOT EXISTS payout_blocked_reason text;
