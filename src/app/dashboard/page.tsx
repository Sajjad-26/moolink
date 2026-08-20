import { getProfile } from './actions';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Suspense } from 'react';
import DashboardLoading from './loading';

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient profile={profile} />
    </Suspense>
  );
}
