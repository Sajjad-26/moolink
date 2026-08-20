import { getProfile } from '@/app/dashboard/actions';
import { redirect } from 'next/navigation';
import { AdminPage } from '@/components/admin/admin-page';

export default async function AdminRoute() {
  const profile = await getProfile();
  if (!profile) redirect('/login');
  if (!profile.is_admin) redirect('/dashboard');

  return <AdminPage />;
}
