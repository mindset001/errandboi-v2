-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS)

-- 1. Link drivers to Supabase Auth accounts
alter table public.drivers
  add column if not exists auth_user_id uuid references auth.users(id) unique;

-- 2. KYC and status columns
alter table public.drivers
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column if not exists license_number text,
  add column if not exists nin text;

-- 3. Existing admin-added drivers should be approved, not pending
update public.drivers
  set status = 'approved'
  where auth_user_id is null and status = 'pending';

-- 4. RLS policies (drop first so re-running doesn't error)
drop policy if exists "Drivers can update own record" on public.drivers;
create policy "Drivers can update own record"
  on public.drivers for update
  using (auth.uid() = auth_user_id);

drop policy if exists "Drivers can view assigned orders" on public.orders;
create policy "Drivers can view assigned orders"
  on public.orders for select
  using (
    driver_id in (select id from public.drivers where auth_user_id = auth.uid())
  );

drop policy if exists "Drivers can update assigned orders" on public.orders;
create policy "Drivers can update assigned orders"
  on public.orders for update
  using (
    driver_id in (select id from public.drivers where auth_user_id = auth.uid())
  );
