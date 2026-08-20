'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import {
  Eye, MousePointerClick, Percent, TrendingUp,
  Globe, Smartphone, Share2, Award, ArrowUpRight, ArrowDownRight, Sparkles, Loader2,
} from 'lucide-react';

const PERIODS = [
  { label: 'Last 7 Days', value: 7 },
  { label: 'Last 30 Days', value: 30, proOnly: true },
  { label: 'All Time', value: 0, proOnly: true },
] as const;

const CHART_COLORS = ['#D97706', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#0891B2'];

function extractReferrerDomain(ref: string | null): string {
  if (!ref) return 'Direct / Social Bio';
  if (ref.startsWith('ref:')) {
    return `🏷️ Campaign: ${ref.slice(4)}`;
  }
  try {
    const host = new URL(ref).hostname.replace('www.', '');
    const map: Record<string, string> = {
      'instagram.com': 'Instagram',
      'twitter.com': 'Twitter / X', 'x.com': 'Twitter / X',
      'facebook.com': 'Facebook', 'tiktok.com': 'TikTok',
      'linkedin.com': 'LinkedIn', 'youtube.com': 'YouTube',
      't.me': 'Telegram', 'whatsapp.com': 'WhatsApp', 'reddit.com': 'Reddit',
    };
    return map[host] || host;
  } catch { return 'Direct / Other'; }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5" />
          {payload[0].value} {payload[0].value === 1 ? 'click' : 'clicks'}
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsTab({ profileId, username, isPro }: { profileId: string; username: string; isPro: boolean }) {
  const supabase = createClient();
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [ctr, setCtr] = useState(0);
  const [prevViews, setPrevViews] = useState(0);
  const [prevClicks, setPrevClicks] = useState(0);
  const [clickTrend, setClickTrend] = useState<{ date: string; clicks: number }[]>([]);
  const [topLinks, setTopLinks] = useState<{ title: string; clicks: number }[]>([]);
  const [referrers, setReferrers] = useState<{ source: string; count: number }[]>([]);
  const [countries, setCountries] = useState<{ country: string; count: number }[]>([]);
  const [devices, setDevices] = useState<{ device: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchAnalytics = async () => {
      setLoading(true);
      const now = new Date();
      const periodStart = days === 0 ? new Date(0) : new Date(now.getTime() - days * 86400000);
      const prevStart = days === 0 ? new Date(0) : new Date(periodStart.getTime() - days * 86400000);
      const since = periodStart.toISOString();
      const prevSince = prevStart.toISOString();
      const currentEnd = now.toISOString();

      const { count: viewsNow } = await supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', since).lte('created_at', currentEnd);
      const { count: viewsPrev } = await supabase.from('page_views').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', prevSince).lt('created_at', since);
      const { count: clicksNow } = await supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', since).lte('created_at', currentEnd);
      const { count: clicksPrev } = await supabase.from('click_events').select('*', { count: 'exact', head: true }).eq('profile_id', profileId).gte('created_at', prevSince).lt('created_at', since);

      setViews(viewsNow || 0); setPrevViews(viewsPrev || 0);
      setClicks(clicksNow || 0); setPrevClicks(clicksPrev || 0);
      setCtr((viewsNow || 0) > 0 ? Math.round(((clicksNow || 0) / (viewsNow || 1)) * 100) : 0);

      const { data: clickData } = await supabase.from('click_events').select('created_at').eq('profile_id', profileId).gte('created_at', since).order('created_at', { ascending: true });
      let buckets: number;
      if (days > 0) {
        buckets = days;
      } else if (clickData && clickData.length > 0) {
        const earliest = new Date(clickData[0].created_at);
        const spanDays = Math.ceil((now.getTime() - earliest.getTime()) / 86400000) + 1;
        buckets = Math.min(spanDays, 30);
      } else {
        buckets = 30;
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
        if (clickMap.has(formatted)) clickMap.set(formatted, (clickMap.get(formatted) || 0) + 1);
      }
      setClickTrend(Array.from(clickMap.entries()).map(([date, clicks]) => ({ date, clicks })));

      const { data: allClicks } = await supabase.from('click_events').select('link_id').eq('profile_id', profileId).gte('created_at', since);
      if (allClicks?.length) {
        const counts = new Map<string, number>();
        for (const c of allClicks) counts.set(c.link_id, (counts.get(c.link_id) || 0) + 1);
        const topIds = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
        const { data: linkData } = await supabase.from('links').select('id, title').in('id', topIds);
        setTopLinks((linkData || []).map(l => ({ title: l.title, clicks: counts.get(l.id) || 0 })).sort((a, b) => b.clicks - a.clicks));
      } else {
        setTopLinks([]);
      }

      const { data: refClicks } = isPro ? await supabase.from('click_events').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null) : { data: null };
      const { data: refViews } = isPro ? await supabase.from('page_views').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null) : { data: null };
      const refMap = new Map<string, number>();
      for (const r of [...(refClicks || []), ...(refViews || [])]) { const d = extractReferrerDomain(r.referrer); refMap.set(d, (refMap.get(d) || 0) + 1); }
      setReferrers(Array.from(refMap.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 5));

      const { data: cClicks } = isPro ? await supabase.from('click_events').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null) : { data: null };
      const { data: cViews } = isPro ? await supabase.from('page_views').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null) : { data: null };
      const countryMap = new Map<string, number>();
      for (const c of [...(cClicks || []), ...(cViews || [])]) { if (c.country) countryMap.set(c.country, (countryMap.get(c.country) || 0) + 1); }
      setCountries(Array.from(countryMap.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 5));

      const { data: dClicks } = isPro ? await supabase.from('click_events').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null) : { data: null };
      const { data: dViews } = isPro ? await supabase.from('page_views').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null) : { data: null };
      const deviceMap = new Map<string, number>();
      for (const d of [...(dClicks || []), ...(dViews || [])]) {
        if (d.device_type) deviceMap.set(d.device_type, (deviceMap.get(d.device_type) || 0) + 1);
      }
      setDevices(
        Array.from(deviceMap.entries())
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count)
      );
      if (!cancelled) setLoading(false);
    };

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [profileId, days, isPro]);

  const diffViews = views - prevViews;
  const diffClicks = clicks - prevClicks;
  const avgDailyClicks = days > 0 ? Math.round((clicks / days) * 10) / 10 : clicks;

  const totalReferrerCount = referrers.reduce((acc, r) => acc + r.count, 0) || 1;
  const totalCountryCount = countries.reduce((acc, c) => acc + c.count, 0) || 1;
  const maxTopLinkClicks = topLinks[0]?.clicks || 1;

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-8 bg-background/40 backdrop-blur-[2px] rounded-2xl">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" /> Loading analytics...
          </div>
        </div>
      )}
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" /> Analytics Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time performance metrics for <span className="font-semibold text-foreground">moolink.xyz/{username}</span>
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
          {PERIODS.map((period) => {
            const locked = ('proOnly' in period && period.proOnly) && !isPro;
            return (
              <button
                key={period.value}
                onClick={() => !locked && setDays(period.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  days === period.value
                    ? 'bg-amber-800 text-white shadow-xs'
                    : locked
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={locked ? 'Upgrade to Pro for extended analytics' : undefined}
              >
                {locked ? '🔒 ' : ''}{period.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views Card */}
        <Card className="border-border shadow-2xs hover:border-amber-400/60 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Views</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">{views.toLocaleString()}</span>
              {days > 0 && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  diffViews >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                }`}>
                  {diffViews >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(diffViews)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Clicks Card */}
        <Card className="border-border shadow-2xs hover:border-amber-400/60 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Clicks</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center">
                <MousePointerClick className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">{clicks.toLocaleString()}</span>
              {days > 0 && (
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  diffClicks >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                }`}>
                  {diffClicks >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(diffClicks)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Click Through Rate Card */}
        <Card className="border-border shadow-2xs hover:border-amber-400/60 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Click-Through Rate</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">{ctr}%</span>
              <span className="text-[11px] text-muted-foreground font-medium">Clicks / Views</span>
            </div>
          </CardContent>
        </Card>

        {/* Avg Daily Clicks Card */}
        <Card className="border-border shadow-2xs hover:border-amber-400/60 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg Daily Clicks</span>
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-foreground">{avgDailyClicks}</span>
              <span className="text-[11px] text-muted-foreground font-medium">per day</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Click Trend Chart */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-amber-700" /> Click Activity Over Time
          </CardTitle>
          <CardDescription className="text-xs">
            Daily engagement history for your links
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clickTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#amberGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Grid Section: Top Links & Referrer Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <Card className="border-border shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" /> Top Performing Links
            </CardTitle>
            <CardDescription className="text-xs">
              Your most clicked links in this timeframe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No link clicks recorded yet 🐮</p>
            ) : (
              topLinks.map((link, idx) => {
                const percent = Math.round((link.clicks / maxTopLinkClicks) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate max-w-[220px] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="truncate">{link.title}</span>
                      </span>
                      <span className="text-amber-800 dark:text-amber-400 font-bold">{link.clicks} clicks</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-800 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources (Referrers) - Pro Only */}
        <Card className="border-border shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-amber-700" /> Traffic Sources
            </CardTitle>
            <CardDescription className="text-xs">
              Where your profile visitors are coming from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPro ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground mb-2">🔒 Pro feature</p>
                <p className="text-xs text-muted-foreground">Upgrade to see where your visitors come from</p>
              </div>
            ) : referrers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No referrer data recorded yet 🐮</p>
            ) : (
              referrers.map((ref, idx) => {
                const percent = Math.round((ref.count / totalReferrerCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-800" />
                        {ref.source}
                      </span>
                      <span className="text-muted-foreground font-mono">{ref.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-800 h-full rounded-full transition-all duration-500"
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

      {/* Grid Section: Device Breakdown & Geographic Location - Pro Only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device & OS Distribution */}
        <Card className="border-border shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-700" /> Operating Systems & Devices
            </CardTitle>
            <CardDescription className="text-xs">
              Visitor device types
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {!isPro ? (
              <div className="text-center py-8 w-full">
                <p className="text-xs text-muted-foreground mb-2">🔒 Pro feature</p>
                <p className="text-xs text-muted-foreground">Upgrade to see device & OS breakdown</p>
              </div>
            ) : devices.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 w-full">No device data recorded yet 🐮</p>
            ) : (
              <>
                <div className="h-44 w-44 flex-shrink-0 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={devices}
                        dataKey="count"
                        nameKey="device"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {devices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-2.5">
                  {devices.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                        />
                        {d.device}
                      </span>
                      <span className="font-bold text-foreground">{d.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Country Breakdown */}
        <Card className="border-border shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-700" /> Geographic Location
            </CardTitle>
            <CardDescription className="text-xs">
              Top countries of your visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPro ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground mb-2">🔒 Pro feature</p>
                <p className="text-xs text-muted-foreground">Upgrade to see visitor geography</p>
              </div>
            ) : countries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No country data recorded yet 🐮</p>
            ) : (
              countries.map((c, idx) => {
                const percent = Math.round((c.count / totalCountryCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="truncate text-foreground font-mono">
                        🌐 {c.country}
                      </span>
                      <span className="text-muted-foreground font-mono">{c.count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-800 h-full rounded-full transition-all duration-500"
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
    </div>
  );
}
