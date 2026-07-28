alter table public.listings
  add column if not exists included text[] default '{}';
