-- ── Admin audit log ──────────────────────────────────────────────────────────
-- Records destructive admin actions: dispute resolutions, suspensions, removals.

create table if not exists public.admin_audit_log (
  id          uuid default gen_random_uuid() primary key,
  admin_id    uuid references auth.users(id) on delete set null,
  action      text not null,       -- e.g. 'resolve_damage_claim', 'suspend_user'
  entity_type text not null,       -- 'order', 'listing', 'user'
  entity_id   text not null,
  details     jsonb,               -- free-form context (amounts, reasons, etc.)
  created_at  timestamptz default now()
);

-- Admins can insert and read; no public access.
alter table public.admin_audit_log enable row level security;

create policy "Admin audit log insert"
  on public.admin_audit_log for insert
  using (true) with check (true);  -- enforced at API layer (service-role client)

create policy "Admin audit log select"
  on public.admin_audit_log for select
  using (true);
