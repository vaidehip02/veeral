-- ── Reviews v2 — directional reviews for sales and rentals ──────────────────
--
-- Changes:
--   • reviewee_id      — who is being reviewed (replaces seller_id as canonical)
--   • reviewer_role    — 'buyer' | 'renter' | 'owner'
--   • reviewee_role    — 'seller' | 'owner' | 'renter'
--   • transaction_type — 'sale' | 'rental'
--   • visible_at       — blind-reveal for rentals; null = not yet revealed
--   • is_removed       — admin soft-delete with reason + audit trail
--   • unique(order_id, reviewer_id) — one review per direction per order
--   • seller_profiles.renter_rating — cached avg of renter-direction reviews
--   • platform_settings.review_window_days — blind-reveal window (default 14)

-- 1. New columns on reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewee_id        uuid          REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewer_role      text          NOT NULL DEFAULT 'buyer',
  ADD COLUMN IF NOT EXISTS reviewee_role      text          NOT NULL DEFAULT 'seller',
  ADD COLUMN IF NOT EXISTS transaction_type   text          NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS visible_at         timestamptz,
  ADD COLUMN IF NOT EXISTS is_removed         boolean       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS removed_by         uuid          REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS removed_at         timestamptz,
  ADD COLUMN IF NOT EXISTS removed_reason     text;

-- 2. Backfill reviewee_id from seller_id for all existing rows
UPDATE public.reviews SET reviewee_id = seller_id WHERE reviewee_id IS NULL;

-- 3. Backfill visible_at — existing reviews are all sales, reveal immediately
UPDATE public.reviews SET visible_at = created_at WHERE visible_at IS NULL;

-- 4. Enforce NOT NULL after backfill
ALTER TABLE public.reviews ALTER COLUMN reviewee_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN visible_at  SET NOT NULL;

-- 5. Add check constraints
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_role_check   CHECK (reviewer_role   IN ('buyer', 'renter', 'owner')),
  ADD CONSTRAINT reviews_reviewee_role_check   CHECK (reviewee_role   IN ('seller', 'owner', 'renter')),
  ADD CONSTRAINT reviews_transaction_type_check CHECK (transaction_type IN ('sale', 'rental'));

-- 6. Drop old single-order unique constraint; replace with per-direction
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_order_id_key;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_order_reviewer_unique UNIQUE (order_id, reviewer_id);

-- 7. renter_rating on seller_profiles (every user can be a renter)
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS renter_rating numeric(3,2);

-- 8. review_window_days on platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS review_window_days integer NOT NULL DEFAULT 14;

-- 9. Update the seller-rating trigger to handle both directions
CREATE OR REPLACE FUNCTION public.refresh_seller_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reviewee_id uuid;
  v_reviewee_role text;
BEGIN
  v_reviewee_id   := COALESCE(NEW.reviewee_id,   OLD.reviewee_id);
  v_reviewee_role := COALESCE(NEW.reviewee_role, OLD.reviewee_role);

  -- Refresh seller/owner rating (reviews received as item provider)
  UPDATE public.seller_profiles
  SET rating = (
    SELECT round(avg(r.rating)::numeric, 2)
    FROM   public.reviews r
    WHERE  r.reviewee_id   = v_reviewee_id
      AND  r.reviewee_role IN ('seller', 'owner')
      AND  r.is_removed    = false
  )
  WHERE id = v_reviewee_id;

  -- Refresh renter rating when this review is about renter behaviour
  IF v_reviewee_role = 'renter' THEN
    UPDATE public.seller_profiles
    SET renter_rating = (
      SELECT round(avg(r.rating)::numeric, 2)
      FROM   public.reviews r
      WHERE  r.reviewee_id   = v_reviewee_id
        AND  r.reviewee_role = 'renter'
        AND  r.is_removed    = false
    )
    WHERE id = v_reviewee_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger already exists on the table; recreating it picks up the new function body.
DROP TRIGGER IF EXISTS trg_refresh_seller_rating ON public.reviews;
CREATE TRIGGER trg_refresh_seller_rating
  AFTER INSERT OR DELETE OR UPDATE OF is_removed ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_seller_rating();

-- 10. Update RLS insert policy — any order participant can review their counterparty
--     on a completed transaction (sale or rental).
DROP POLICY IF EXISTS "Buyer can review a completed order" ON public.reviews;
CREATE POLICY "Participant can review completed transaction"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
        AND (
          -- Sale: buyer → seller only
          (o.rental_start IS NULL
           AND o.status IN ('delivered', 'completed')
           AND auth.uid() = o.buyer_id)
          OR
          -- Rental: either party after deposit is settled
          (o.rental_start IS NOT NULL
           AND o.status IN ('deposit_released', 'deposit_resolved')
           AND (auth.uid() = o.buyer_id OR auth.uid() = o.seller_id))
        )
    )
  );

-- Keep public read; restrict to revealed and non-removed reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Revealed non-removed reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (is_removed = false AND visible_at <= now());
