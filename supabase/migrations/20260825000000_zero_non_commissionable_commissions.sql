-- Historical affiliate_sales rows may have a non-zero commission on events
-- that should NOT be paid out (renewals / cancellations / expirations), because
-- earlier versions of the webhook credited every sale event.
-- Commission is earned ONLY on first-time purchases (INITIAL_PURCHASE +
-- NON_RENEWING_PURCHASE). Zero out commission on every other event type so the
-- recorded history matches the "no renewals" payout rule.
update public.affiliate_sales
   set commission = 0
 where event_type not in ('INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE')
   and commission is not null
   and commission <> 0;
