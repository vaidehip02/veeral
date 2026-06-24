-- ── Rental return + deposit-release schema ───────────────────────────────────

-- Extend the orders status constraint to include rental-specific statuses.
-- Existing values: pending, paid, shipped, delivered, cancelled, refunded
-- New values:
--   return_pending   — buyer marked item as returned; seller has 5 business days to act
--   deposit_released — seller confirmed good condition, OR auto-released after window lapse
--   damage_claimed   — seller filed a damage claim within the review window
--   deposit_resolved — admin resolved the damage claim

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in (
    'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded',
    'return_pending', 'deposit_released', 'damage_claimed', 'deposit_resolved'
  ));

-- Return tracking
alter table public.orders
  add column if not exists return_tracking_number text;

alter table public.orders
  add column if not exists return_noted_at timestamptz;

-- Deposit release record
alter table public.orders
  add column if not exists deposit_release_amount integer;       -- cents

alter table public.orders
  add column if not exists deposit_release_reason text;

alter table public.orders
  add column if not exists deposit_released_at timestamptz;

-- IMPORTANT: always false until real Stripe refund is wired.
-- Never set true in the current task.
alter table public.orders
  add column if not exists deposit_refund_processed boolean not null default false;

-- Damage claim fields (used in Part B)
alter table public.orders
  add column if not exists damage_claim_photos text[];           -- Cloudinary URLs

alter table public.orders
  add column if not exists damage_claim_description text;

alter table public.orders
  add column if not exists damage_claim_retain_amount integer;   -- cents, ≤ deposit_amount
