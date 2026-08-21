'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import {
  Eye, MousePointerClick, Percent, TrendingUp,
  Globe, Smartphone, Share2, Award, ArrowUpRight, ArrowDownRight,
  Sparkles, Loader2, RefreshCw, Calendar, Zap, ShieldAlert,
  Flame, Clock, Compass, Activity, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Time Period Options ───────────────────────────────────────────────
export type PeriodValue = 'today' | '24h' | 7 | 30 | 0;

interface PeriodOption {
  label: string;
  value: PeriodValue;
  shortLabel: string;
  proOnly?: boolean;
}

const PERIODS: PeriodOption[] = [
  { label: 'Today (Live)', value: 'today', shortLabel: 'Today' },
  { label: 'Last 24 Hours', value: '24h', shortLabel: '24h' },
  { label: 'Last 7 Days', value: 7, shortLabel: '7D' },
  { label: 'Last 30 Days', value: 30, shortLabel: '30D', proOnly: true },
  { label: 'All Time', value: 0, shortLabel: 'All', proOnly: true },
];

const CHART_COLORS = [
  '#D97706', // Warm Amber
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#EA580C', // Orange
];

// ── Full Country Resolver with Flag & English Name ────────────────────
const COMMON_COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  BR: 'Brazil',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  PK: 'Pakistan',
  ID: 'Indonesia',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  RU: 'Russia',
  JP: 'Japan',
  CN: 'China',
  TR: 'Turkey',
  MX: 'Mexico',
  PH: 'Philippines',
  VN: 'Vietnam',
  EG: 'Egypt',
  NG: 'Nigeria',
  ZA: 'South Africa',
  BD: 'Bangladesh',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  KR: 'South Korea',
  SE: 'Sweden',
  CH: 'Switzerland',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  IE: 'Ireland',
  NZ: 'New Zealand',
  KW: 'Kuwait',
  QA: 'Qatar',
  OM: 'Oman',
  BH: 'Bahrain',
  CO: 'Colombia',
  AR: 'Argentina',
  CL: 'Chile',
};

export function getCountryInfo(rawCode: string | null | undefined): { name: string; flag: string; code: string } {
  if (!rawCode || rawCode === 'null' || rawCode === 'undefined' || !rawCode.trim()) {
    return { name: 'Direct / Global', flag: '🌐', code: 'GLOBAL' };
  }

  const clean = rawCode.trim().toUpperCase();

  // Generate Flag emoji from 2-letter ISO code
  let flag = '🌐';
  if (clean.length === 2 && /^[A-Z]{2}$/.test(clean)) {
    flag = String.fromCodePoint(...clean.split('').map(c => 127397 + c.charCodeAt(0)));
  }

  // Resolve full name using browser's built-in Intl API with fallback
  let name = clean;
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const resolved = displayNames.of(clean);
    if (resolved) name = resolved;
  } catch {
    name = COMMON_COUNTRY_NAMES[clean] || clean;
  }

  if (COMMON_COUNTRY_NAMES[clean] && name === clean) {
    name = COMMON_COUNTRY_NAMES[clean];
  }

  return { name, flag, code: clean };
}

// ── Smart Referrer Classifier ─────────────────────────────────────────
function parseReferrer(ref: string | null): { label: string; icon: string; category: string } {
  if (!ref) return { label: 'Direct / Social Bio', icon: '🔗', category: 'Direct' };

  if (ref.startsWith('ref:')) {
    const campaignName = ref.slice(4);
    return { label: `Promo Campaign: @${campaignName}`, icon: '🏷️', category: 'Campaign' };
  }

  try {
    const lower = ref.toLowerCase();
    if (lower.includes('instagram.com') || lower.includes('l.instagram')) {
      return { label: 'Instagram', icon: '📸', category: 'Social' };
    }
    if (lower.includes('tiktok.com')) {
      return { label: 'TikTok', icon: '🎵', category: 'Social' };
    }
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { label: 'YouTube', icon: '▶️', category: 'Social' };
    }
    if (lower.includes('twitter.com') || lower.includes('x.com') || lower.includes('t.co')) {
      return { label: 'Twitter / X', icon: '𝕏', category: 'Social' };
    }
    if (lower.includes('facebook.com') || lower.includes('fb.com')) {
      return { label: 'Facebook', icon: '👤', category: 'Social' };
    }
    if (lower.includes('t.me') || lower.includes('telegram')) {
      return { label: 'Telegram', icon: '✈️', category: 'Social' };
    }
    if (lower.includes('whatsapp') || lower.includes('wa.me')) {
      return { label: 'WhatsApp', icon: '💬', category: 'Social' };
    }
    if (lower.includes('reddit.com')) {
      return { label: 'Reddit', icon: '🤖', category: 'Social' };
    }
    if (lower.includes('linkedin.com')) {
      return { label: 'LinkedIn', icon: '💼', category: 'Social' };
    }
    if (lower.includes('google.com')) {
      return { label: 'Google Search', icon: '🔍', category: 'Search' };
    }

    const host = new URL(ref).hostname.replace('www.', '');
    return { label: host, icon: '🌐', category: 'Web' };
  } catch {
    return { label: ref.length > 30 ? `${ref.slice(0, 27)}...` : ref, icon: '🌐', category: 'Other' };
  }
}

// ── Chart Custom Tooltip ──────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-amber-500/30 p-3.5 rounded-2xl shadow-2xl text-xs text-white">
        <p className="font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {label}
        </p>
        <div className="space-y-1">
          <p className="text-amber-400 font-extrabold flex items-center gap-2 text-sm">
            <MousePointerClick className="w-4 h-4 text-amber-400" />
            {payload[0].value} {payload[0].value === 1 ? 'click' : 'clicks'}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────
export function AnalyticsTab({ profileId, username, isPro }: { profileId: string; username: string; isPro: boolean }) {
  const supabase = useMemo(() => createClient(), []);

  const [period, setPeriod] = useState<PeriodValue>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Timeframe Metrics
  const [views, setViews] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [ctr, setCtr] = useState(0);
  const [prevViews, setPrevViews] = useState(0);
  const [prevClicks, setPrevClicks] = useState(0);

  // Today's Live Pulse Metrics
  const [todayViews, setTodayViews] = useState(0);
  const [todayClicks, setTodayClicks] = useState(0);
  const [todayCtr, setTodayCtr] = useState(0);
  const [yesterdayViews, setYesterdayViews] = useState(0);
  const [yesterdayClicks, setYesterdayClicks] = useState(0);
  const [todayTopCountry, setTodayTopCountry] = useState<{ name: string; flag: string; count: number } | null>(null);
  const [todayTopReferrer, setTodayTopReferrer] = useState<{ label: string; icon: string; count: number } | null>(null);

  // Deep Breakdown Lists
  const [clickTrend, setClickTrend] = useState<{ date: string; clicks: number }[]>([]);
  const [topLinks, setTopLinks] = useState<{ title: string; clicks: number; isApp?: boolean }[]>([]);
  const [referrers, setReferrers] = useState<{ source: string; icon: string; count: number }[]>([]);
  const [countries, setCountries] = useState<{ name: string; flag: string; code: string; count: number }[]>([]);
  const [devices, setDevices] = useState<{ device: string; count: number }[]>([]);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();

      // ── 1. Calculate Timestamps for Selected Period ──
      let periodStart: Date;
      let prevPeriodStart: Date;
      let prevPeriodEnd: Date;

      if (period === 'today') {
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);

        prevPeriodEnd = new Date(periodStart);
        prevPeriodStart = new Date(periodStart);
        prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
      } else if (period === '24h') {
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        prevPeriodEnd = new Date(periodStart);
        prevPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      } else if (period === 0) {
        // All time
        periodStart = new Date(0);
        prevPeriodStart = new Date(0);
        prevPeriodEnd = new Date(0);
      } else {
        // N days (7 or 30)
        periodStart = new Date(now.getTime() - period * 86400000);
        prevPeriodEnd = new Date(periodStart);
        prevPeriodStart = new Date(periodStart.getTime() - period * 86400000);
      }

      const since = periodStart.toISOString();
      const currentEnd = now.toISOString();
      const prevSince = prevPeriodStart.toISOString();
      const prevEndIso = prevPeriodEnd.toISOString();

      // ── 2. Calculate Timestamps for Today's Dedicated Live Pulse ──
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayStartIso = todayStart.toISOString();

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayStartIso = yesterdayStart.toISOString();
      const yesterdayEndIso = todayStartIso;

      // ── 3. Parallel Queries for Main Metrics ──
      const [
        { count: viewsNow },
        { count: viewsPrev },
        { count: clicksNow },
        { count: clicksPrev },
        { count: tViewsCount },
        { count: yViewsCount },
        { count: tClicksCount },
        { count: yClicksCount },
      ] = await Promise.all([
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', since).lte('created_at', currentEnd),
        period !== 0
          ? supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', prevSince).lt('created_at', prevEndIso)
          : Promise.resolve({ count: 0 }),
        supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', since).lte('created_at', currentEnd),
        period !== 0
          ? supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', prevSince).lt('created_at', prevEndIso)
          : Promise.resolve({ count: 0 }),
        // Today Live
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', todayStartIso),
        supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', yesterdayStartIso).lt('created_at', yesterdayEndIso),
        supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', todayStartIso),
        supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', yesterdayStartIso).lt('created_at', yesterdayEndIso),
      ]);

      const vNow = viewsNow || 0;
      const cNow = clicksNow || 0;
      setViews(vNow);
      setPrevViews(viewsPrev || 0);
      setClicks(cNow);
      setPrevClicks(clicksPrev || 0);
      setCtr(vNow > 0 ? Math.round((cNow / vNow) * 100) : (cNow > 0 ? 100 : 0));

      const tv = tViewsCount || 0;
      const tc = tClicksCount || 0;
      setTodayViews(tv);
      setYesterdayViews(yViewsCount || 0);
      setTodayClicks(tc);
      setYesterdayClicks(yClicksCount || 0);
      setTodayCtr(tv > 0 ? Math.round((tc / tv) * 100) : (tc > 0 ? 100 : 0));

      // ── 4. Chart Timeline Buckets (Hourly for Today/24h, Daily for 7d/30d/All) ──
      const { data: clickData } = await supabase
        .from('click_events')
        .select('created_at')
        .eq('profile_id', profileId)
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (period === 'today' || period === '24h') {
        // Hourly buckets (24 buckets)
        const hourMap = new Map<string, number>();
        const hourLabels: string[] = [];

        for (let i = 0; i < 24; i++) {
          const hourTime = period === 'today'
            ? new Date(todayStart.getTime() + i * 3600000)
            : new Date(now.getTime() - (23 - i) * 3600000);

          const label = hourTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          hourLabels.push(label);
          hourMap.set(label, 0);
        }

        for (const c of clickData || []) {
          const cDate = new Date(c.created_at);
          const label = cDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
          if (hourMap.has(label)) {
            hourMap.set(label, (hourMap.get(label) || 0) + 1);
          }
        }

        setClickTrend(hourLabels.map((date) => ({ date, clicks: hourMap.get(date) || 0 })));
      } else {
        // Daily buckets
        let buckets = 7;
        if (period === 30) buckets = 30;
        else if (period === 0) {
          if (clickData && clickData.length > 0) {
            const earliest = new Date(clickData[0].created_at);
            const spanDays = Math.ceil((now.getTime() - earliest.getTime()) / 86400000) + 1;
            buckets = Math.min(Math.max(spanDays, 7), 60);
          } else {
            buckets = 30;
          }
        }

        const clickMap = new Map<string, number>();
        for (let i = 0; i < buckets; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - (buckets - 1 - i));
          const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          clickMap.set(formatted, 0);
        }

        for (const c of clickData || []) {
          const formatted = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (clickMap.has(formatted)) {
            clickMap.set(formatted, (clickMap.get(formatted) || 0) + 1);
          }
        }

        setClickTrend(Array.from(clickMap.entries()).map(([date, clicks]) => ({ date, clicks })));
      }

      // ── 5. Accurate Top Links (Handles BOTH user links & Facera app promo clicks) ──
      const { data: allClicks } = await supabase
        .from('click_events')
        .select('link_id, app_slug')
        .eq('profile_id', profileId)
        .gte('created_at', since);

      if (allClicks && allClicks.length > 0) {
        const linkCounts = new Map<string, number>();
        let appPromoCount = 0;

        for (const c of allClicks) {
          if (c.app_slug === 'facera') {
            appPromoCount++;
          } else if (c.link_id) {
            linkCounts.set(c.link_id, (linkCounts.get(c.link_id) || 0) + 1);
          }
        }

        const topLinkIds = Array.from(linkCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id]) => id);

        const { data: linkData } = topLinkIds.length > 0
          ? await supabase.from('links').select('id, title').in('id', topLinkIds)
          : { data: [] };

        const titleMap = new Map<string, string>();
        for (const l of linkData || []) titleMap.set(l.id, l.title);

        const compiled: { title: string; clicks: number; isApp?: boolean }[] = [];

        if (appPromoCount > 0) {
          compiled.push({
            title: 'Facera AI (Promo Link)',
            clicks: appPromoCount,
            isApp: true,
          });
        }

        for (const [id, count] of linkCounts.entries()) {
          compiled.push({
            title: titleMap.get(id) || 'Untitled Custom Link',
            clicks: count,
            isApp: false,
          });
        }

        compiled.sort((a, b) => b.clicks - a.clicks);
        setTopLinks(compiled.slice(0, 6));
      } else {
        setTopLinks([]);
      }

      // ── 6. Traffic Sources / Referrers ──
      const [{ data: refClicks }, { data: refViews }] = await Promise.all([
        supabase.from('click_events').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null),
        supabase.from('page_views').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null),
      ]);

      const refMap = new Map<string, { count: number; icon: string }>();
      for (const r of [...(refClicks || []), ...(refViews || [])]) {
        const parsed = parseReferrer(r.referrer);
        const existing = refMap.get(parsed.label);
        if (existing) {
          existing.count += 1;
        } else {
          refMap.set(parsed.label, { count: 1, icon: parsed.icon });
        }
      }

      const sortedReferrers = Array.from(refMap.entries())
        .map(([source, data]) => ({ source, icon: data.icon, count: data.count }))
        .sort((a, b) => b.count - a.count);

      setReferrers(sortedReferrers.slice(0, 6));
      if (sortedReferrers.length > 0) {
        setTodayTopReferrer({ label: sortedReferrers[0].source, icon: sortedReferrers[0].icon, count: sortedReferrers[0].count });
      } else {
        setTodayTopReferrer(null);
      }

      // ── 7. Full Country Names & Flags ──
      const [{ data: cClicks }, { data: cViews }] = await Promise.all([
        supabase.from('click_events').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null),
        supabase.from('page_views').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null),
      ]);

      const countryCountMap = new Map<string, number>();
      for (const c of [...(cClicks || []), ...(cViews || [])]) {
        if (c.country) {
          const code = c.country.trim().toUpperCase();
          countryCountMap.set(code, (countryCountMap.get(code) || 0) + 1);
        }
      }

      const sortedCountries = Array.from(countryCountMap.entries())
        .map(([code, count]) => {
          const info = getCountryInfo(code);
          return { name: info.name, flag: info.flag, code, count };
        })
        .sort((a, b) => b.count - a.count);

      setCountries(sortedCountries.slice(0, 8));
      if (sortedCountries.length > 0) {
        setTodayTopCountry({ name: sortedCountries[0].name, flag: sortedCountries[0].flag, count: sortedCountries[0].count });
      } else {
        setTodayTopCountry(null);
      }

      // ── 8. Devices & OS Distribution ──
      const [{ data: dClicks }, { data: dViews }] = await Promise.all([
        supabase.from('click_events').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null),
        supabase.from('page_views').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null),
      ]);

      const deviceMap = new Map<string, number>();
      for (const d of [...(dClicks || []), ...(dViews || [])]) {
        if (d.device_type) {
          deviceMap.set(d.device_type, (deviceMap.get(d.device_type) || 0) + 1);
        }
      }

      setDevices(
        Array.from(deviceMap.entries())
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count)
      );

    } catch (err) {
      console.error('[Analytics] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, profileId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Derived differences & calculations
  const diffViews = views - prevViews;
  const diffClicks = clicks - prevClicks;
  const diffTodayViews = todayViews - yesterdayViews;
  const diffTodayClicks = todayClicks - yesterdayClicks;

  const totalReferrerCount = referrers.reduce((acc, r) => acc + r.count, 0) || 1;
  const totalCountryCount = countries.reduce((acc, c) => acc + c.count, 0) || 1;
  const totalDeviceCount = devices.reduce((acc, d) => acc + d.count, 0) || 1;
  const maxTopLinkClicks = topLinks[0]?.clicks || 1;

  const selectedPeriodLabel = PERIODS.find((p) => p.value === period)?.label || 'Selected Timeframe';

  return (
    <div className="space-y-6 relative">
      {/* ── TOP CONTROL BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/90 backdrop-blur-xl p-5 rounded-3xl border border-border/80 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                Real-Time Analytics
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Live performance for <span className="font-mono font-semibold text-foreground">moolink.xyz/{username}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted/80 p-1 rounded-2xl border border-border/70 shadow-inner">
            {PERIODS.map((p) => {
              const locked = Boolean(p.proOnly) && !isPro;
              const isSelected = period === p.value;
              return (
                <button
                  key={p.label}
                  onClick={() => !locked && setPeriod(p.value)}
                  disabled={locked}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-sm shadow-amber-900/20 scale-[1.02]'
                      : locked
                      ? 'text-muted-foreground/30 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={locked ? 'Upgrade to Pro for 30D & All-Time analytics' : undefined}
                >
                  {locked ? '🔒 ' : ''}{p.shortLabel}
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || loading}
            className="h-9 px-3 rounded-xl border-border/80 hover:bg-muted text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── TODAY'S LIVE PULSE SECTION ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/30 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Today's Live Snapshot
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> Updated just now
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Today Clicks */}
          <div className="bg-card/70 backdrop-blur-sm p-4 rounded-2xl border border-border/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <MousePointerClick className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Today's Clicks
              </span>
              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                diffTodayClicks >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {diffTodayClicks >= 0 ? '+' : ''}{diffTodayClicks} vs yest.
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {todayClicks.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">Clicks received today</p>
          </div>

          {/* Today Views */}
          <div className="bg-card/70 backdrop-blur-sm p-4 rounded-2xl border border-border/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Today's Views
              </span>
              <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                diffTodayViews >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {diffTodayViews >= 0 ? '+' : ''}{diffTodayViews} vs yest.
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {todayViews.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground">Unique profile views today</p>
          </div>

          {/* Today CTR */}
          <div className="bg-card/70 backdrop-blur-sm p-4 rounded-2xl border border-border/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Today's CTR
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                Conversion
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {todayCtr}%
            </div>
            <p className="text-[11px] text-muted-foreground">Today's click rate</p>
          </div>

          {/* Today Top Country */}
          <div className="bg-card/70 backdrop-blur-sm p-4 rounded-2xl border border-border/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Top Country
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">Today</span>
            </div>
            <div className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate flex items-center gap-1.5 pt-0.5">
              {todayTopCountry ? (
                <>
                  <span className="text-xl">{todayTopCountry.flag}</span>
                  <span className="truncate">{todayTopCountry.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-sm font-medium">No traffic yet</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {todayTopCountry ? `${todayTopCountry.count} visitors today` : 'Awaiting visitors'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SELECTED TIMEFRAME KPI CARDS ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            {selectedPeriodLabel} Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Views */}
          <Card className="border-border/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all rounded-3xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Total Page Views</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                  <Eye className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-foreground">{views.toLocaleString()}</span>
                {typeof period === 'number' && period > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                    diffViews >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {diffViews >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(diffViews)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Profile visits in timeframe</p>
            </CardContent>
          </Card>

          {/* Total Clicks */}
          <Card className="border-border/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all rounded-3xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Total Link Clicks</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
                  <MousePointerClick className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-foreground">{clicks.toLocaleString()}</span>
                {typeof period === 'number' && period > 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                    diffClicks >= 0
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {diffClicks >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(diffClicks)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">All link & promo clicks</p>
            </CardContent>
          </Card>

          {/* Click Through Rate */}
          <Card className="border-border/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all rounded-3xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Click-Through Rate</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-foreground">{ctr}%</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {ctr > 20 ? 'High' : ctr > 5 ? 'Good' : 'Normal'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Engagement conversion</p>
            </CardContent>
          </Card>

          {/* Average Daily Clicks */}
          <Card className="border-border/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all rounded-3xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {period === 'today' || period === '24h' ? 'Peak Momentum' : 'Avg Daily Clicks'}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-black text-foreground">
                  {typeof period === 'number' && period > 0
                    ? (Math.round((clicks / period) * 10) / 10).toFixed(1)
                    : clicks.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {period === 'today' ? 'Live' : 'Avg/Day'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Speed of audience clicks</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── CLICK ACTIVITY TIMELINE CHART ───────────────────────────────── */}
      <Card className="border-border/80 shadow-md rounded-3xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Engagement & Click Activity
              </CardTitle>
              <CardDescription className="text-xs">
                {period === 'today' || period === '24h' ? 'Hourly click trend' : 'Daily click performance timeline'}
              </CardDescription>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              {clicks} total clicks
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clickTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.12)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#D97706"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#D97706', strokeWidth: 1, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#78350F', strokeWidth: 2 }}
                  fillOpacity={1}
                  fill="url(#amberGlowGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── GRID: TOP PERFORMING LINKS & REFERRERS ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <Card className="border-border/80 shadow-md rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Top Performing Links
              </CardTitle>
              <span className="text-[11px] font-bold text-muted-foreground">{topLinks.length} active</span>
            </div>
            <CardDescription className="text-xs">
              Includes both your custom bio links & Facera promo links
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 space-y-3.5">
            {topLinks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Compass className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground">No link clicks recorded yet</p>
                <p>Share your link or promo URL to start seeing click insights!</p>
              </div>
            ) : (
              topLinks.map((link, idx) => {
                const percent = Math.round((link.clicks / maxTopLinkClicks) * 100);
                return (
                  <div key={link.title + idx} className="p-3 rounded-2xl bg-muted/30 border border-border/50 space-y-2 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-6 h-6 rounded-lg font-black text-[11px] flex items-center justify-center flex-shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-neutral-300 text-neutral-900'
                            : idx === 2
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          #{idx + 1}
                        </span>
                        <span className="truncate text-foreground font-semibold flex items-center gap-1.5">
                          {link.title}
                          {link.isApp && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              App Promo
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="font-black font-mono text-amber-700 dark:text-amber-400 flex-shrink-0 text-sm">
                        {link.clicks.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">clicks</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources & Referrers */}
        <Card className="border-border/80 shadow-md rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Traffic Sources & Apps
              </CardTitle>
              <span className="text-[11px] font-bold text-muted-foreground">Where visitors come from</span>
            </div>
            <CardDescription className="text-xs">
              Instagram, TikTok, YouTube, direct visits, & campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 space-y-3.5">
            {referrers.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Share2 className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground">No traffic source data yet</p>
                <p>Visitor sources will appear here as soon as clicks arrive.</p>
              </div>
            ) : (
              referrers.map((ref, idx) => {
                const percent = Math.round((ref.count / totalReferrerCount) * 100);
                return (
                  <div key={ref.source + idx} className="p-3 rounded-2xl bg-muted/30 border border-border/50 space-y-2 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="truncate text-foreground flex items-center gap-2 font-semibold">
                        <span className="text-base">{ref.icon}</span>
                        {ref.source}
                      </span>
                      <span className="font-mono text-muted-foreground text-xs">
                        <span className="font-bold text-foreground">{ref.count}</span> ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── GRID: FULL COUNTRY NAMES & DEVICES ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Geographic Breakdown */}
        <Card className="border-border/80 shadow-md rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Geographic Locations (Full Country Names)
              </CardTitle>
              <span className="text-[11px] font-bold text-muted-foreground">{countries.length} countries</span>
            </div>
            <CardDescription className="text-xs">
              Visitor locations detected via global edge IP headers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 space-y-3.5">
            {countries.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground">No geographic data yet</p>
                <p>Countries will populate as soon as visitors arrive from around the globe.</p>
              </div>
            ) : (
              countries.map((c, idx) => {
                const percent = Math.round((c.count / totalCountryCount) * 100);
                return (
                  <div key={c.code + idx} className="p-3 rounded-2xl bg-muted/30 border border-border/50 space-y-2 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{c.flag}</span>
                        <div className="truncate">
                          <span className="font-extrabold text-foreground">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono ml-1.5 font-normal">({c.code})</span>
                        </div>
                      </div>
                      <span className="font-mono text-muted-foreground text-xs flex-shrink-0">
                        <span className="font-bold text-foreground">{c.count}</span> ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Operating Systems & Devices */}
        <Card className="border-border/80 shadow-md rounded-3xl overflow-hidden flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Operating Systems & Devices
              </CardTitle>
              <span className="text-[11px] font-bold text-muted-foreground">{devices.length} types</span>
            </div>
            <CardDescription className="text-xs">
              Mobile vs Desktop audience distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-6">
            {devices.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2 my-auto">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <p className="font-semibold text-foreground">No device data yet</p>
                <p>Operating systems (iOS, Android, macOS, Windows) will appear here.</p>
              </div>
            ) : (
              <>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devices}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {devices.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            stroke="rgba(0,0,0,0.1)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {devices.map((d, idx) => {
                    const percent = Math.round((d.count / totalDeviceCount) * 100);
                    return (
                      <div key={d.device + idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/30 border border-border/40">
                        <span className="flex items-center gap-2 font-bold text-foreground">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          {d.device}
                        </span>
                        <span className="font-mono text-muted-foreground text-xs">
                          <span className="font-bold text-foreground">{d.count}</span> ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
