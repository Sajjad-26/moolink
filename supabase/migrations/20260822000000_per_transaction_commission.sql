-- Per-transaction commission: store net proceeds and the creator's commission
-- directly on each attributed sale so earnings are simply a SUM of commissions.
alter table public.affiliate_sales add column if not exists proceeds numeric(12,2) not null default 0;
alter table public.affiliate_sales add column if not exists commission numeric(12,2) not null default 0;
