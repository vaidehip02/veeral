-- ── Listing drafts ────────────────────────────────────────────────────────────
--
-- Changes:
--   • price — allow NULL so partial drafts (no price yet) can be saved
--   • draft_data — JSONB blob for form fields that have no dedicated column:
--       occasions, fabric, embellishments, included, careInstructions,
--       originalPrice, dryCleanOnly, depositPercent
--     These are only relevant while drafting; on publish they feed the listing
--     description / buyer-facing details. The blob makes it easy to restore
--     the full form state when a seller resumes a draft from another device.

-- Allow price to be NULL. Drafts may be saved before the seller has decided
-- on a price. Validation still requires a price before publishing (enforced
-- at the API/form layer, not the DB constraint).
ALTER TABLE public.listings ALTER COLUMN price DROP NOT NULL;

-- Extra form fields that don't have dedicated columns.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS draft_data jsonb;
