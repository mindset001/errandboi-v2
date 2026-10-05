-- STEP B of the sensitive-data lockdown. Run AFTER kyc-split.sql has been run,
-- the matching app code is deployed, and driver profile/KYC upload has been
-- verified. Safe to re-run.

-- 1. Private KYC bucket: no public reads, no client uploads. The server uses
--    the service role (which bypasses storage RLS) and hands out signed URLs.
update storage.buckets set public = false where id = 'driver-kyc';
drop policy if exists "Anyone can view kyc docs" on storage.objects;
drop policy if exists "Admin can upload kyc docs" on storage.objects;

-- 2. Drivers table: no longer world-readable. A driver sees their own row; a
--    customer sees only the driver assigned to one of their orders.
--    The helper is SECURITY DEFINER so the policy doesn't recurse through the
--    orders RLS policies (which themselves look at drivers).
create or replace function public.customer_has_driver(p_driver uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where driver_id = p_driver and user_id = auth.uid()
  );
$$;
revoke all on function public.customer_has_driver(uuid) from public, anon;
grant execute on function public.customer_has_driver(uuid) to authenticated;

drop policy if exists "Anyone can view available drivers" on public.drivers;
drop policy if exists "Drivers can view own record" on public.drivers;
drop policy if exists "Customers can view assigned driver" on public.drivers;

create policy "Drivers can view own record"
  on public.drivers for select
  using (auth_user_id = auth.uid());

create policy "Customers can view assigned driver"
  on public.drivers for select
  using (public.customer_has_driver(id));

-- 3. Drivers may now self-update only live-status columns. Vehicle and identity
--    edits go through /api/driver/profile.
revoke update on public.drivers from anon, authenticated;
grant update (latitude, longitude, is_available) on public.drivers to authenticated;

-- 4. Remove the old sensitive copies (data now lives in driver_kyc).
alter table public.drivers
  drop column if exists license_number,
  drop column if exists nin,
  drop column if exists home_address,
  drop column if exists license_url,
  drop column if exists nin_url,
  drop column if exists profile_photo_url;
