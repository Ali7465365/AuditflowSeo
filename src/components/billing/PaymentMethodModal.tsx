import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PAYMENT_METHODS, type PaymentMethodId } from '@/lib/paymentMethods';

interface PaymentMethodModalProps {
  planName: string;
  priceLabel: string;
  onClose: () => void;
  onContinue: (method: PaymentMethodId) => Promise<void>;
}

export function PaymentMethodModal({ planName, priceLabel, onClose, onContinue }: PaymentMethodModalProps) {
  const [selected, setSelected] = useState<PaymentMethodId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [submitting, onClose]);

  async function handleContinue() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onContinue(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="animate-modal-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/60 sm:max-w-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5 sm:px-8">
          <div>
            <h2 id="payment-modal-title" className="text-xl font-semibold tracking-tight text-white">
              Please select your way to pay
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {planName} plan, {priceLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close payment options"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          role="radiogroup"
          aria-label="Payment methods"
          className="grid grid-cols-1 gap-3 px-6 py-6 sm:grid-cols-2 sm:px-8"
        >
          {PAYMENT_METHODS.map((method, index) => {
            const isSelected = selected === method.id;
            const isLastOdd = index === PAYMENT_METHODS.length - 1 && PAYMENT_METHODS.length % 2 === 1;
            return (
              <button
                key={method.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={submitting}
                onClick={() => setSelected(method.id)}
                className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed ${
                  isLastOdd ? 'sm:col-span-2' : ''
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500'
                    : 'border-white/10 bg-slate-950/60 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-900'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-300 group-hover:text-white'
                  }`}
                >
                  <method.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 pr-6">
                  <span className="block font-semibold text-white">{method.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">{method.description}</span>
                </span>
                {isSelected && (
                  <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-indigo-300" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-white/5 px-6 py-5 sm:px-8">
          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:hover:translate-y-0"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Updating plan...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
