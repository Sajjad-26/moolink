import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - MooLink',
  description: 'Learn how MooLink collects, uses, and protects your personal data and privacy.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            Privacy Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last Updated: August 12, 2026 • Effective Immediately
          </p>
        </div>

        <div className="prose prose-amber dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Lock className="w-4 h-4 text-amber-700" /> 1. Overview & Commitments
            </h2>
            <p className="text-muted-foreground">
              At <strong>MooLink</strong>, your privacy is a core priority. This Privacy Policy outlines how we collect, process, and safeguard your personal information when you use our platform, services, and bio-link tools. We never sell your personal data to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Account Data</h3>
                <p className="text-xs text-muted-foreground">
                  When you sign up via Google OAuth or Email, we collect your email address, display name, profile avatar, and username.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
                <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">Link & Analytics Data</h3>
                <p className="text-xs text-muted-foreground">
                  We collect link URLs, custom titles, click counts, aggregate referrer sources, device types, and broad country-level geolocation.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>To provide, maintain, and personalize your MooLink profile and bio-link landing page.</li>
              <li>To compute aggregate click and traffic analytics for your creator dashboard.</li>
              <li>To process subscription payments and handle Pro plan feature entitlements.</li>
              <li>To detect, prevent, and mitigate spam, fraud, or misuse of our link infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">4. Data Sharing & Infrastructure</h2>
            <p className="text-muted-foreground">
              We work with trusted industry providers to operate MooLink:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong>Supabase</strong> for secure database hosting, session authentication, and data encryption at rest.</li>
              <li><strong>Dodo Payments</strong> for encrypted payment processing (we do not store credit card details).</li>
              <li><strong>Global Edge Network (Netlify/Vercel)</strong> for high-speed, SSL-encrypted content distribution worldwide.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">5. Your Data Rights & Choices</h2>
            <p className="text-muted-foreground">
              Under GDPR, CCPA, and global privacy standards, you have full control over your data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li><strong>Access & Update</strong>: You can update your display name, handle, bio, and links at any time in your Dashboard.</li>
              <li><strong>Account Deletion</strong>: You may request complete deletion of your account and all associated profile links by contacting support.</li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700" /> Have Questions About Privacy?
            </h2>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              If you have any questions or data requests, contact our privacy team at{' '}
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
