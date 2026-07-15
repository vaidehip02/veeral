-- Add configurable insurance-required threshold to platform_settings.
-- Items at or above this value (in cents) require the seller to purchase
-- carrier insurance for the full declared value before shipping.
-- Default: $1,000 = 100000 cents.

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS insurance_required_threshold_cents integer NOT NULL DEFAULT 100000;

UPDATE public.platform_settings
  SET insurance_required_threshold_cents = 100000
  WHERE id = 1;
