-- seller_follows: tracks which buyers follow which sellers
create table if not exists public.seller_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  seller_id   uuid not null references auth.users(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (follower_id, seller_id)
);

-- Index for "who follows seller X" lookups (follower notification)
create index if not exists seller_follows_seller_id_idx on public.seller_follows (seller_id);

-- RLS
alter table public.seller_follows enable row level security;

-- Anyone can see follow counts (for display on seller profiles)
create policy "seller_follows_select_public"
  on public.seller_follows for select
  using (true);

-- Users can only manage their own follows
create policy "seller_follows_insert_own"
  on public.seller_follows for insert
  with check (auth.uid() = follower_id);

create policy "seller_follows_delete_own"
  on public.seller_follows for delete
  using (auth.uid() = follower_id);
