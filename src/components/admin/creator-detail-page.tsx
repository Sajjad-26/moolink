'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from '@/components/ui/toast';
import {
  setCreatorRate,
  archiveCreator,
  deleteCreator,
  getCreatorDetailData
} from '@/app/dashboard/earnings-actions';
import { formatMoney } from '@/lib/commissions';
import type { Profile } from '@/lib/types';
import {
  User, MousePointerClick, Coins, Loader2, ArrowLeft,
  Link2, Settings, Archive, Trash2, ShoppingCart, RefreshCw, Undo2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreatorDetailPage({ creator }: { creator: Profile }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(String(Math.round((creator.commission_rate ?? 0) * 100)));
  const [savingRate, setSavingRate] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getCreatorDetailData(creator.id);
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [creator.id]);

  const handleSaveRate = async () => {
    const value = Number(rate);
    if (isNaN(value) || value < 0 || value > 30) {
      toast.add({ title: 'Invalid rate', description: 'Enter a rate between 0 and 30.', type: 'error' });
      return;
    }
    setSavingRate(true);
    try {
      const result = await setCreatorRate(creator.id, value / 100);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else toast.add({ title: `Rate set to ${value}%`, type: 'success' });
    } finally { setSavingRate(false); }
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to ${creator.is_archived ? 'unarchive' : 'archive'} this creator?`)) return;
    setArchiving(true);
    try {
      const result = await archiveCreator(creator.id, !creator.is_archived);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else {
        toast.add({ title: creator.is_archived ? 'Creator unarchived' : 'Creator archived', type: 'success' });
        router.refresh();
      }
    } finally { setArchiving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you ABSOLUTELY sure? This will delete the creator and all their data forever.')) return;
    setDeleting(true);
    try {
      const result = await deleteCreator(creator.id);
      if (result?.error) toast.add({ title: 'Error', description: result.error, type: 'error' });
      else {
        toast.add({ title: 'Creator deleted', type: 'success' });
        router.push('/admin');
      }
    } finally { setDeleting(false); }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20 min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
      </div>
    );
  }

  const totalCommission = data.sales.reduce((acc: number, s: any) => acc + Number(s.commission || 0), 0);
  const currency = data.sales[0]?.currency ?? 'USD';

  return (
    <div className="min-h-screen cow-patch-bg pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold bg-muted/80 px-2.5 py-1 rounded-lg border border-border transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Admin Portal
              </Link>
              {creator.is_archived && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300 font-bold text-[10px] uppercase">
                  <Archive className="w-3 h-3" /> Archived
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2">
              <User className="w-6 h-6 text-amber-700" /> @{creator.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              {creator.display_name} • {creator.is_affiliate ? 'Affiliate' : 'Standard User'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleArchive} disabled={archiving}>
              {archiving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (creator.is_archived ? <Undo2 className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />)}
              {creator.is_archived ? 'Unarchive' : 'Archive'}
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <MousePointerClick className="w-3.5 h-3.5" /> Total Clicks (All time)
              </div>
              <div className="text-2xl font-extrabold">{data.clicks.length.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <ShoppingCart className="w-3.5 h-3.5" /> Total Sales (All time)
              </div>
              <div className="text-2xl font-extrabold">{data.sales.length.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                <Coins className="w-3.5 h-3.5" /> Total Earned (All time)
              </div>
              <div className="text-2xl font-extrabold text-amber-700">{formatMoney(totalCommission, currency)}</div>
            </CardContent>
          </Card>
          <Card size="sm" className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                <Settings className="w-3.5 h-3.5" /> Custom Rate
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number" min={0} max={30}
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className="h-8 w-16 text-sm font-bold bg-white"
                />
                <span className="text-sm font-bold text-muted-foreground mr-1">%</span>
                <Button size="sm" onClick={handleSaveRate} disabled={savingRate} className="h-8 px-2 bg-amber-700 hover:bg-amber-800">
                  {savingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Transactions */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-700" /> Transactions
                </CardTitle>
                <CardDescription className="text-xs">
                  All affiliate sales generated by this creator.
                </CardDescription>
              </div>
              <Button size="xs" variant="outline" onClick={load} className="h-7 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {data.sales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No sales yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-muted-foreground text-left bg-muted/30">
                        <th className="py-2 px-3 font-semibold">Date</th>
                        <th className="py-2 px-3 font-semibold text-right">Price</th>
                        <th className="py-2 px-3 font-semibold text-right">Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted/40">
                      {data.sales.map((t: any) => (
                        <tr key={t.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                            {new Date(t.purchased_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatMoney(t.price, t.currency)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-amber-700">
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
        </div>
      </div>
      <Toaster />
    </div>
  );
}
