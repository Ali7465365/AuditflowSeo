import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AuthProvider } from '@/context/AuthContext';
import { Link, RouterProvider, useRouter } from '@/lib/router';
import { AuthPage } from '@/pages/AuthPage';
import { LandingPage } from '@/pages/LandingPage';
import { SamplePage } from '@/pages/SamplePage';
import { AgencySettingsPage } from '@/pages/dashboard/AgencySettingsPage';
import { AuditResultPage } from '@/pages/dashboard/AuditResultPage';
import { BillingPage } from '@/pages/dashboard/BillingPage';
import { NewAuditPage } from '@/pages/dashboard/NewAuditPage';
import { SavedAuditsPage } from '@/pages/dashboard/SavedAuditsPage';

const AUDIT_ROUTE = /^\/dashboard\/audits\/([^/]+)$/;

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">404</p>
      <h1 className="mt-3 text-3xl font-bold text-white">This page does not exist</h1>
      <Link to="/" className="mt-8 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
        Back to home
      </Link>
    </div>
  );
}

function renderDashboardPage(pathname: string) {
  const auditMatch = pathname.match(AUDIT_ROUTE);
  if (auditMatch) {
    return <AuditResultPage auditId={decodeURIComponent(auditMatch[1])} />;
  }

  switch (pathname) {
    case '/dashboard':
    case '/dashboard/new':
      return <NewAuditPage />;
    case '/dashboard/saved':
      return <SavedAuditsPage />;
    case '/dashboard/billing':
      return <BillingPage />;
    case '/dashboard/settings':
      return <AgencySettingsPage />;
    default:
      return <NotFoundPage />;
  }
}

function AppRoutes() {
  const { pathname } = useRouter();

  if (pathname === '/') return <LandingPage />;
  if (pathname === '/auth') return <AuthPage />;
  if (pathname === '/sample') return <SamplePage />;
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return <DashboardLayout>{renderDashboardPage(pathname)}</DashboardLayout>;
  }
  return <NotFoundPage />;
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
