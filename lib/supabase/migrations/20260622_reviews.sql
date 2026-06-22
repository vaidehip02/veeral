-- ── Reviews ──────────────────────────────────────────────────────────────────
-- One review per completed order. Buyer writes; anyone reads; author/admin delete.

create table if not exists public.reviews (
  id          uuid default gen_random_uuid() primary key,
  reviewer_id uuid references auth.users(id)              on delete cascade not null,
  seller_id   uuid references public.seller_profiles(id)  on delete cascade not null,
  order_id    uuid references public.orders(id)           on delete cascade not null,
  rating      smallint not null check (rating between 1 and 5),
  comment     text     not null check (char_length(comment) >= 10),
  created_at  timestamptz default now(),

  -- Enforce one review per order at the DB level
  constraint reviews_order_id_key unique (order_id)
);

alter table public.reviews enable row level security;

-- Anyone can read reviews
create policy "Reviews are publicly readable"
  on public.reviews for select using (true);

-- Only the buyer on a completed order may insert, and only for their own order
create policy "Buyer can review a completed order"
  on public.reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.orders
      where  orders.id     = order_id
        and  orders.buyer_id = auth.uid()
        and  orders.status in ('delivered', 'completed')
    )
  );

-- Author or admin can delete
create policy "Author or admin can delete review"
  on public.reviews for delete
  using (auth.uid() = reviewer_id);

-- ── Materialise avg_rating onto seller_profiles ──────────────────────────────
-- Update the seller's cached rating whenever a review is inserted or deleted.

create or replace function public.refresh_seller_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.seller_profiles
  set    rating = (
           select round(avg(rating)::numeric, 2)
           from   public.reviews
           where  seller_id = coalesce(new.seller_id, old.seller_id)
         )
  where  id = coalesce(new.seller_id, old.seller_id);
  return null;
end;
$$;

drop trigger if exists trg_refresh_seller_rating on public.reviews;
create trigger trg_refresh_seller_rating
  after insert or delete on public.reviews
  for each row execute function public.refresh_seller_rating();
