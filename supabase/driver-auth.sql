-- Run this in your Supabase SQL Editor (after schema.sql)

-- Link drivers to Supabase Auth accounts
alter table public.drivers
  add column if not exists auth_user_id uuid references auth.users(id) unique;

-- Drivers can update their own record (location, availability)
create policy "Drivers can update own record"
  on public.drivers for update
  using (auth.uid() = auth_user_id);

-- Drivers can view their assigned orders
create policy "Drivers can view assigned orders"
  on public.orders for select
  using (
    driver_id in (select id from public.drivers where auth_user_id = auth.uid())
  );

-- Drivers can update their assigned orders (status changes)
create policy "Drivers can update assigned orders"
  on public.orders for update
  using (
    driver_id in (select id from public.drivers where auth_user_id = auth.uid())
  );
