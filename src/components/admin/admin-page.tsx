'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from '@/components/ui/toast';
import {
  getCommissionHistory,
  markCommissionPeriodPaid,
  getAffiliatesForAdmin,
  getAllTransactionsForAdmin,
  setCreatorRate,
  getCommissionData,
  type AdminAffiliate,
  type AdminTransaction,
} from '@/app/dashboard/earnings-actions';
import { formatMoney } from '@/lib/commissions';
import type { CommissionPeriod, CommissionData } from '@/lib/types';
import {
  Wallet, Users, MousePointerClick, Coins, Percent, Loader2, Check, X,
  Save, ChevronLeft, ChevronRight, ArrowLeft, ShoppingCart, ShieldCheck
} from 'lucide-react';
import { lastNMonths } from '@/lib/commissions';

export function AdminPage() {
  const months = lastNMonths(12);
  const [period, setPeriod] = useState(() => months[months.length - 1]);
  const [data, setData] = useState<CommissionData | null>(null);
  const [periods, setPeriods] = useState<CommissionPeriod[]>([]);
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPeriod, setSavingPeriod] = useState<string | null>(null);
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [commissionData, history, affs, txs] = await Promise.all([
        getCommissionData(period),
        getCommissionHistory(),
        getAffiliatesForAdmin(),
        getAllTransactionsForAdmin(period),
      ]);
      setData(commissionData);
      setPeriods(history);
      setAffiliates(affs);
      setTransactions(txs);
      setRateInputs(Object.fromEntries(affs.map(a => [a.profileId, String(Math.round(a.rate * 100))])));
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

  const handleSaveRate = async (a: AdminAffiliate) => {
    const value = Number(rateInputs[a.profileId]);
    if (isNaN(value) || value < 0 || value > 30) {
      toast.add({ title: 'Invalid rate', description: 'Enter a rate between 0 and 30.', type: 'error' });
      return;
    }
    setSavingRate(a.profileId);
    try {
      const result = await setCreatorRate(a.profileId, value / 100);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else { toast.add({ title: `Rate set to ${value}%`, type: 'success' }); load(); }
    } finally { setSavingRate(null); }
  };

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
  const totalSales = d?.affiliates.reduce((s, a) => s + a.sales, 0) ?? transactions.length;
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

        {/* All Subscriber Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-700" /> Transactions ({transactions.length}) — {period}
              </CardTitle>
              <Button size="xs" variant="outline" onClick={load} className="h-7 text-xs">
                Refresh
              </Button>
            </div>
            <CardDescription className="text-xs">
              Every purchase recorded from the RevenueCat webhook, mapped to the attributed creator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No transactions recorded for {period} yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground text-left">
                      <th className="py-2 pr-3 font-semibold">Date</th>
                      <th className="py-2 px-3 font-semibold">Creator / Ref</th>
                      <th className="py-2 px-3 font-semibold">Type</th>
                      <th className="py-2 px-3 font-semibold text-right">Price</th>
                      <th className="py-2 pl-3 font-semibold text-right">30% Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/40">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                          {new Date(t.purchased_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          {t.username ? (
                            <span className="text-amber-800 font-mono">@{t.username}</span>
                          ) : t.ref ? (
                            <span className="text-neutral-500 font-mono">@{t.ref} (unmatched)</span>
                          ) : (
                            <span className="text-muted-foreground">Direct (No Ref)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground uppercase text-[10px] font-mono">
                          {t.event_type}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {formatMoney(t.price, t.currency)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-bold text-amber-700">
                          {formatMoney(t.commission, t.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creators table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-700" /> Creators — {period}
            </CardTitle>
            <CardDescription className="text-xs">
              Per-creator clicks, new subscribers and earned commission. Rates only affect future payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {affiliates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No opted-in creators yet.</p>
            ) : (
              <div className="divide-y divide-muted/40 text-sm">
                {affiliates.map(a => (
                  <div key={a.profileId} className="flex items-center justify-between py-2.5 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-semibold truncate">@{a.username}</span>
                      <span className="text-xs text-muted-foreground truncate">{a.displayName}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-[70px]">
                        <MousePointerClick className="w-3 h-3" /> {a.clicks30d.toLocaleString()} clicks
                      </span>
                      <span className="text-xs font-semibold flex items-center gap-1 min-w-[70px]">
                        <ShoppingCart className="w-3 h-3 text-amber-600" /> {a.sales30d} sales
                      </span>
                      <span className="text-xs font-bold text-amber-700 min-w-[75px] text-right">
                        {formatMoney(a.commission30d, currency)}
                      </span>
                      <div className="w-16">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number" min={0} max={30}
                            value={rateInputs[a.profileId] ?? String(Math.round(a.rate * 100))}
                            onChange={e => setRateInputs(prev => ({ ...prev, [a.profileId]: e.target.value }))}
                            className="h-7 w-12 text-xs font-semibold"
                          />
                          <span className="text-xs font-bold text-muted-foreground">%</span>
                        </div>
                      </div>
                      <Button
                        size="xs" variant="outline"
                        onClick={() => handleSaveRate(a)}
                        disabled={savingRate === a.profileId}
                        className="h-7"
                      >
                        {savingRate === a.profileId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
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
                        {d?.revenue ? `${formatMoney(d.revenue.proceeds, d.revenue.currency)} net revenue` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-amber-700 w-24 text-right">{formatMoney(p.total_pool, p.currency)}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        p.is_paid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {p.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                      <Button
                        size="xs" variant="outline"
                        onClick={() => handleToggle(p, !p.is_paid)}
                        disabled={savingPeriod === p.period}
                        className="h-7"
                      >
                        {savingPeriod === p.period ? <Loader2 className="w-3 h-3 animate-spin" /> : (p.is_paid ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                      </Button>
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
