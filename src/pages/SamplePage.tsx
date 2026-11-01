import { ArrowLeft, Printer } from 'lucide-react';
import { AuditReport } from '@/components/report/AuditReport';
import { Logo } from '@/components/Logo';
import { SAMPLE_AUDIT } from '@/lib/audits';
import { Link } from '@/lib/router';

export function SamplePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-white sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              <Printer className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-8 print:hidden">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Sample report</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">See what your clients receive</h1>
          <p className="mt-2 text-slate-400">
            This is the Free plan layout, which includes the AuditFlow watermark. Paid plans remove it and add your logo.
          </p>
        </div>
        <AuditReport audit={SAMPLE_AUDIT} removesWatermark={false} logoData={null} />
      </main>
    </div>
  );
}
