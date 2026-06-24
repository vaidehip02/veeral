-- ── Rental schema additions ───────────────────────────────────────────────────

-- listings: seller-chosen deposit percentage (35–50%, default 40%)
alter table public.listings
  add column if not exists deposit_pct integer not null default 40
    check (deposit_pct between 35 and 50);

-- orders: deposit tracking
alter table public.orders
  add column if not exists deposit_amount integer;           -- cents, null for sale orders

alter table public.orders
  add column if not exists deposit_payment_intent_id text;  -- Stripe PI id used for deposit refund
