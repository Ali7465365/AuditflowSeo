import { Banknote, CreditCard, Layers, Smartphone, Wallet, type LucideIcon } from 'lucide-react';

export type PaymentMethodId = 'card' | 'google_pay' | 'stripe' | 'paypal' | 'jazzcash';

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', label: 'Visa / Credit Card', description: 'Visa, Mastercard, and Amex', icon: CreditCard },
  { id: 'google_pay', label: 'Google Pay', description: 'One-tap checkout with Google', icon: Smartphone },
  { id: 'stripe', label: 'Stripe', description: 'Secure card processing by Stripe', icon: Layers },
  { id: 'paypal', label: 'PayPal', description: 'Pay with your PayPal balance', icon: Wallet },
  { id: 'jazzcash', label: 'JazzCash', description: 'Mobile wallet payment', icon: Banknote },
];

export function getPaymentMethod(id: PaymentMethodId): PaymentMethod {
  const method = PAYMENT_METHODS.find((item) => item.id === id);
  if (!method) {
    throw new Error(`Unknown payment method: ${id}`);
  }
  return method;
}
