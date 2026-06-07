-- Run this in your Supabase SQL Editor

-- 1. Extend status to include awaiting_confirmation
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'accepted', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'));

-- 2. Items payment tracking (errands only — rides leave these null)
alter table public.orders
  add column if not exists items_payment_status text default 'unpaid',
  add column if not exists items_payment_reference text;

alter table public.orders drop constraint if exists orders_items_payment_status_check;
alter table public.orders add constraint orders_items_payment_status_check
  check (items_payment_status in ('unpaid', 'paid'));
