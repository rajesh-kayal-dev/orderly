import type { Decimal } from "decimal.js";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";

export type PaymentMethod = "cod" | "online";

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: Decimal;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string | null;
  providerReference: string | null;
  providerPaymentId: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed", "cancelled"],
  paid: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function canTransitionPaymentStatus(current: PaymentStatus, next: PaymentStatus): boolean {
  return PAYMENT_TRANSITIONS[current]?.includes(next) ?? false;
}