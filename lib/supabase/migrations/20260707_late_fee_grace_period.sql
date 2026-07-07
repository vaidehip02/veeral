-- Add grace_period_days to platform_settings (default 0 = no grace period)
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS grace_period_days integer NOT NULL DEFAULT 0;

UPDATE platform_settings SET grace_period_days = 0 WHERE id = 1;
