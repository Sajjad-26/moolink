'use server';

import { createClient } from '@/lib/supabase/server';

export async function resendConfirmationEmail(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) return { error: 'Email is required' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });

  if (error) return { error: error.message };

  return { success: true };
}
