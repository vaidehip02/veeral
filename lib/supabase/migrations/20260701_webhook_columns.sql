-- ── Webhook tracking columns ──────────────────────────────────────────────────

-- paid_at: timestamp when the main payment PI succeeded (set by webhook, truth source)
alter table public.orders
  add column if not exists paid_at timestamptz;

-- deposit_held: true once the deposit PaymentIntent has succeeded
-- Allows the webhook to be idempotent on deposit events without re-querying status
alter table public.orders
  add column if not exists deposit_held boolean not null default false;

-- seller_profiles: track Stripe payouts_enabled separately from charges_enabled
alter table public.seller_profiles
  add column if not exists stripe_payouts_enabled boolean not null default false;
