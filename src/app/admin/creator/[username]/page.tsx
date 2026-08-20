import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreatorDetailPage } from '@/components/admin/creator-detail-page';

export default async function AdminCreatorPage(
  props: { params: Promise<{ username: string }> }
) {
  const params = await props.params;
  const username = params.username;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Ensure current user is admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', user.id)
    .single();

  if (!adminProfile?.is_admin) {
    redirect('/dashboard');
  }

  // Fetch target creator
  const { data: creator } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!creator) {
    notFound();
  }

  return <CreatorDetailPage creator={creator} />;
}
