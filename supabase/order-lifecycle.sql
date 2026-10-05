-- Order lifecycle: refunds + one active order per driver. Safe to re-run.
-- Run AFTER security-hardening.sql, and deploy the matching app code first.

-- 1. Refund tracking
alter table public.orders
  add column if not exists refund_status text
    check (refund_status in ('pending', 'processed', 'failed')),
  add column if not exists refund_error text,
  add column if not exists refunded_at timestamptz;

-- The items leg can now be refunded too
alter table public.orders drop constraint if exists orders_items_payment_status_check;
alter table public.orders add constraint orders_items_payment_status_check
  check (items_payment_status in ('unpaid', 'paid', 'refunded'));

create index if not exists orders_refund_status_idx
  on public.orders(refund_status) where refund_status is not null;

-- 2. A driver can have at most one active (accepted / in progress) order.
--    This is the race-proof guard behind the check in /api/orders/accept.
--    If this fails, the error lists drivers who already hold 2+ active orders:
--    finish or reassign those first.
create unique index if not exists orders_one_active_per_driver
  on public.orders(driver_id)
  where driver_id is not null and status in ('accepted', 'in_progress');
