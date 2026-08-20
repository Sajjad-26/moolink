'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { toast, Toaster } from '@/components/ui/toast';
import {
  getCommissionHistory,
  markCommissionPeriodPaid,
  getAffiliatesForAdmin,
  getGlobalCommissionRate,
  setGlobalCommissionRate,
  getCommissionData,
  type AdminAffiliate,
} from '@/app/dashboard/earnings-actions';
import { formatMoney } from '@/lib/commissions';
import type { CommissionPeriod, CommissionData } from '@/lib/types';
import {
  Wallet, Users, MousePointerClick, Coins, Percent, Loader2, Check, X,
  Save, ChevronLeft, ChevronRight, ArrowLeft, ShieldCheck, Settings
} from 'lucide-react';
import { lastNMonths } from '@/lib/commissions';

export function AdminPage() {
  const months = lastNMonths(12);
  const [period, setPeriod] = useState(() => months[months.length - 1]);
  const [data, setData] = useState<CommissionData | null>(null);
  const [periods, setPeriods] = useState<CommissionPeriod[]>([]);
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPeriod, setSavingPeriod] = useState<string | null>(null);
  const [globalRate, setGlobalRate] = useState<string>('30');
  const [savingGlobalRate, setSavingGlobalRate] = useState(false);
  const [sortBy, setSortBy] = useState<'commission' | 'clicks' | 'sales'>('commission');

  const load = async () => {
    setLoading(true);
    try {
      const [commissionData, history, affs, globalRateValue] = await Promise.all([
        getCommissionData(period),
        getCommissionHistory(),
        getAffiliatesForAdmin(),
        getGlobalCommissionRate(),
      ]);
      setData(commissionData);
      setPeriods(history);
      setAffiliates(affs);
      setGlobalRate(String(Math.round(globalRateValue * 100)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    load().then(() => { if (!cancelled) return; });
    return () => { cancelled = true; };
  }, [period]);

  const handleToggle = async (p: CommissionPeriod, paid: boolean) => {
    setSavingPeriod(p.period);
    try {
      const result = await markCommissionPeriodPaid(p.period, paid);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else { toast.add({ title: paid ? 'Marked as paid' : 'Marked as unpaid', type: 'success' }); load(); }
    } finally { setSavingPeriod(null); }
  };

  const handleSaveGlobalRate = async () => {
    const value = Number(globalRate);
    if (isNaN(value) || value < 0 || value > 30) {
      toast.add({ title: 'Invalid rate', description: 'Enter a rate between 0 and 30.', type: 'error' });
      return;
    }
    setSavingGlobalRate(true);
    try {
      const result = await setGlobalCommissionRate(value / 100);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else { toast.add({ title: `Global rate set to ${value}%`, type: 'success' }); load(); }
    } finally { setSavingGlobalRate(false); }
  };

  const sortedAffiliates = [...affiliates].sort((a, b) => {
    if (sortBy === 'commission') return b.commission30d - a.commission30d;
    if (sortBy === 'clicks') return b.clicks30d - a.clicks30d;
    if (sortBy === 'sales') return b.sales30d - a.sales30d;
    return 0;
  });

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
      </div>
    );
  }

  const d = data;
  const currency = d?.revenue?.currency ?? 'USD';
  const totalCommission = d?.affiliates.reduce((s, a) => s + a.commission, 0) ?? 0;
  const totalSales = d?.affiliates.reduce((s, a) => s + a.sales, 0) ?? 0;
  const totalClicks = d?.affiliates.reduce((s, a) => s + a.clicks, 0) ?? 0;

  return (
    <div className="min-h-screen cow-patch-bg pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold bg-muted/80 px-2.5 py-1 rounded-lg border border-border transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Dashboard
              </Link>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase">
                <ShieldCheck className="w-3 h-3" /> Admin Portal
              </span>
            </div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-amber-700" /> Facera Affiliate Commissions
            </h1>
            <p className="text-sm text-muted-foreground">
              Flat 30% commission per new subscriber. Review creators, transactions, and payouts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/70 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => { const i = months.indexOf(period); if (i > 0) setPeriod(months[i - 1]); }}
              disabled={months.indexOf(period) <= 0}
              className="p-1.5 rounded-md hover:bg-card disabled:opacity-30 text-muted-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 min-w-[90px] text-center">{period}</span>
            <button
              type="button"
              onClick={() => { const i = months.indexOf(period); if (i < months.length - 1) setPeriod(months[i + 1]); }}
              disabled={months.indexOf(period) >= months.length - 1}
              className="p-1.5 rounded-md hover:bg-card disabled:opacity-30 text-muted-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <MousePointerClick className="w-3.5 h-3.5" /> Total clicks
              </div>
              <div className="text-2xl font-extrabold">{totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Users className="w-3.5 h-3.5" /> New subscribers
              </div>
              <div className="text-2xl font-extrabold">{totalSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Coins className="w-3.5 h-3.5" /> Total commission
              </div>
              <div className="text-2xl font-extrabold text-amber-700">{formatMoney(totalCommission, currency)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Percent className="w-3.5 h-3.5" /> Default Rate
              </div>
              <div className="text-2xl font-extrabold">30%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">flat per new subscriber</div>
            </CardContent>
          </Card>
        </div>


        {/* Global Settings */}
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Settings className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-amber-950">Global Default Commission Rate</h3>
                <p className="text-xs text-amber-700/80">Applied automatically to all new creators and creators without a custom rate.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-md px-2 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                <Input
                  type="number" min={0} max={30}
                  value={globalRate}
                  onChange={e => setGlobalRate(e.target.value)}
                  className="h-9 w-16 text-sm font-bold border-0 focus-visible:ring-0 px-1 text-right"
                />
                <span className="text-sm font-bold text-muted-foreground">%</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveGlobalRate}
                disabled={savingGlobalRate}
                className="h-9 bg-amber-700 hover:bg-amber-800 text-white shadow-sm"
              >
                {savingGlobalRate ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creator Directory (Redesigned) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" /> Best Performers — {period}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs bg-muted/50 border border-border rounded-md px-2 py-1 outline-none font-semibold cursor-pointer"
                >
                  <option value="commission">Highest Commission</option>
                  <option value="sales">Most Sales</option>
                  <option value="clicks">Most Clicks</option>
                </select>
                <Button size="xs" variant="outline" onClick={load} className="h-7 text-xs">
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {sortedAffiliates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 px-4 text-center">No creators found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground text-left">
                      <th className="py-2 px-3 font-semibold">Creator</th>
                      <th className="py-2 px-3 font-semibold text-right">Clicks (30d)</th>
                      <th className="py-2 px-3 font-semibold text-right">Sales (30d)</th>
                      <th className="py-2 px-3 font-semibold text-right">Commission (30d)</th>
                      <th className="py-2 px-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/40">
                    {sortedAffiliates.map(a => (
                      <tr 
                        key={a.profileId} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group" 
                        onClick={() => window.location.href = `/admin/creator/${a.username}`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-amber-800 group-hover:underline decoration-amber-300 underline-offset-2">@{a.username}</span>
                              <span className="text-xs text-muted-foreground">{a.displayName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-medium">{a.clicks30d.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-medium">{a.sales30d.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-amber-700">{formatMoney(a.commission30d, currency)}</td>
                        <td className="py-3 px-3 text-right">
                          {a.isArchived ? (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-600 border-zinc-300">Archived</span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Payout history</CardTitle>
            <CardDescription className="text-xs">
              Total commission earned each month and whether it's been paid out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {periods.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No payout periods recorded yet.</p>
            ) : (
              <div className="divide-y divide-muted/40 text-sm">
                {periods.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{p.period}</span>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const [y, m] = p.period.split('-');
                          const expectedPayoutDate = new Date(Number(y), Number(m) + 1, 10);
                          return `(Expected payout: ${expectedPayoutDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
                        })()}
                      </span>
                    </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                        <span className="font-bold text-amber-700 sm:w-24 text-right">{formatMoney(p.total_pool, p.currency)}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border shadow-sm ${
                            p.is_paid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {p.is_paid ? '✓ PAID' : 'UNPAID'}
                          </span>
                          <Button
                            size="xs" variant={p.is_paid ? "outline" : "default"}
                            onClick={() => handleToggle(p, !p.is_paid)}
                            disabled={savingPeriod === p.period}
                            className={`h-7 px-3 text-[10px] font-bold ${!p.is_paid && 'bg-amber-800 hover:bg-amber-900 text-white'}`}
                          >
                            {savingPeriod === p.period ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : (p.is_paid ? <X className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />)}
                            {p.is_paid ? 'Undo' : 'Mark Paid'}
                          </Button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
