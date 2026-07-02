-- Actual Stripe processing fee in cents, captured from the balance transaction
-- in the webhook after payment_intent.succeeded. Null until the webhook fires.
alter table public.orders
  add column if not exists stripe_processing_fee integer;
