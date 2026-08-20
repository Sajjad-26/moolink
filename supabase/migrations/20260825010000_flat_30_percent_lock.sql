-- Lock the model to a flat 30% per new subscriber.
-- 1) Reset any legacy >30% affiliate rates to the flat 30% default.
update public.profiles
   set commission_rate = 0.30
 where is_affiliate = true
   and commission_rate is not null
   and commission_rate > 0.30;

-- 2) Recompute commission on existing first-time-purchase rows so stored
--    commissions match the flat 30% of proceeds (only touched rows that were
--    recorded at the legacy 35% rate; renewals stay 0).
update public.affiliate_sales
   set commission = round(proceeds * 0.30 * 100) / 100
 where event_type in ('INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE')
   and commission is not null
   and abs(commission - round(proceeds * 0.30 * 100) / 100) > 0.001;
