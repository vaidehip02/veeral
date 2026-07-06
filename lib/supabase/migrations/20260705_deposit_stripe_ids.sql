-- Store the Stripe IDs returned from the refund and transfer calls
-- so every release is fully auditable and retryable.
-- deposit_refund_stripe_id  : Stripe refund object id (re_xxx)
-- deposit_transfer_stripe_id: Stripe transfer id (tr_xxx) for retained amount to seller

alter table public.orders
  add column if not exists deposit_refund_stripe_id   text,
  add column if not exists deposit_transfer_stripe_id text;
