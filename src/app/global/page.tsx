import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Globe, Zap, Shield, Server, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Infrastructure & Compliance - MooLink',
  description: 'Learn about MooLink global CDN distribution, low latency redirect routing, and privacy compliance.',
};

export default function GlobalInfrastructurePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="MooLink Logo" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-lg tracking-tight">MooLink</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted px-3 py-1.5 rounded-lg border border-border/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 sm:py-14 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold">
            <Globe className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            Worldwide Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Global Infrastructure & Compliance</h1>
          <p className="text-sm text-muted-foreground">
            Ultra-fast link routing, sub-50ms page loads, and international privacy standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Sub-50ms Global Edge Routing</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              MooLink bio pages and link redirect endpoints (`/api/click/[id]`) are cached and served from edge servers globally, ensuring instant clicks for your followers anywhere on earth.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground">Global Privacy Compliance</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built to adhere to international data regulations, including EU GDPR, California CCPA, and India DPDP regulations with zero invasive tracking scripts.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Server className="w-4 h-4 text-amber-700" /> Infrastructure Standards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">99.9% Uptime SLA</strong>
                Redundant multi-cloud fallback deployment.
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">Automatic SSL</strong>
                TLS 1.3 encryption on every creator profile.
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-muted/40 rounded-xl border border-border/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block font-semibold mb-0.5">DDoS Mitigation</strong>
                Real-time bot and threat detection at the edge.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 bg-card/30">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MooLink. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
