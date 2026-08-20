-- Attributed sales from RevenueCat webhooks — one row per purchase/renewal
-- tied to the affiliate ref stamped on the subscriber.
create table if not exists public.affiliate_sales (
  id uuid primary key default gen_random_uuid(),
  rc_event_id text unique not null,          -- RevenueCat webhook event id (idempotency)
  profile_id uuid references public.profiles(id) on delete cascade,  -- the credited affiliate (nullable if ref unknown)
  ref text,                                   -- raw affiliate_ref stamped on the subscriber
  app_user_id text,                           -- RevenueCat customer id
  event_type text not null,                   -- INITIAL_PURCHASE | RENEWAL | ... 
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  period text not null,                       -- 'YYYY-MM' UTC month of the sale
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliate_sales_profile_period
  on public.affiliate_sales(profile_id, period);
create index if not exists idx_affiliate_sales_period
  on public.affiliate_sales(period);

-- RLS: only admins can read attributed sales; inserts come from the webhook (service role).
alter table public.affiliate_sales enable row level security;

create policy "affiliate_sales admin select"
  on public.affiliate_sales for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.is_admin = true
    )
  );

-- No insert/update/delete policies: writes only via service role (webhook).
