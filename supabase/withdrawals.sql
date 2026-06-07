-- Run this in your Supabase SQL Editor

create table if not exists public.withdrawals (
  id uuid default uuid_generate_v4() primary key,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  amount numeric(10,2) not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  status text check (status in ('pending', 'paid', 'rejected')) not null default 'pending',
  admin_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.withdrawals enable row level security;

create policy "Drivers can view own withdrawals"
  on public.withdrawals for select
  using (driver_id in (select id from public.drivers where auth_user_id = auth.uid()));

create policy "Drivers can create withdrawal requests"
  on public.withdrawals for insert
  with check (driver_id in (select id from public.drivers where auth_user_id = auth.uid()));

create or replace trigger withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function public.set_updated_at();

create index if not exists withdrawals_driver_id_idx on public.withdrawals(driver_id);
create index if not exists withdrawals_status_idx on public.withdrawals(status);
