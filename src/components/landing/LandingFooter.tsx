import { Github, Linkedin, Twitter } from 'lucide-react';
import { Logo } from '@/components/Logo';

const SOCIAL_LINKS = [
  { label: 'Twitter', icon: Twitter },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'GitHub', icon: Github },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-slate-500">Local SEO audits and white-label reports for agencies.</p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm" aria-label="Legal">
          <a href="#" className="text-slate-400 transition-colors hover:text-white">
            Terms
          </a>
          <a href="#" className="text-slate-400 transition-colors hover:text-white">
            Privacy
          </a>
          <a href="/#pricing" className="text-slate-400 transition-colors hover:text-white">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href="#"
              aria-label={social.label}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:text-white"
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AuditFlow SEO. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
