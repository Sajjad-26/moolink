-- Enable Supabase Realtime broadcasts on affiliate_sales so the creator's
-- dashboard can show a live "you earned $X" toast the moment the webhook
-- records a (commissionable) sale — no polling. Guarded so re-running is a no-op.
do $$
begin
  if not exists (
    select 1
    from pg_publication p
    join pg_publication_rel pr on pr.prpubid = p.oid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'affiliate_sales'
  ) then
    alter publication supabase_realtime add table public.affiliate_sales;
  end if;
end $$;
