-- ── Unreturned rental handling (Option B: force purchase) ────────────────────

-- Add 'unreturned' to the status constraint
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded',
    'return_pending', 'deposit_released', 'damage_claimed', 'deposit_resolved',
    'unreturned'
  ));

-- Stripe customer ID saved at rental checkout for future off-session charging
alter table public.orders
  add column if not exists buyer_stripe_customer_id text;

-- Timestamp when the order was marked unreturned and buyer was charged
alter table public.orders
  add column if not exists unreturned_at timestamptz;

-- Stripe PaymentIntent ID for the force-purchase charge
alter table public.orders
  add column if not exists unreturned_charge_id text;

-- Amount charged (item_price - deposit, in cents)
alter table public.orders
  add column if not exists unreturned_charge_cents integer;

-- Day of last reminder sent (3 or 7)
alter table public.orders
  add column if not exists unreturned_reminder_sent_day integer;
