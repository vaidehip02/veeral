-- ============================================================
-- Veeral — Supabase Schema
-- Run this in the Supabase SQL Editor to initialize your DB
-- ============================================================

-- ── Drop existing policies to allow clean re-run ─────────────
drop policy if exists "Public profiles are viewable by everyone" on public.seller_profiles;
drop policy if exists "Users can update their own profile" on public.seller_profiles;
drop policy if exists "Active listings are viewable by everyone" on public.listings;
drop policy if exists "Sellers can insert their own listings" on public.listings;
drop policy if exists "Sellers can update their own listings" on public.listings;
drop policy if exists "Buyers and sellers can view their own orders" on public.orders;
drop policy if exists "Users can manage their own saved listings" on public.saved_listings;

-- ── Seller Profiles ─────────────────────────────────────────
create table if not exists public.seller_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  location text,
  stripe_account_id text unique,
  stripe_onboarding_complete boolean default false,
  total_sales integer default 0,
  rating numeric(3,2),
  created_at timestamptz default now()
);

alter table public.seller_profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.seller_profiles for select using (true);

create policy "Users can update their own profile"
  on public.seller_profiles for update using (auth.uid() = id);

-- ── Listings ─────────────────────────────────────────────────
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.seller_profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null,
  rent_price integer,
  rent_duration_days integer,
  category text not null check (
    category in ('lehenga','saree','salwar_kameez','kurta','sherwani','indo_western','jewellery','accessories','other')
  ),
  type text not null check (type in ('sale','rent','both')) default 'sale',
  condition text not null check (condition in ('new','like_new','good','fair')),
  status text not null check (status in ('draft','active','sold','rented','archived')) default 'active',
  images text[] default '{}',
  size text,
  color text,
  brand text,
  location text,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Active listings are viewable by everyone"
  on public.listings for select using (status = 'active' or seller_id = auth.uid());

create policy "Sellers can insert their own listings"
  on public.listings for insert with check (seller_id = auth.uid());

create policy "Sellers can update their own listings"
  on public.listings for update using (seller_id = auth.uid());

-- ── Orders ───────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) not null,
  buyer_id uuid references auth.users(id) not null,
  seller_id uuid references public.seller_profiles(id) not null,
  type text not null check (type in ('sale','rent')),
  amount integer not null,
  platform_fee integer not null,
  seller_payout integer not null,
  stripe_payment_intent_id text,
  status text not null check (
    status in ('pending','paid','shipped','delivered','cancelled','refunded')
  ) default 'pending',
  rental_start date,
  rental_end date,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Buyers and sellers can view their own orders"
  on public.orders for select using (
    buyer_id = auth.uid() or seller_id = auth.uid()
  );

-- ── Saved Listings ───────────────────────────────────────────
create table if not exists public.saved_listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  saved_at timestamptz default now(),
  unique (user_id, listing_id)
);

alter table public.saved_listings enable row level security;

create policy "Users can manage their own saved listings"
  on public.saved_listings for all using (user_id = auth.uid());

-- ── Auto-create seller profile on signup ─────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.seller_profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Updated_at trigger ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();
