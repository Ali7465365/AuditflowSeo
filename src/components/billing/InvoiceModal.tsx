import { CheckCircle2, Download, Gauge, X } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '@/context/AuthContext';
import { useModalDismiss } from '@/lib/useModalDismiss';
import { PLAN_MAP, formatPrice } from '@/lib/plans';
import { formatDate } from '@/lib/usage';

interface InvoiceModalProps {
  profile: Profile;
  onClose: () => void;
}

function buildInvoiceNumber(issuedAt: Date, userId: string) {
  const datePart = issuedAt.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${datePart}-${userId.slice(0, 8).toUpperCase()}`;
}

export function InvoiceModal({ profile, onClose }: InvoiceModalProps) {
  const [issuedAt] = useState(() => new Date());
  useModalDismiss(onClose, true, { lockScroll: true });

  const plan = PLAN_MAP[profile.plan];
  const invoiceNumber = buildInvoiceNumber(issuedAt, profile.user_id);
  const auditsLabel = plan.auditLimit === null ? 'Unlimited audits per month' : `${plan.auditLimit} audits per month`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        className="animate-modal-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-5 sm:px-8">
          <div>
            <h2 id="invoice-modal-title" className="text-xl font-semibold tracking-tight text-white">
              Your invoice
            </h2>
            <p className="mt-1 text-sm text-slate-400">Download a copy for your records.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div id="invoice-document" className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-600">
                  <Gauge className="h-6 w-6" aria-hidden="true" />
                  <span className="text-lg font-bold text-slate-900">AuditFlow SEO</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Local SEO audits and white-label reports</p>
              </div>
              <div className="sm:text-right">
                <p className="text-3xl font-bold tracking-tight text-slate-900">Invoice</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Paid
                </span>
              </div>
            </div>

            <dl className="mt-8 grid gap-6 border-t border-slate-200 pt-8 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Billed to</dt>
                <dd className="mt-1.5 break-all text-sm font-medium text-slate-900">{profile.email}</dd>
              </div>
              <div className="sm:text-right">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Invoice details</dt>
                <dd className="mt-1.5 text-sm text-slate-900">
                  <span className="font-medium">{invoiceNumber}</span>
                </dd>
                <dd className="mt-1 text-sm text-slate-600">Issued {formatDate(issuedAt)}</dd>
              </div>
            </dl>

            <table className="mt-8 w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-slate-900">AuditFlow SEO {plan.name} plan</p>
                    <p className="mt-0.5 text-xs text-slate-500">Monthly subscription, {auditsLabel.toLowerCase()}</p>
                  </td>
                  <td className="py-4 text-right font-medium text-slate-900">{formatPrice(plan.price)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-indigo-600 px-5 py-4 text-white">
              <span className="text-sm font-semibold">Total paid</span>
              <span className="text-xl font-bold">{formatPrice(plan.price)}</span>
            </div>

            <p className="mt-8 text-center text-xs text-slate-500">Thank you for choosing AuditFlow SEO.</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/5 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
