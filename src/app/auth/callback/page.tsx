'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function run() {
      const tokenHash = searchParams.get('token_hash');
      const next = searchParams.get('next') ?? '/dashboard';

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email',
        });
        if (error) {
          router.replace('/login?error=invalid-link');
          return;
        }
      }

      if (cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(next);
      } else {
        router.replace('/login');
      }
    }

    run();
    return () => { cancelled = true; };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background cow-patch-bg gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
