import { useEffect, useState, type ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/lib/router';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, profile, loading, profileError, refreshProfile } = useAuth();
  const { navigate } = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
    }
  }, [loading, session, navigate]);

  if (loading || (session && !profile && !profileError)) {
    return <FullPageMessage>Loading your workspace...</FullPageMessage>;
  }

  if (!session) {
    return null;
  }

  if (!profile) {
    return (
      <FullPageMessage>
        <p>{profileError}</p>
        <button
          type="button"
          onClick={() => refreshProfile()}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Try again
        </button>
      </FullPageMessage>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="lg:pl-64">
        <DashboardTopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function FullPageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-300">
      {children}
    </div>
  );
}
