'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Redirects logged-in users away from auth pages (login, signup, confirm).
 * Mirrors the server-side proxy guard so auth pages feel consistent client-side.
 */
export function useAuthGuard(redirectTo: string) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled && data.session) router.replace(redirectTo);
      })
      .catch(() => {
        // ignore — the proxy will handle auth on navigation
      });

    return () => {
      cancelled = true;
    };
  }, [router, redirectTo]);
}
