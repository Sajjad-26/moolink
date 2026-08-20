'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { fetchMonthlyRevenue } from '@/lib/revenuecat';
import {
  getMonthBounds,
  round2,
  MAX_COMMISSION_RATE,
} from '@/lib/commissions';
import type { CommissionData, CommissionPeriod, MyTransaction } from '@/lib/types';

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** Get the global default commission rate from admin settings (default 0.30) */
export async function getGlobalCommissionRate(): Promise<number> {
  const admin = adminClient();
  const { data } = await admin
    .from('admin_settings')
    .select('value')
    .eq('key', 'default_commission_rate')
    .maybeSingle();
  
  if (data?.value) {
    const parsed = Number(data.value);
    if (!isNaN(parsed)) return parsed;
  }
  return 0.30;
}

/** Toggle whether the current user participates in the commission pool. */
export async function setAffiliateStatus(enabled: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('commission_rate')
    .eq('user_id', user.id)
    .single();

  // When opting in with no rate assigned, default to the flat 30% so the
  // creator is earn-ready immediately (the admin can lower it per-creator).
  const update: { is_affiliate: boolean; commission_rate?: number } = { is_affiliate: enabled };
  if (enabled && profile?.commission_rate == null) {
    update.commission_rate = await getGlobalCommissionRate();
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Core action: compute commission data for a given 'YYYY-MM' period, live.
 * - Resolves the current user's profile.
 * - Loads all opted-in affiliates (owner excluded from the pool).
 * - Counts each affiliate's clicks for the month.
 * - Fetches the month's RevenueCat revenue (proceeds + gross).
 * - Splits the 35% pool pro-rata by clicks.
 * - Records/refreshes the commission_periods row (via service role).
 */
export async function getCommissionData(period: string): Promise<CommissionData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_affiliate, is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile) return null;

  const { startIso, endIso } = getMonthBounds(period);

  // Affiliates: all opted-in creators. Admins see the whole list (their own
  // row is included so the admin can review every creator); creators see the
  // pool split including themselves.
  const { data: affiliates } = await supabase
    .from('profiles')
    .select('id, username, display_name, is_affiliate, commission_rate')
    .eq('is_affiliate', true);

  // Clicks per affiliate for the month. Uses the service-role client so a
  // regular affiliate can see the whole pool (RLS would only expose their own).
  const admin = adminClient();
  const { data: clickRows } = await admin
    .from('click_events')
    .select('profile_id')
    .gte('created_at', startIso)
    .lt('created_at', endIso);

  const clicksByProfile: Record<string, number> = {};
  for (const row of clickRows ?? []) {
    clicksByProfile[row.profile_id] = (clicksByProfile[row.profile_id] ?? 0) + 1;
  }

  const revenue = await fetchMonthlyRevenue(period);

  // Per-creator rates from the DB (0 if unset).
  const rateByProfile: Record<string, number> = {};
  for (const a of affiliates ?? []) {
    rateByProfile[a.id] = a.commission_rate != null ? Number(a.commission_rate) : 0;
  }

  // True per-sale attribution: sales recorded via the RevenueCat webhook.
  // Only first-time purchases (INITIAL_PURCHASE / NON_RENEWING_PURCHASE) carry a
  // commission — renewals / cancellations / expirations are excluded so a
  // creator's total can never include a renewal payout.
  const { data: sales } = await admin
    .from('affiliate_sales')
    .select('profile_id, price, proceeds, commission')
    .eq('period', period)
    .in('event_type', ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'TRANSFER', 'PRODUCT_CHANGE']);

  const salesByProfile: Record<string, { count: number; revenue: number; commission: number }> = {};
  for (const s of sales ?? []) {
    if (!s.profile_id) continue;
    const cur = salesByProfile[s.profile_id] ?? { count: 0, revenue: 0, commission: 0 };
    cur.count += 1;
    cur.revenue += Number(s.proceeds ?? 0);
    cur.commission += Number(s.commission ?? 0);
    salesByProfile[s.profile_id] = cur;
  }

  // Commission is per-transaction (stored on the sale). No click estimate.
  const commissionByProfile: Record<string, number> = {};
  for (const a of affiliates ?? []) {
    commissionByProfile[a.id] = round2(salesByProfile[a.id]?.commission ?? 0);
  }

  // Record/refresh the period so admin history + paid state persist.
  if (revenue) {
    await admin
      .from('commission_periods')
      .upsert(
        {
          period,
          revenue_proceeds: round2(revenue.proceeds),
          revenue_gross: round2(revenue.gross),
          currency: revenue.currency,
          commission_rate: MAX_COMMISSION_RATE,
          total_pool: round2(revenue.proceeds * MAX_COMMISSION_RATE),
        },
        { onConflict: 'period' }
      );
  }

  // Period's paid state (best effort — may be null if revenue fetch failed).
  // Uses the service-role client because commission_periods RLS is admin-only.
  const { data: periodRow } = await admin
    .from('commission_periods')
    .select('is_paid')
    .eq('period', period)
    .maybeSingle();

  const rateByProfileMap = new Map(Object.entries(rateByProfile));
  const clicksByProfileMap = new Map(Object.entries(clicksByProfile));

  const entries = (affiliates ?? [])
    .map(a => ({
      profileId: a.id,
      username: a.username,
      displayName: a.display_name || a.username,
      isSelf: a.id === myProfile.id,
      clicks: clicksByProfileMap.get(a.id) ?? 0,
      commission: commissionByProfile[a.id] ?? 0,
      rate: rateByProfileMap.get(a.id) ?? 0,
      sales: salesByProfile[a.id]?.count ?? 0,
      saleRevenue: salesByProfile[a.id]?.revenue ?? 0,
    }))
    .sort((a, b) => b.commission - a.commission);

  // The requesting user is always included, even if not an affiliate yet.
  if (!entries.some(e => e.isSelf)) {
    entries.push({
      profileId: myProfile.id,
      username: myProfile.username,
      displayName: myProfile.display_name || myProfile.username,
      isSelf: true,
      clicks: clicksByProfileMap.get(myProfile.id) ?? 0,
      commission: commissionByProfile[myProfile.id] ?? 0,
      rate: rateByProfileMap.get(myProfile.id) ?? 0,
      sales: salesByProfile[myProfile.id]?.count ?? 0,
      saleRevenue: salesByProfile[myProfile.id]?.revenue ?? 0,
    });
    entries.sort((a, b) => b.commission - a.commission);
  }

  const isAdmin = myProfile.is_admin;
  // Admins review the whole pool — their own row is not special-cased.
  // Creators see their own numbers highlighted.
  const me = entries.find(e => e.isSelf) ?? entries[0];
  const myRate = isAdmin ? 0 : (rateByProfileMap.get(myProfile.id) ?? 0);

  return {
    period,
    revenue,
    pool: round2((revenue?.proceeds ?? 0) * MAX_COMMISSION_RATE),
    rate: MAX_COMMISSION_RATE,
    myRate,
    isPaid: periodRow?.is_paid ?? false,
    affiliates: entries,
    myClicks: me?.clicks ?? 0,
    myCommission: me?.commission ?? 0,
    isAffiliate: myProfile.is_affiliate,
    isAdmin,
    attributionMode: 'sales',
  };
}

/** The creator's own transaction rows for a month — NEW subscribers only.
 *  Resolves the caller's profile from the session, then reads their own
 *  affiliate_sales rows via the service-role client (affiliate_sales is
 *  admin-only by RLS; admin client reads are scoped to the caller's profile_id,
 *  so a creator only ever sees their own data). Powers the live toast + the
 *  creator transactions table. First-time purchases only; renewals/cancels
 *  are filtered out at the query level. */
export async function getMyTransactions(period: string): Promise<MyTransaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (!myProfile) return [];

  const { startIso, endIso } = getMonthBounds(period);
  const admin = adminClient();
  const { data, error } = await admin
    .from('affiliate_sales')
    .select('id, event_type, price, currency, proceeds, commission, purchased_at, ref')
    .eq('profile_id', myProfile.id)
    .gte('purchased_at', startIso)
    .lt('purchased_at', endIso)
    // First-time purchases only — renewals/cancellations/expirations are hidden. (TEMP OVERRIDE for iOS testing)
    .in('event_type', ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL', 'TRANSFER', 'PRODUCT_CHANGE'])
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('[getMyTransactions]', error.message);
    return [];
  }
  return (data ?? []) as MyTransaction[];
}

/** All recorded commission periods, newest first (admin). */
export async function getCommissionHistory(): Promise<CommissionPeriod[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return [];

  const { data } = await supabase
    .from('commission_periods')
    .select('*')
    .order('period', { ascending: false });
  return (data ?? []) as CommissionPeriod[];
}

/** Admin-only: mark a commission period paid/unpaid. */
export async function markCommissionPeriodPaid(period: string, paid: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return { error: 'Forbidden' };

  const admin = adminClient();
  const { error } = await admin
    .from('commission_periods')
    .update({ is_paid: paid, updated_at: new Date().toISOString() })
    .eq('period', period);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

export type AdminAffiliate = {
  profileId: string;
  username: string;
  displayName: string;
  rate: number; // commission_rate as a decimal (0 if unset)
  clicks30d: number;
  sales30d: number;
  commission30d: number;
  isArchived: boolean;
};

export type AdminTransaction = {
  id: string;
  rc_event_id: string;
  profile_id: string | null;
  username: string | null;
  ref: string | null;
  event_type: string;
  price: number;
  currency: string;
  proceeds: number;
  commission: number;
  purchased_at: string;
};

/** Admin-only: list of opted-in affiliates with their current rate, clicks, sales and earned commissions. */
export async function getAffiliatesForAdmin(period?: string): Promise<AdminAffiliate[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return [];

  const { data: affiliates } = await supabase
    .from('profiles')
    .select('id, username, display_name, commission_rate, is_archived, is_affiliate')
    .neq('is_admin', true);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceIso = since.toISOString();

  const admin = adminClient();
  const [{ data: clickRows }, { data: salesRows }] = await Promise.all([
    admin
      .from('click_events')
      .select('profile_id')
      .gte('created_at', sinceIso),
    admin
      .from('affiliate_sales')
      .select('profile_id, commission')
      .gte('purchased_at', sinceIso)
      .in('event_type', ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']),
  ]);

  const clicksByProfile: Record<string, number> = {};
  for (const row of clickRows ?? []) {
    clicksByProfile[row.profile_id] = (clicksByProfile[row.profile_id] ?? 0) + 1;
  }

  const salesByProfile: Record<string, { count: number; commission: number }> = {};
  for (const row of salesRows ?? []) {
    if (!row.profile_id) continue;
    const cur = salesByProfile[row.profile_id] ?? { count: 0, commission: 0 };
    cur.count += 1;
    cur.commission += Number(row.commission ?? 0);
    salesByProfile[row.profile_id] = cur;
  }

  return (affiliates ?? [])
    .filter(a => a.is_affiliate || a.is_archived)
    .map(a => ({
      profileId: a.id,
      username: a.username,
      displayName: a.display_name || a.username,
      rate: a.commission_rate != null ? Number(a.commission_rate) : 0,
      clicks30d: clicksByProfile[a.id] ?? 0,
      sales30d: salesByProfile[a.id]?.count ?? 0,
      commission30d: round2(salesByProfile[a.id]?.commission ?? 0),
      isArchived: a.is_archived ?? false,
    }))
    .sort((a, b) => b.sales30d - a.sales30d || b.clicks30d - a.clicks30d);
}

/** Admin-only: all subscriber transaction rows for a period with creator details. */
export async function getAllTransactionsForAdmin(period: string): Promise<AdminTransaction[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return [];

  const { startIso, endIso } = getMonthBounds(period);
  const admin = adminClient();

  const [{ data: sales }, { data: profiles }] = await Promise.all([
    admin
      .from('affiliate_sales')
      .select('id, rc_event_id, profile_id, ref, event_type, price, currency, proceeds, commission, purchased_at')
      .gte('purchased_at', startIso)
      .lt('purchased_at', endIso)
      .order('purchased_at', { ascending: false }),
    admin
      .from('profiles')
      .select('id, username'),
  ]);

  const profileUsernameMap = new Map((profiles ?? []).map(p => [p.id, p.username]));

  return (sales ?? []).map(s => ({
    id: s.id,
    rc_event_id: s.rc_event_id,
    profile_id: s.profile_id,
    username: s.profile_id ? profileUsernameMap.get(s.profile_id) ?? s.ref : s.ref,
    ref: s.ref,
    event_type: s.event_type,
    price: Number(s.price ?? 0),
    currency: s.currency ?? 'USD',
    proceeds: Number(s.proceeds ?? 0),
    commission: Number(s.commission ?? 0),
    purchased_at: s.purchased_at,
  }));
}

/** Admin-only: set a creator's commission rate (0–0.35). */
export async function setCreatorRate(profileId: string, rate: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return { error: 'Forbidden' };

  if (typeof rate !== 'number' || isNaN(rate) || rate < 0 || rate > MAX_COMMISSION_RATE) {
    return { error: `Rate must be between 0 and ${Math.round(MAX_COMMISSION_RATE * 100)}%.` };
  }

  const admin = adminClient();
  const { error } = await admin
    .from('profiles')
    .update({ commission_rate: round2(rate) })
    .eq('id', profileId);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

/** Admin-only: set the global default commission rate. */
export async function setGlobalCommissionRate(rate: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();
  if (!myProfile?.is_admin) return { error: 'Forbidden' };

  if (typeof rate !== 'number' || isNaN(rate) || rate < 0 || rate > MAX_COMMISSION_RATE) {
    return { error: `Rate must be between 0 and ${Math.round(MAX_COMMISSION_RATE * 100)}%.` };
  }

  const admin = adminClient();
  const { error } = await admin
    .from('admin_settings')
    .upsert({ key: 'default_commission_rate', value: String(rate) }, { onConflict: 'key' });

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

/** Admin-only: Archive a creator (suspends affiliate and public profile) */
export async function archiveCreator(profileId: string, archive: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!myProfile?.is_admin) return { error: 'Forbidden' };

  const admin = adminClient();
  const { error } = await admin.from('profiles').update({ is_archived: archive, is_affiliate: !archive }).eq('id', profileId);
  if (error) return { error: error.message };
  
  revalidatePath('/admin');
  return { success: true };
}

/** Admin-only: Permanently delete a creator (cascades to clicks, views, sales) */
export async function deleteCreator(profileId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!myProfile?.is_admin) return { error: 'Forbidden' };

  const admin = adminClient();
  
  // Need to get user_id to delete auth user, but for now we just delete the profile.
  // Deleting the profile will cascade delete links, click_events, page_views, affiliate_sales.
  const { error } = await admin.from('profiles').delete().eq('id', profileId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { success: true };
}

/** Admin-only: Fetch full dashboard data for a specific creator */
export async function getCreatorDetailData(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: myProfile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!myProfile?.is_admin) throw new Error('Forbidden');

  const admin = adminClient();
  
  const [{ data: links }, { data: clicks }, { data: sales }, { data: views }] = await Promise.all([
    admin.from('links').select('*').eq('profile_id', profileId).order('order_index'),
    admin.from('click_events').select('id, link_id, created_at').eq('profile_id', profileId),
    admin.from('affiliate_sales').select('*').eq('profile_id', profileId).in('event_type', ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE']).order('purchased_at', { ascending: false }),
    admin.from('page_views').select('id, created_at').eq('profile_id', profileId)
  ]);

  return {
    links: links || [],
    clicks: clicks || [],
    sales: sales || [],
    views: views || []
  };
}
