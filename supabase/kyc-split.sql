-- STEP A of the sensitive-data lockdown. Additive only — run BEFORE deploying
-- the matching app code. Safe to re-run.
--
-- Moves identity data (license no., NIN, home address) and document paths out
-- of `drivers` (readable by customers/realtime) into `driver_kyc` (owner-only).

create table if not exists public.driver_kyc (
  driver_id      uuid primary key references public.drivers(id) on delete cascade,
  license_number text,
  nin            text,
  home_address   text,
  license_path   text,   -- storage object path in the private driver-kyc bucket
  nin_path       text,
  photo_path     text,
  updated_at     timestamptz default now()
);

alter table public.driver_kyc enable row level security;

drop policy if exists "Drivers can view own kyc" on public.driver_kyc;
create policy "Drivers can view own kyc"
  on public.driver_kyc for select
  using (driver_id in (select id from public.drivers where auth_user_id = auth.uid()));

-- Writes happen only in server routes (service role).
revoke insert, update, delete on public.driver_kyc from anon, authenticated;

-- Copy existing data. Legacy document columns hold public URLs of the form
-- https://<ref>.supabase.co/storage/v1/object/public/driver-kyc/<path>; keep just <path>.
insert into public.driver_kyc
  (driver_id, license_number, nin, home_address, license_path, nin_path, photo_path)
select
  id, license_number, nin, home_address,
  nullif(regexp_replace(license_url,       '^.*/driver-kyc/', ''), ''),
  nullif(regexp_replace(nin_url,           '^.*/driver-kyc/', ''), ''),
  nullif(regexp_replace(profile_photo_url, '^.*/driver-kyc/', ''), '')
from public.drivers
on conflict (driver_id) do nothing;
