import { createClient } from '@/lib/supabase/server';
import { ensureUsernameForUser } from '../actions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const next = searchParams.get('next') ?? '/dashboard';

  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (error) {
      // Some providers deliver the token with the session already established.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL('/login?error=invalid-link', request.url));
      }
    }
  }

  await ensureUsernameForUser();

  return NextResponse.redirect(new URL(next, request.url));
}
