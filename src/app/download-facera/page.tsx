'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Check, Copy, Download, Sparkles, Loader2 } from 'lucide-react';

const APP_STORE_URLS = {
  ios: 'https://apps.apple.com/app/facera-ai-beauty-face-app/id6740647791',
  android: 'https://play.google.com/store/apps/details?id=com.facera.faceai',
};

function FaceraBridgeContent() {
  const searchParams = useSearchParams();
  const rawRef = searchParams.get('ref') || searchParams.get('affiliate_ref') || '';
  const cleanedRef = rawRef.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  const [copied, setCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState(APP_STORE_URLS.ios);
  const [status, setStatus] = useState('Opening Facera AI...');
  const [, startTransition] = useTransition();

  const copyToClipboard = (text: string) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const isAndroid = /android/i.test(navigator.userAgent || '');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '');
    const targetUrl = isAndroid ? APP_STORE_URLS.android : APP_STORE_URLS.ios;
    setStoreUrl(targetUrl);

    // 1. Copy referral code to clipboard
    if (cleanedRef) {
      copyToClipboard(cleanedRef);
      setCopied(true);

      // 2. Track click in MooLink analytics
      fetch(`/api/click/app?app=facera&ref=${encodeURIComponent(cleanedRef)}`).catch(() => {});
    }

    // 3. Try app custom scheme deep link (if already installed)
    const deepLink = cleanedRef ? `facera://open?ref=${encodeURIComponent(cleanedRef)}` : 'facera://open';
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // 4. Fallback redirect to store after short delay
    const timer = setTimeout(() => {
      setStatus('Redirecting to App Store...');
      startTransition(() => {
        window.location.href = targetUrl;
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, [cleanedRef]);

  const handleManualCopy = () => {
    if (cleanedRef) {
      copyToClipboard(cleanedRef);
      setCopied(true);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-between p-6 antialiased selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-sm flex flex-col items-center text-center my-auto space-y-6">
        {/* App Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-2xl shadow-amber-500/20">
            <div className="w-full h-full bg-neutral-900 rounded-[22px] flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Facera AI"
                width={72}
                height={72}
                className="rounded-2xl"
                priority
              />
            </div>
          </div>
          <span className="absolute -bottom-2 -right-2 bg-amber-400 text-neutral-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <Sparkles className="w-2.5 h-2.5" /> Pro
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">Facera AI</h1>
          <p className="text-xs text-neutral-400 font-medium">Beauty, Symmetry & Face Analysis</p>
        </div>

        {/* Referral code card */}
        {cleanedRef && (
          <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Referral code</span>
              {copied ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Check className="w-3 h-3" /> Auto-copied to clipboard!
                </span>
              ) : (
                <span className="text-neutral-500 text-[11px]">Tap to copy</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleManualCopy}
              className="w-full flex items-center justify-between bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.99]"
            >
              <span className="font-mono text-base font-bold text-amber-300">@{cleanedRef}</span>
              <span className="text-neutral-400 hover:text-white">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </span>
            </button>
            <p className="text-[11px] text-neutral-500 leading-tight">
              Paste this on the referral screen inside the app.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="w-full space-y-3 pt-2">
          <a
            href={storeUrl}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm h-12 rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" /> Open or Download Facera
          </a>
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 animate-pulse">
            {status}
          </p>
        </div>
      </div>

      <footer className="text-center text-[11px] text-neutral-600 font-medium">
        Powered by <span className="text-neutral-400">MooLink.xyz</span>
      </footer>
    </main>
  );
}

export default function FaceraRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <FaceraBridgeContent />
    </Suspense>
  );
}
