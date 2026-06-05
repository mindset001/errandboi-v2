-- ErrandBoi Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─────────────────────────────────────────────
-- DRIVERS
-- ─────────────────────────────────────────────
create table public.drivers (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null unique,
  vehicle_type text check (vehicle_type in ('bike', 'car', 'tricycle')) not null,
  vehicle_plate text not null,
  avatar_url text,
  is_available boolean default true,
  rating numeric(3,2) default 5.0,
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_at timestamptz default now()
);

alter table public.drivers enable row level security;

create policy "Anyone can view available drivers"
  on public.drivers for select
  using (true);


-- ─────────────────────────────────────────────
-- ORDERS (unified ride + errand table)
-- ─────────────────────────────────────────────
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  driver_id uuid references public.drivers(id),
  order_type text check (order_type in ('ride', 'errand')) not null,

  -- Ride fields
  vehicle_type text check (vehicle_type in ('bike', 'car', 'tricycle')),
  pickup_address text,
  pickup_lat numeric(10,7),
  pickup_lng numeric(10,7),
  dropoff_address text,
  dropoff_lat numeric(10,7),
  dropoff_lng numeric(10,7),
  fare numeric(10,2),

  -- Errand fields
  market_name text,
  delivery_address text,
  delivery_lat numeric(10,7),
  delivery_lng numeric(10,7),
  items jsonb,
  budget numeric(10,2),
  service_fee numeric(10,2) default 500,
  total numeric(10,2),
  notes text,

  -- Shared
  status text check (status in ('pending', 'accepted', 'in_progress', 'completed', 'cancelled'))
    not null default 'pending',
  payment_status text check (payment_status in ('unpaid', 'paid', 'refunded'))
    not null default 'unpaid',
  payment_reference text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders (cancel)"
  on public.orders for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Indexes
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);


-- ─────────────────────────────────────────────
-- REALTIME (enable for live tracking)
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.drivers;
