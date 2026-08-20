'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import type { Profile } from '@/lib/types';
import { Link2, BarChart3, Settings, Wallet, LogOut, QrCode, Zap, Loader2, Check, X, Crown } from 'lucide-react';
import { toast, Toaster } from '@/components/ui/toast';
import { formatMoney, currentMonth } from '@/lib/commissions';
import { getMyTransactions } from '@/app/dashboard/earnings-actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const LinksTab = dynamic(() => import('./links-tab').then(m => ({ default: m.LinksTab })), {
  loading: () => <TabLoading />,
});
const AnalyticsTab = dynamic(() => import('./analytics-tab').then(m => ({ default: m.AnalyticsTab })), {
  loading: () => <TabLoading />,
});
const SettingsTab = dynamic(() => import('./settings-tab').then(m => ({ default: m.SettingsTab })), {
  loading: () => <TabLoading />,
});
const EarningsTab = dynamic(() => import('./earnings-tab').then(m => ({ default: m.EarningsTab })), {
  loading: () => <TabLoading />,
});
const QRCodeModal = dynamic(() => import('./qr-code-modal').then(m => ({ default: m.QRCodeModal })), {
  loading: () => null,
});

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-amber-700" />
    </div>
  );
}

export function DashboardClient({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState('links');
  const [qrOpen, setQrOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      router.replace('/dashboard');
      const timer = setTimeout(() => setShowPaymentSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Notification: when a new commissionable sale lands for this creator, toast
  // "you earned $X". Poll the current month's transactions every ~25s and only
  // toast sales that are genuinely new (deduped by id, backfilled once on mount).
  // (Supabase Realtime was tried first — channels joined but no payload ever
  // arrived on this project, so polling is used for reliability.)
  useEffect(() => {
    if (!profile.is_affiliate || profile.is_admin) return;

    const period = currentMonth();
    const seen = new Set<string>();
    let initialized = false;
    let cancelled = false;

    const poll = async () => {
      try {
        const tx = await getMyTransactions(period);
        if (cancelled) return;
        for (const t of tx) {
          if (!initialized) { seen.add(t.id); continue; }
          if (seen.has(t.id)) continue;
          seen.add(t.id);
          const isCommissionable =
            t.event_type === 'INITIAL_PURCHASE' || t.event_type === 'NON_RENEWING_PURCHASE';
          if (isCommissionable && t.commission > 0) {
            toast.add({
              type: 'info',
              title: 'Commission earned!',
              description: `You earned ${formatMoney(t.commission, t.currency)} from a new subscriber${t.ref ? ` (@${t.ref})` : ''}.`,
            });
          }
        }
        initialized = true;
      } catch { /* ignore poll errors */ }
    };

    poll();
    const id = setInterval(poll, 25000);
    return () => { cancelled = true; clearInterval(id); };
  }, [profile.is_affiliate, profile.is_admin, profile.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleUpgradePro = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.add({ title: 'Checkout Error', description: data.error || 'Failed to start checkout.', type: 'error' });
      }
    } catch (err: any) {
      toast.add({ title: 'Connection Error', description: err?.message || 'Could not connect.', type: 'error' });
    } finally {
      setUpgrading(false);
    }
  };

  const createdAtMs = profile.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const daysSinceSignup = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(0, 7 - daysSinceSignup);
  const isTrialActive = !profile.is_pro && trialDaysRemaining > 0;
  const isPro = profile.is_pro || isTrialActive;

  return (
    <div className="min-h-screen cow-patch-bg">
      <header className="bg-card/95 backdrop-blur-lg border-b border-border sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 flex-shrink-0">
              <Image src="/logo.png" alt="MooLink" width={24} height={24} className="rounded-md" />
              <span className="text-lg font-extrabold tracking-tight hidden sm:inline">MooLink</span>
            </Link>
            {profile.is_pro ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase flex-shrink-0">
                <Crown className="w-3 h-3" /> PRO
              </span>
            ) : isTrialActive ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px] flex-shrink-0">
                Trial: {trialDaysRemaining}d
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium text-[10px] flex-shrink-0">
                Free
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {profile.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs h-8 px-2.5 rounded-lg transition-colors"
                title="Admin Portal"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {!profile.is_pro && (
              <Button
                onClick={handleUpgradePro}
                disabled={upgrading}
                size="sm"
                className="bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs h-8 rounded-lg gap-1.5 px-3"
              >
                {upgrading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                <span className="hidden sm:inline">{isTrialActive ? 'Go Pro' : 'Upgrade'}</span>
                <span className="sm:hidden">Pro</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setQrOpen(true)} className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg p-0" title="QR Code">
              <QrCode className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg p-0" title="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {showPaymentSuccess && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3">
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-sm font-medium">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="flex-1">Payment successful! Pro features are now active.</span>
            <button onClick={() => setShowPaymentSuccess(false)} className="text-emerald-600 hover:text-emerald-800"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {qrOpen && <QRCodeModal open={qrOpen} onOpenChange={setQrOpen} username={profile.username} displayName={profile.display_name} avatarUrl={profile.avatar_url} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <Tabs value={tab} onValueChange={(v) => { setTab('links'); setTimeout(() => setTab(v), 0); }}>
          <TabsList className="mb-5 gap-1 h-9">
            <TabsTrigger value="links" className="gap-1.5 text-xs data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <Link2 className="w-3.5 h-3.5" /> Links
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-1.5 text-xs data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <Wallet className="w-3.5 h-3.5" /> Earnings
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
              <Settings className="w-3.5 h-3.5" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links"><LinksTab profile={profile} isPro={isPro} /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab profileId={profile.id} username={profile.username} isPro={isPro} /></TabsContent>
          <TabsContent value="earnings"><EarningsTab profile={profile} /></TabsContent>
          <TabsContent value="settings"><SettingsTab profile={profile} isPro={isPro} /></TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}
