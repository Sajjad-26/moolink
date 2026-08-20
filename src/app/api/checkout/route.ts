import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDodoCheckoutSession } from '@/lib/dodo';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username, is_pro, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (profile?.is_pro && profile?.subscription_status === 'active') {
      return NextResponse.json({ error: 'You already have an active Pro subscription.' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://moolink.xyz';
    const returnUrl = `${origin}/dashboard?payment=success`;

    const session = await createDodoCheckoutSession({
      email: user.email || '',
      name: profile?.display_name || 'MooLink Creator',
      userId: user.id,
      returnUrl,
    });

    return NextResponse.json({ checkout_url: session?.payment_link || session?.url || session?.checkout_url });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Checkout failed' }, { status: 500 });
  }
}
