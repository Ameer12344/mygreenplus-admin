import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';
import RealtimeNotifier from '@/components/RealtimeNotifier';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('name, is_admin')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    await supabase.auth.signOut();
    redirect('/login?error=' + encodeURIComponent('This account does not have admin access.'));
  }

  return (
    <div className="min-h-screen bg-sage-50">
      {/* RealtimeNotifier lives here — outside children and Sidebar —
          so it never unmounts on page navigation and keeps its state. */}
      <RealtimeNotifier />
      <Sidebar adminName={profile.name ?? user.email ?? 'Admin'} />
      <main className="lg:ml-64 pt-16 lg:pt-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
