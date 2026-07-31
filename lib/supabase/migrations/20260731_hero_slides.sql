create table if not exists public.hero_slides (
  id          serial primary key,
  label       text        not null default '',
  heading     text        not null default '',
  sub         text        not null default '',
  cta         text        not null default 'Shop Now',
  href        text        not null default '/listings',
  image_url   text,
  order_index integer     not null default 0,
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- Seed the three default slides
insert into public.hero_slides (label, heading, sub, cta, href, order_index) values
  ('Wedding Season', 'Dress for Every Occasion', 'Lehengas, sarees & sherwanis — new and pre-loved.', 'Shop Now', '/listings?category=lehenga', 0),
  ('New Arrivals',   'Fresh Finds Every Day',    'Discover one-of-a-kind South Asian fashion from sellers near you.', 'Browse Listings', '/listings', 1),
  ('Rent & Discover','Rent for One Night',       'Why buy when you can rent? Stunning outfits for any event.', 'Browse Rentals', '/listings?type=rent', 2);

-- Public read access (carousel is visible to everyone)
alter table public.hero_slides enable row level security;
create policy "Public read hero_slides" on public.hero_slides for select using (true);
create policy "Admin write hero_slides" on public.hero_slides for all using (
  exists (select 1 from public.seller_profiles where id = auth.uid() and is_admin = true)
);
