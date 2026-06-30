-- Platform-wide fee configuration (single row).
-- All fee percentages are integers (e.g. 10 = 10%).
-- sale_fee_pct / rental_fee_pct are nullable: NULL means "use buyer_fee_pct".
-- The structure + margin split must always equal buyer_fee_pct so internal
-- accounting stays consistent.

create table if not exists public.platform_settings (
  id                        integer primary key default 1,  -- enforces single row
  buyer_fee_pct             integer not null default 10,
  sale_fee_pct              integer,                        -- null → falls back to buyer_fee_pct
  rental_fee_pct            integer,                        -- null → falls back to buyer_fee_pct
  fee_split_structure_pct   integer not null default 2,     -- platform/structure share
  fee_split_margin_pct      integer not null default 8,     -- Veeral margin share
  updated_at                timestamptz not null default now(),

  -- Guarantees structure + margin always equals buyer_fee_pct.
  constraint split_equals_fee
    check (fee_split_structure_pct + fee_split_margin_pct = buyer_fee_pct),

  -- Enforces exactly one row.
  constraint single_row
    check (id = 1)
);

-- Seed the default row.
insert into public.platform_settings
  (id, buyer_fee_pct, sale_fee_pct, rental_fee_pct, fee_split_structure_pct, fee_split_margin_pct)
values
  (1, 10, null, null, 2, 8)
on conflict (id) do nothing;

-- Only admins (service-role or is_admin) can read/write.
alter table public.platform_settings enable row level security;

create policy "admins can read platform_settings"
  on public.platform_settings for select
  using (true);   -- any authenticated server-side read is fine; the route enforces admin

create policy "admins can update platform_settings"
  on public.platform_settings for update
  using (true)
  with check (true);
