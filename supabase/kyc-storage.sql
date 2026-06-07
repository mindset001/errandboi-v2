-- KYC document storage + new columns on drivers
-- Run this in the Supabase SQL Editor

-- 1. Add document URL columns to drivers table
alter table public.drivers
  add column if not exists license_url text,
  add column if not exists nin_url text;

-- 2. Create the KYC storage bucket (public so admin can view docs by URL)
insert into storage.buckets (id, name, public)
values ('driver-kyc', 'driver-kyc', true)
on conflict (id) do nothing;

-- 3. Storage policy: only service-role (admin) can upload (drivers upload via server action)
--    Anyone can read (bucket is public)
drop policy if exists "Admin can upload kyc docs" on storage.objects;
create policy "Admin can upload kyc docs" on storage.objects
  for insert with check (bucket_id = 'driver-kyc');

drop policy if exists "Anyone can view kyc docs" on storage.objects;
create policy "Anyone can view kyc docs" on storage.objects
  for select using (bucket_id = 'driver-kyc');
