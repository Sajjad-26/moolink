import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, BarChart3, Zap, Palette, Shield,
  Sparkles, Check, X, ChevronDown, Globe, Users,
  MousePointerClick, Smartphone, Star, TrendingUp,
} from 'lucide-react';
// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: BarChart3,
    title: 'Deep Real-Time Analytics',
    desc: 'See exactly where your audience comes from — countries, devices, operating systems, referrers, and click-through rates. All in real time.',
  },
  {
    icon: Palette,
    title: 'Premium Themes',
    desc: 'Authentic iOS Liquid Glassmorphism, ultra-crisp Unsplash HD nature wallpapers, and curated aesthetics. Transform your link page in seconds.',
  },
  {
    icon: Zap,
    title: 'Blazing Fast Pages',
    desc: 'Server-side rendered, globally cached, sub-50ms redirects. Your audience never waits on a spinner.',
  },
  {
    icon: MousePointerClick,
    title: 'Smart Icon Detection',
    desc: 'Paste any URL and we automatically detect the platform — Instagram, YouTube, Spotify, Play Store, App Store, and 50+ more.',
  },
  {
    icon: Smartphone,
    title: 'Looks Perfect on Mobile',
    desc: 'Every theme and layout is pixel-perfect on phones. Because 90% of your audience is on mobile anyway.',
  },
  {
    icon: Shield,
    title: 'Honest Pricing',
    desc: 'No surprise charges. No ads on your page. No bait-and-switch. The free plan is genuinely useful.',
  },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Is the free plan really free forever?',
    a: 'Yes! No credit card required. Every new user gets a 7-day Pro Trial automatically on signup, after which the free plan includes up to 3 links.',
  },
  {
    q: 'How does MooLink compare to other link-in-bio tools?',
    a: 'Most leading platforms charge $9–$24/month for their paid plans. MooLink Pro is $2.99/month with equivalent or better features, no ads, and a cleaner UI.',
  },
  {
    q: 'Can I cancel Pro any time?',
    a: 'Absolutely. Cancel any time from your account settings. If you cancel, you keep Pro until the end of your billing period.',
  },
  {
    q: 'What analytics do I get on Pro?',
    a: 'Total clicks, page views, unique visitors, top countries, device types (mobile/desktop/tablet), OS breakdown, referrer sources, and per-link click counts.',
  },
  {
    q: 'Do you put ads on my page?',
    a: 'Never. Not on free, not on Pro. Your page is yours.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Custom domain support is on our roadmap. Pro users will get it first when it launches.',
  },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Switched from my old platform after seeing the analytics dashboard. MooLink shows me way more data and costs literally a third of the price.",
    name: "Aryan K.",
    role: "Content Creator · 45K followers",
  },
  {
    quote: "The themes are gorgeous. My page finally looks like my brand instead of a generic link list.",
    name: "Sofia M.",
    role: "Musician & Artist",
  },
  {
    quote: "Set up in 3 minutes. Everything just works. The auto icon detection is a really nice touch.",
    name: "James T.",
    role: "Developer & Indie Maker",
  },
];

export default async function HomePage() {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country') || '';
  const isIndia = country === 'IN';

  const priceSymbol = isIndia ? '₹' : '$';
  const proPrice = isIndia ? '199' : '2.99';
  const competitorPrice = isIndia ? '₹750+' : '$9–$24';

  const PLANS = [
    {
      name: 'Free',
      price: `${priceSymbol}0`,
      period: 'forever',
      description: 'Perfect to get started with your link-in-bio.',
      highlight: false,
      cta: 'Start for Free',
      href: '/signup',
      features: [
        { text: 'Up to 3 links', included: true },
        { text: 'Basic analytics (7 days)', included: true },
        { text: 'Selected themes', included: true },
        { text: 'MooLink subdomain', included: true },
        { text: 'Click tracking', included: true },
        { text: 'Remove MooLink branding', included: false },
        { text: 'Unlimited links', included: false },
        { text: 'Full analytics suite', included: false },
      ],
    },
    {
      name: 'Pro',
      price: `${priceSymbol}${proPrice}`,
      period: 'per month',
      sub: 'Includes 7-day Free Pro Trial on signup · Cancel anytime',
      description: 'Everything you need to grow your audience.',
      highlight: true,
      badge: 'Best Value',
      cta: 'Start 7-Day Free Trial',
      href: '/signup?plan=pro',
      features: [
        { text: 'Unlimited links', included: true },
        { text: 'Full analytics (countries, devices, referrers)', included: true },
        { text: 'Premium Themes', included: true },
        { text: 'MooLink subdomain (custom domain coming soon)', included: true },
        { text: 'Click & page-view tracking', included: true },
        { text: 'Remove MooLink branding', included: true },
        { text: 'OS & browser data', included: true },
        { text: 'Priority email support', included: true },
      ],
    },
  ];

  const COMPARISON = [
    {
      feature: 'Price',
      free:   { label: `${priceSymbol}0 / mo`,            positive: true  },
      pro:    { label: `${priceSymbol}${proPrice} / mo`, positive: true  },
      others: { label: `${competitorPrice} / mo`,     positive: false },
    },
    {
      feature: 'Links',
      free:   { label: 'Up to 3',        positive: true  },
      pro:    { label: 'Unlimited',       positive: true  },
      others: { label: 'Limited on free', positive: false },
    },
    {
      feature: 'Analytics',
      free:   { label: '7-day basics',   positive: true  },
      pro:    { label: 'Full suite',     positive: true  },
      others: { label: 'Locked behind paid', positive: false },
    },
    {
      feature: 'Themes',
      free:   { label: 'Selected themes', positive: true  },
      pro:    { label: 'Premium Themes', positive: true  },
      others: { label: 'Basic templates', positive: false },
    },
    {
      feature: 'Country & Device data',
      free:   { label: '—',              positive: false },
      pro:    { label: '✓ Included',     positive: true  },
      others: { label: 'Premium only',   positive: false },
    },
    {
      feature: 'Ads on your page',
      free:   { label: 'Never',          positive: true  },
      pro:    { label: 'Never',          positive: true  },
      others: { label: 'Yes on free',    positive: false },
    },
    {
      feature: 'Speed',
      free:   { label: '< 50ms',         positive: true  },
      pro:    { label: '< 50ms',         positive: true  },
      others: { label: 'Slower (JS-heavy)', positive: false },
    },
  ];

  return (
    <div className="min-h-screen cow-patch-bg">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="MooLink Logo" width={32} height={32} className="rounded-lg shadow-xs" />
            <span className="text-xl font-extrabold tracking-tight text-foreground">MooLink</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#compare" className="hover:text-foreground transition-colors">Compare</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm hidden sm:inline-flex">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-white font-semibold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold mb-8 shadow-sm">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          The simple, affordable alternative creators are switching to
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6">
          One link.<br />
          <span className="text-amber-700">All your content.</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
          MooLink gives you a beautiful, fast link-in-bio page with real analytics — at a fraction of what other platforms charge. Simple, clean, honest.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/signup">
            <Button size="lg" className="gap-2 bg-amber-800 hover:bg-amber-900 text-white text-base px-10 h-12 shadow-lg shadow-amber-800/25 font-semibold w-full sm:w-auto">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#pricing">
            <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto">
              View Pricing
            </Button>
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          No credit card required · Free plan, always · Cancel Pro any time
        </p>
      </section>

      {/* ── STATS BAR ── */}
      <section className="w-full border-y border-border/60 bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '30+',   label: 'Auto-detected platforms' },
              { value: '18',    label: 'Beautiful themes' },
              { value: '$0',    label: 'To get started' },
              { value: '<50ms', label: 'Page load time' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <Sparkles className="w-3 h-3" /> Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Everything you need. Nothing you don&apos;t.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">We cut the bloat and kept what actually matters for creators.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group p-6 rounded-2xl border border-border bg-card hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                <Icon className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4-COLUMN COMPARISON ── */}
      <section id="compare" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <TrendingUp className="w-3 h-3" /> Side-by-side comparison
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Why creators are switching</h2>
          <p className="mt-3 text-muted-foreground">See exactly what you get — and what others charge for the same.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {/* Feature column */}
                <th className="text-left p-4 font-semibold text-foreground bg-muted/40 w-[28%] align-bottom">Feature</th>

                {/* MooLink Free */}
                <th className="text-center p-4 bg-amber-50/40 w-[24%] align-bottom">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wide mb-1 whitespace-nowrap">MooLink Free</div>
                  <div className="text-xl font-extrabold text-amber-700">{priceSymbol}0</div>
                  <div className="text-[11px] text-muted-foreground font-normal">forever</div>
                </th>

                {/* MooLink Pro — highlighted */}
                <th className="text-center p-4 bg-amber-800 w-[24%] align-bottom">
                  <div className="mb-1">
                    <span className="inline-block bg-amber-400 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                      Best Value
                    </span>
                  </div>
                  <div className="font-bold text-amber-100 text-xs uppercase tracking-wide mb-1 whitespace-nowrap">MooLink Pro</div>
                  <div className="text-xl font-extrabold text-white">{priceSymbol}{proPrice}</div>
                  <div className="text-[11px] text-amber-200 font-normal">per month</div>
                </th>

                {/* Other platforms Pro */}
                <th className="text-center p-4 bg-muted/40 w-[24%] align-bottom">
                  <div className="font-semibold text-muted-foreground text-xs uppercase tracking-wide mb-1 whitespace-nowrap">Other Platforms</div>
                  <div className="text-xl font-extrabold text-muted-foreground">{competitorPrice}</div>
                  <div className="text-[11px] text-muted-foreground font-normal">per month</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON.map(({ feature, free, pro, others }) => (
                <tr key={feature} className="hover:bg-muted/10 transition-colors">
                  {/* Feature name */}
                  <td className="p-4 font-medium text-foreground bg-muted/10">{feature}</td>

                  {/* MooLink Free */}
                  <td className="p-4 text-center bg-amber-50/20">
                    <span className={`text-sm font-medium ${free.positive ? 'text-green-700' : 'text-muted-foreground'}`}>
                      {free.label}
                    </span>
                  </td>

                  {/* MooLink Pro */}
                  <td className="p-4 text-center bg-amber-800/5 border-x border-amber-200/30">
                    <span className={`text-sm font-semibold ${pro.positive ? 'text-amber-800' : 'text-muted-foreground'}`}>
                      {pro.label}
                    </span>
                  </td>

                  {/* Others */}
                  <td className="p-4 text-center">
                    <span className={`text-sm ${others.positive ? 'text-green-700' : 'text-muted-foreground/70'}`}>
                      {others.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/20">
                <td className="p-4" />
                <td className="p-4 text-center">
                  <Link href="/signup">
                    <Button size="sm" variant="outline" className="text-xs">
                      Start Free
                    </Button>
                  </Link>
                </td>
                <td className="p-4 text-center bg-amber-800/5 border-x border-amber-200/30">
                  <Link href="/signup?plan=pro">
                    <Button size="sm" className="bg-amber-800 hover:bg-amber-900 text-white text-xs">
                      Start Trial
                    </Button>
                  </Link>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-block text-xs font-extrabold text-white bg-red-600 px-3 py-1 rounded-full shadow-xs tracking-tight">
                    Up to 8× more expensive
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Competitor pricing based on publicly listed rates for comparable link-in-bio platforms.
        </p>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <Shield className="w-3 h-3" /> Honest Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">Simple. Transparent. Affordable.</h2>
          <p className="mt-3 text-muted-foreground">No surprise charges. No ads. No lock-in.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border p-8 flex flex-col ${
                plan.highlight
                  ? 'border-amber-400 bg-amber-800 text-white shadow-2xl shadow-amber-800/30 scale-[1.02]'
                  : 'border-border bg-card'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-amber-200' : 'text-muted-foreground'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && (
                    <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-amber-200' : 'text-muted-foreground'}`}>
                      /{plan.period}
                    </span>
                  )}
                </div>
                {plan.sub && (
                  <p className={`text-xs ${plan.highlight ? 'text-amber-300' : 'text-muted-foreground'}`}>{plan.sub}</p>
                )}
                <p className={`mt-3 text-sm leading-relaxed ${plan.highlight ? 'text-amber-100' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map(({ text, included }) => (
                  <li key={text} className="flex items-start gap-3 text-sm">
                    {included ? (
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-amber-300' : 'text-green-600'}`} />
                    ) : (
                      <X className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? 'text-amber-600' : 'text-muted-foreground/50'}`} />
                    )}
                    <span className={!included ? (plan.highlight ? 'text-amber-400/70' : 'text-muted-foreground/60') : ''}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button
                  size="lg"
                  className={`w-full font-semibold ${
                    plan.highlight
                      ? 'bg-white text-amber-900 hover:bg-amber-50'
                      : 'bg-amber-800 hover:bg-amber-900 text-white'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pro plan includes a 7-day free trial · No credit card required to start
        </p>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <Users className="w-3 h-3" /> Creators love it
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">Real people. Real results.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role }) => (
            <div key={name} className="p-6 rounded-2xl border border-border bg-card flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">&quot;{quote}&quot;</p>
              <div>
                <div className="font-semibold text-foreground text-sm">{name}</div>
                <div className="text-xs text-muted-foreground">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-4">
            <ChevronDown className="w-3 h-3" /> FAQ
          </div>
          <h2 className="text-3xl font-extrabold text-foreground">Common questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-border rounded-2xl bg-card overflow-hidden">
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer font-semibold text-foreground text-sm select-none list-none">
                {q}
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                {a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-3xl bg-gradient-to-br from-amber-800 to-amber-900 p-10 md:p-16 text-white text-center relative overflow-hidden shadow-2xl shadow-amber-900/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative z-10">
            <div className="flex justify-center mb-5">
              <Image src="/logo.png" alt="MooLink Logo" width={64} height={64} className="rounded-2xl shadow-lg border border-white/20" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Your link-in-bio should cost less than a coffee.
            </h2>
            <p className="text-amber-100/90 max-w-lg mx-auto leading-relaxed mb-8 text-base">
              Beautiful pages, real analytics, and honest pricing. Start free — upgrade only when you need to.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-white text-amber-900 hover:bg-amber-50 text-base px-10 h-12 font-bold w-full sm:w-auto">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button size="lg" className="bg-amber-950/80 border border-amber-300/40 text-amber-100 hover:bg-white hover:text-amber-950 text-base font-bold h-12 px-8 w-full sm:w-auto backdrop-blur-md transition-all shadow-md">
                  View Pricing
                </Button>
              </a>
            </div>
            <p className="mt-5 text-xs text-amber-300/70">No credit card required. Cancel any time.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full border-t border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/logo.png" alt="MooLink Logo" width={28} height={28} className="rounded-md shadow-xs" />
                <span className="font-extrabold text-foreground">MooLink</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The simple, affordable, beautiful link-in-bio tool built for creators who deserve better.
              </p>
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm mb-3">Product</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#compare" className="hover:text-foreground transition-colors">Compare</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm mb-3">Account</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm mb-3">Support</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@moolink.xyz" className="hover:text-foreground transition-colors font-mono text-xs text-amber-800 font-semibold">
                    support@moolink.xyz
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} MooLink. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/global" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Globe className="w-3 h-3" /> Global
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
