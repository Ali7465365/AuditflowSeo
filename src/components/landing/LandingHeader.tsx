import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@/lib/router';
import { Logo } from '@/components/Logo';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'Sample Report', href: '/sample' },
  { label: 'Pricing', href: '/#pricing' },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 sm:inline-flex"
          >
            Login / Sign Up
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/5 bg-slate-950 px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth"
              className="mt-3 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-base font-semibold text-white hover:bg-indigo-500"
            >
              Login / Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
