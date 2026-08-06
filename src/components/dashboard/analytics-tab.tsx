'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart, Area, BarChart, PieChart,
  ResponsiveContainer, Bar, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { Eye, MousePointerClick, Percent, TrendingUp, Globe, Smartphone, Share2, Calendar, Award } from 'lucide-react';

const PERIODS = [
  { label: 'Last 7 Days', shortLabel: '7d', value: 7 },
  { label: 'Last 30 Days', shortLabel: '30d', value: 30 },
  { label: 'All Time', shortLabel: 'All', value: 0 },
] as const;

const CHART_COLORS = ['#D97706', '#2563EB', '#059669', '#7C3AED', '#DB2777', '#0891B2'];

function extractReferrerDomain(ref: string | null): string {
  if (!ref) return 'Direct / Social Bio';
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

export function AnalyticsTab({ profileId }: { profileId: string; username: string }) {
  const supabase = createClient();
  const [days, setDays] = useState(7);
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
    const fetch = async () => {
      const now = new Date();
      const periodStart = days === 0 ? new Date('2020-01-01') : new Date(now.getTime() - days * 86400000);
      const prevStart = days === 0 ? new Date('2020-01-01') : new Date(periodStart.getTime() - days * 86400000);
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
      const buckets = days > 0 ? days : 30;
      const clickMap = new Map<string, number>();
      for (let i = 0; i < buckets; i++) { const d = new Date(now); d.setDate(d.getDate() - (buckets - 1 - i)); clickMap.set(d.toISOString().slice(0, 10), 0); }
      for (const c of clickData || []) { const k = c.created_at.slice(0, 10); clickMap.set(k, (clickMap.get(k) || 0) + 1); }
      setClickTrend(Array.from(clickMap.entries()).map(([date, clicks]) => ({ date, clicks })));

      const { data: allClicks } = await supabase.from('click_events').select('link_id').eq('profile_id', profileId).gte('created_at', since);
      if (allClicks?.length) {
        const counts = new Map<string, number>();
        for (const c of allClicks) counts.set(c.link_id, (counts.get(c.link_id) || 0) + 1);
        const topIds = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
        const { data: linkData } = await supabase.from('links').select('id, title').in('id', topIds);
        setTopLinks((linkData || []).map(l => ({ title: l.title, clicks: counts.get(l.id) || 0 })).sort((a, b) => b.clicks - a.clicks));
      }

      const { data: refClicks } = await supabase.from('click_events').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null);
      const { data: refViews } = await supabase.from('page_views').select('referrer').eq('profile_id', profileId).gte('created_at', since).not('referrer', 'is', null);
      const refMap = new Map<string, number>();
      for (const r of [...(refClicks || []), ...(refViews || [])]) { const d = extractReferrerDomain(r.referrer); refMap.set(d, (refMap.get(d) || 0) + 1); }
      setReferrers(Array.from(refMap.entries()).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count).slice(0, 6));

      const { data: cClicks } = await supabase.from('click_events').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null);
      const { data: cViews } = await supabase.from('page_views').select('country').eq('profile_id', profileId).gte('created_at', since).not('country', 'is', null);
      const countryMap = new Map<string, number>();
      for (const c of [...(cClicks || []), ...(cViews || [])]) { if (c.country) countryMap.set(c.country, (countryMap.get(c.country) || 0) + 1); }
      setCountries(Array.from(countryMap.entries()).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 5));

      const { data: dClicks } = await supabase.from('click_events').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null);
      const { data: dViews } = await supabase.from('page_views').select('device_type').eq('profile_id', profileId).gte('created_at', since).not('device_type', 'is', null);
      const deviceMap = new Map<string, number>();
      const osIcons: Record<string, string> = {
        iOS: '🍎', Android: '🤖', macOS: '💻', Windows: '🪟', Linux: '🐧', ChromeOS: '📘',
      };
      for (const d of [...(dClicks || []), ...(dViews || [])]) {
        if (d.device_type) deviceMap.set(d.device_type, (deviceMap.get(d.device_type) || 0) + 1);
      }
      setDevices(
        Array.from(deviceMap.entries())
          .map(([device, count]) => ({
            device: `${osIcons[device] || '📱'} ${device}`,
            count,
          }))
          .sort((a, b) => b.count - a.count)
      );
    };
    fetch();
  }, [profileId, days]);

  const diffViews = views - prevViews;
  const diffClicks = clicks - prevClicks;

  const stats = [
    {
      label: 'Total Page Views',
      value: views.toLocaleString(),
      change: diffViews,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200/60',
      iconBg: 'bg-blue-600 text-white',
    },
    {
      label: 'Total Link Clicks',
      value: clicks.toLocaleString(),
      change: diffClicks,
      icon: MousePointerClick,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/60',
      iconBg: 'bg-amber-600 text-white',
    },
    {
      label: 'Click-Through Rate',
      value: `${ctr}%`,
      change: 0,
      icon: Percent,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
      iconBg: 'bg-emerald-600 text-white',
      hideChange: true,
    },
    {
      label: 'Avg Daily Clicks',
      value: days > 0 ? Math.round(clicks / days).toLocaleString() : '—',
      change: 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200/60',
      iconBg: 'bg-purple-600 text-white',
      hideChange: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-700" /> Performance Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time visitor trends & link engagement insights</p>
        </div>

        {/* Time Period Selector */}
        <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-xl border border-border/60 w-fit shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1" />
          {PERIODS.map(({ label, shortLabel, value }) => (
            <button
              key={label}
              onClick={() => setDays(value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                days === value
                  ? 'bg-card text-foreground shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, bg, iconBg, hideChange }) => (
          <Card key={label} className={`border ${bg} shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!hideChange && change !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    change > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    <span>{change > 0 ? '↑' : '↓'}</span>
                    <span>{Math.abs(change)}</span>
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-foreground">{value}</div>
                <div className="text-xs font-medium text-muted-foreground mt-1">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Click Activity Area Chart */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MousePointerClick className="w-4.5 h-4.5 text-amber-700" /> Click Activity Trend
            </CardTitle>
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
              {days === 0 ? 'All Time' : `Past ${days} Days`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {clickTrend.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
              <span className="text-3xl mb-2">🐮</span>
              <p>No click activity recorded for this period yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={clickTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clickAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#7A756D' }}
                  tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A756D' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E5E0D5',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  labelFormatter={(d) => {
                    try {
                      return new Date(d as string).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    } catch { return d; }
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#D97706"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#clickAreaGradient)"
                  activeDot={{ r: 6, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Grid of Secondary Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Links */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-amber-700" /> Top Performing Links
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {topLinks.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No link click data available yet 🐮</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topLinks} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" opacity={0.5} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#7A756D' }} />
                  <YAxis dataKey="title" type="category" width={110} tick={{ fontSize: 11, fill: '#7A756D', fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #E5E0D5', backgroundColor: '#FFFFFF' }}
                  />
                  <Bar dataKey="clicks" fill="#D97706" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="w-4.5 h-4.5 text-emerald-600" /> Traffic Sources & Referrers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {referrers.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No referrer data recorded yet 🐮</div>
            ) : (
              <div className="space-y-3.5">
                {referrers.map(({ source, count }, i) => {
                  const maxCount = referrers[0].count || 1;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={source} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground flex items-center gap-1.5">{source}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">{count} clicks ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 shadow-2xs"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-blue-600" /> Top Visitor Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {countries.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No location data yet 🐮</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={countries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" opacity={0.5} />
                  <XAxis dataKey="country" tick={{ fontSize: 11, fill: '#7A756D', fontWeight: 600 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A756D' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E0D5', backgroundColor: '#FFFFFF' }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smartphone className="w-4.5 h-4.5 text-purple-600" /> Visitor Operating Systems
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {devices.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">No device data yet 🐮</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
                  >
                    {devices.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #E5E0D5', backgroundColor: '#FFFFFF' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

