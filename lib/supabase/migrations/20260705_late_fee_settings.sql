-- Part C: persist late-fee config in platform_settings (currently only in React state).
-- Also track per-order late fee so it shows up in the seller dashboard and admin.

-- platform-wide config
alter table public.platform_settings
  add column if not exists late_fee_type       text             not null default 'multiplier',
  add column if not exists late_fee_multiplier numeric(5, 2)   not null default 1.5;

-- seed/update the single settings row with the defaults
update public.platform_settings
  set late_fee_type = 'multiplier', late_fee_multiplier = 1.5
  where id = 1;

-- per-order tracking (filled in when the deposit is released)
alter table public.orders
  add column if not exists late_fee_cents integer,   -- total late fee in cents
  add column if not exists late_fee_days  integer;   -- days overdue
