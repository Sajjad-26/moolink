'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from '@/components/ui/toast';
import { setAffiliateStatus, getCommissionData, getMyTransactions } from '@/app/dashboard/earnings-actions';
import { lastNMonths, formatMoney, formatPercent } from '@/lib/commissions';
import type { CommissionData, Profile, MyTransaction } from '@/lib/types';
import {
  Wallet, MousePointerClick, Coins, Percent, PartyPopper, Loader2,
  ChevronLeft, ChevronRight, ShoppingCart, Copy, Check, ExternalLink, Sparkles,
} from 'lucide-react';

export function EarningsTab({ profile }: { profile: Profile }) {
  const months = lastNMonths(12);
  const [period, setPeriod] = useState(() => months[months.length - 1]);
  const [data, setData] = useState<CommissionData | null>(null);
  const [tx, setTx] = useState<MyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [affiliateEnabled, setAffiliateEnabled] = useState(profile.is_affiliate);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const promoUrl = `https://moolink.xyz/facera?ref=${profile.username}`;

  const copyPromoLink = () => {
    navigator.clipboard.writeText(promoUrl);
    setCopiedLink(true);
    toast.add({ title: 'Link copied!', description: 'Share this link with your audience to earn 30%.', type: 'success' });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  useEffect(() => {
    let cancelled = false;
    const p = period;
    Promise.all([getCommissionData(p), affiliateEnabled && getMyTransactions(p)])
      .then(([commission, transactions]) => {
        if (!cancelled) {
          setData(commission);
          if (transactions) setTx(transactions);
        }
      })
      .catch(() => { if (!cancelled) { setData(null); setTx([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period, refreshKey, affiliateEnabled]);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      const result = await setAffiliateStatus(enabled);
      if (result.error) {
        toast.add({ title: 'Error', description: result.error, type: 'error' });
      } else {
        setAffiliateEnabled(enabled);
        toast.add({
          title: enabled ? 'You’re in the pool!' : 'Commission disabled',
          description: enabled ? 'Every new subscriber you bring in earns you 30%.' : undefined,
          type: 'success',
        });
        setRefreshKey(k => k + 1);
      }
    } finally {
      setToggling(false);
    }
  };

  const refreshTransactions = async () => {
    setTransactionsLoading(true);
    try {
      setTx(await getMyTransactions(period));
    } finally {
      setTransactionsLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
      </div>
    );
  }

  const d = data;
  const currency = d?.revenue?.currency ?? 'USD';
  const dFmt = (n: number, c: string) => formatMoney(n, c);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-700" /> Earnings
          </h2>
          <p className="text-sm text-muted-foreground">
            Earn 30% of net proceeds per new subscriber your promo link brings in.
          </p>
        </div>

        {/* Month selector */}
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

      {!d ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load earnings data. Try again in a moment.
          </CardContent>
        </Card>
      ) : !affiliateEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-amber-700" /> Become an affiliate
            </CardTitle>
            <CardDescription>
              Turn your MooLink page into a money-maker. Every Facera subscriber you
              refer through your promo link earns you a flat 30% of net proceeds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleToggle(true)}
              disabled={toggling}
              className="bg-amber-800 hover:bg-amber-900 text-white font-semibold"
            >
              {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
              Start earning commissions
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              You can turn this off anytime in Settings → Earnings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Promo Link Banner */}
          <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-card to-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Your Facera Promo Link
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  30% Commission Active
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                When users click this link, their clipboard copies your code <span className="font-semibold text-foreground">@{profile.username}</span> and redirects them to download Facera.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 font-mono text-xs bg-muted/80 border border-border px-3 py-2 rounded-lg truncate select-all">
                  {promoUrl}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={copyPromoLink}
                  className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold gap-1.5 h-8.5 px-3.5 flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copied!' : 'Copy Promo Link'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Creator KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card size="sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <MousePointerClick className="w-3.5 h-3.5" /> Your clicks
                </div>
                <div className="text-2xl font-extrabold">{d.myClicks.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{period}</div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <Wallet className="w-3.5 h-3.5" /> Your commission
                </div>
                <div className="text-2xl font-extrabold text-amber-700">{dFmt(d.myCommission, currency)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {d.isPaid ? '✓ Paid' : (() => {
                    const [y, m] = period.split('-');
                    const expectedPayoutDate = new Date(Number(y), Number(m), 10);
                    return `Pending (Expected ${expectedPayoutDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`;
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <Percent className="w-3.5 h-3.5" /> Your rate
                </div>
                <div className="text-2xl font-extrabold">{d.myRate > 0 ? formatPercent(d.myRate) : '—'}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">of each subscriber's net proceeds</div>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                  <ShoppingCart className="w-3.5 h-3.5" /> New subscribers
                </div>
                <div className="text-2xl font-extrabold">{d.affiliates.find(a => a.isSelf)?.sales ?? 0}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{period}</div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions — first-time purchases only */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-700" /> Your transactions ({tx.length})
                </CardTitle>
                <Button size="xs" variant="outline" onClick={refreshTransactions} disabled={transactionsLoading} className="h-7 text-xs">
                  {transactionsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
              <CardDescription className="text-xs">
                First-time purchases attributed to you this month. Renewals and
                cancellations are not shown (they earn no additional commission).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tx.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  No transactions recorded yet this month.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground text-left">
                        <th className="py-2 pr-3 font-semibold">Date</th>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold text-right">Price</th>
                        <th className="py-2 pl-3 font-semibold text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/40">
                      {tx.map(t => (
                        <tr key={t.id} className="hover:bg-muted/30">
                          <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                            {new Date(t.purchased_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground uppercase text-[10px] font-mono">
                            {t.event_type}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {dFmt(t.price, t.currency)}
                          </td>
                          <td className="py-2.5 pl-3 text-right font-bold text-amber-700">
                            {dFmt(t.commission, t.currency)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border font-bold bg-muted/20">
                        <td colSpan={3} className="py-3 pr-3 text-right">Total:</td>
                        <td className="py-3 pl-3 text-right text-amber-800 text-sm">
                          {dFmt(tx.reduce((s, t) => s + Number(t.commission), 0), currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Toaster />
    </div>
  );
}
