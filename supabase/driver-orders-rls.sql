-- Run this in your Supabase SQL Editor
-- Lets approved drivers see and accept unassigned pending orders

-- 1. Drivers can SELECT pending orders not yet assigned to anyone
drop policy if exists "Drivers can view pending unassigned orders" on public.orders;
create policy "Drivers can view pending unassigned orders"
  on public.orders for select
  using (
    status = 'pending'
    and driver_id is null
    and exists (
      select 1 from public.drivers
      where auth_user_id = auth.uid()
        and status = 'approved'
    )
  );

-- 2. Enable Realtime on orders table (idempotent — safe to run again)
alter publication supabase_realtime add table public.orders;
