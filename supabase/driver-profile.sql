-- Add profile photo and home address to drivers
-- Run this in the Supabase SQL Editor

alter table public.drivers
  add column if not exists profile_photo_url text,
  add column if not exists home_address text;
