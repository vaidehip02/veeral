-- Add is_suspended flag to seller_profiles for admin suspend/unsuspend
alter table public.seller_profiles
  add column if not exists is_suspended boolean not null default false;

-- Add flagged column to listings for admin flag/unflag
alter table public.listings
  add column if not exists flagged boolean not null default false;
