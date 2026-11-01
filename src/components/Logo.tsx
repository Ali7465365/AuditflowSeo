import { Gauge } from 'lucide-react';
import { Link } from '@/lib/router';

interface LogoProps {
  to?: string;
}

export function Logo({ to = '/' }: LogoProps) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/30 transition-transform duration-300 group-hover:scale-105">
        <Gauge className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">AuditFlow SEO</span>
    </Link>
  );
}
