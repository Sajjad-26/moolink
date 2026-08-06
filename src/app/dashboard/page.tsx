import { getProfile } from './actions';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  return <DashboardClient profile={profile} />;
}
