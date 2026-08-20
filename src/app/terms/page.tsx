import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Scale, CheckCircle2, AlertTriangle, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - MooLink',
  description: 'Read the terms and conditions for using MooLink bio-link service and creator tools.',
};

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last Updated: August 12, 2026 • Effective Immediately
          </p>
        </div>

        <div className="prose prose-amber dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <FileText className="w-4 h-4 text-amber-700" /> 1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By accessing or using <strong>MooLink</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">2. Account Registration & Security</h2>
            <p className="text-muted-foreground">
              You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities occurring under your MooLink handle.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. Acceptable Use Policy</h2>
            <p className="text-muted-foreground">
              You agree not to use MooLink to post, link, or distribute:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Malware, phishing schemes, spyware, or malicious code.</li>
              <li>Hate speech, illegal materials, or non-consensual content.</li>
              <li>Deceptive spam campaigns, bulk deceptive redirects, or fraudulent promotions.</li>
            </ul>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 flex items-center gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Violating these guidelines will result in immediate profile suspension and removal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Subscriptions & Payments</h2>
            <p className="text-muted-foreground">
              MooLink offers both Free and Pro paid subscription tiers:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong>Free Plan</strong>: Includes up to 3 links, standard analytics, and full customization.</li>
              <li><strong>Pro Plan</strong>: Unlocks unlimited links, advanced analytics, custom campaign URLs, and premium HD wallpapers.</li>
              <li>Payments are securely processed via Dodo Payments. You may cancel your subscription at any time.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Service Availability & Limitation of Liability</h2>
            <p className="text-muted-foreground">
              MooLink is provided &quot;as is&quot; without warranties of any kind. While we maintain a 99.9% uptime SLA across our global distribution network, we are not liable for indirect damages resulting from service interruptions or link destination unavailability.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700" /> Questions About Terms?
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              For any legal or terms inquiries, reach out to{' '}
              <a href="mailto:support@moolink.xyz" className="font-semibold underline hover:text-amber-950">
                support@moolink.xyz
              </a>.
            </p>
          </section>
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
