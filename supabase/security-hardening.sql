-- Security hardening for money flows. Run in the Supabase SQL Editor AFTER
-- deploying the matching app code (orders, payments and driver status now go
-- through server routes that use the service role). Safe to re-run.

-- 1. Orders: clients may read their own orders but never write them directly.
--    Fare, status and payment fields are set only by server routes.
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can update own orders (cancel)" on public.orders;
drop policy if exists "Drivers can update assigned orders" on public.orders;
revoke insert, update, delete on public.orders from anon, authenticated;

-- 2. Drivers: may update only live-status columns directly. Vehicle/identity
--    edits go through /api/driver/profile (service role).
revoke update on public.drivers from anon, authenticated;
grant update (latitude, longitude, is_available) on public.drivers to authenticated;

-- 3. Withdrawals: only via request_withdrawal() below (service role).
drop policy if exists "Drivers can create withdrawal requests" on public.withdrawals;
revoke insert, update, delete on public.withdrawals from anon, authenticated;

-- 4. A payment reference may only ever belong to one payment leg.
create unique index if not exists orders_payment_reference_key
  on public.orders(payment_reference) where payment_reference is not null;
create unique index if not exists orders_items_payment_reference_key
  on public.orders(items_payment_reference) where items_payment_reference is not null;

-- 5. Atomic withdrawal request: the balance check and insert happen under a
--    per-driver lock so concurrent requests can't overdraw.
create or replace function public.request_withdrawal(
  p_driver_id uuid,
  p_earned numeric,
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_account_name text
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  committed numeric;
  available numeric;
begin
  perform pg_advisory_xact_lock(hashtext(p_driver_id::text));

  select coalesce(sum(amount), 0) into committed
  from public.withdrawals
  where driver_id = p_driver_id and status in ('pending', 'paid');

  available := p_earned - committed;
  if p_amount > available then
    raise exception 'INSUFFICIENT_BALANCE:%', available;
  end if;

  insert into public.withdrawals (driver_id, amount, bank_name, account_number, account_name)
  values (p_driver_id, p_amount, p_bank_name, p_account_number, p_account_name);

  return available - p_amount;
end;
$$;

revoke all on function public.request_withdrawal(uuid, numeric, numeric, text, text, text)
  from public, anon, authenticated;
grant execute on function public.request_withdrawal(uuid, numeric, numeric, text, text, text)
  to service_role;
