import { Building2, CreditCard, History, MessageSquare, PlusCircle, X, type LucideIcon } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Link, useRouter } from '@/lib/router';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'New Audit',
    to: '/dashboard/new',
    icon: PlusCircle,
    isActive: (pathname) => pathname === '/dashboard' || pathname === '/dashboard/new',
  },
  {
    label: 'Saved Audits',
    to: '/dashboard/saved',
    icon: History,
    isActive: (pathname) => pathname.startsWith('/dashboard/saved') || pathname.startsWith('/dashboard/audits/'),
  },
  {
    label: 'Plan & Billing',
    to: '/dashboard/billing',
    icon: CreditCard,
    isActive: (pathname) => pathname.startsWith('/dashboard/billing'),
  },
  {
    label: 'Agency Settings',
    to: '/dashboard/settings',
    icon: Building2,
    isActive: (pathname) => pathname.startsWith('/dashboard/settings'),
  },
  {
    label: 'Message Developer',
    to: '/dashboard/message-developer',
    icon: MessageSquare,
    isActive: (pathname) => pathname.startsWith('/dashboard/message-developer'),
  },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const { pathname } = useRouter();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-slate-900 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Logo to="/dashboard" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Dashboard">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-6 py-5 text-xs text-slate-500">
          Need more audits? <Link to="/dashboard/billing" onClick={onClose} className="font-semibold text-indigo-400 hover:text-indigo-300">Upgrade plan</Link>
        </div>
      </aside>
    </>
  );
}
