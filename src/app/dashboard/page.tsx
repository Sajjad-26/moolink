import { getProfile } from './actions';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Suspense } from 'react';
import DashboardLoading from './loading';

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  
  // Force onboarding if they haven't set a custom username or display name
  if (profile.username.startsWith('user_') || !profile.display_name.trim() || !profile.bio.trim()) {
    redirect('/onboarding');
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient profile={profile} />
    </Suspense>
  );
}
