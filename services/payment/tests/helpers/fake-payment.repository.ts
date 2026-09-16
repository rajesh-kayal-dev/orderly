import { Decimal } from "decimal.js";
import type {
  CreatePaymentData,
  PaymentRepository,
  UpdatePaymentStatusData,
} from "../../src/domain/payment/payment.repository.js";
import type { Payment } from "../../src/domain/payment/payment.types.js";

let paymentSeq = 0;

export function makePayment(id: string, overrides: Partial<Payment> = {}): Payment {
  const now = new Date();
  return {
    id,
    orderId: overrides.orderId ?? "order-1",
    customerId: overrides.customerId ?? "customer-1",
    amount: overrides.amount ?? new Decimal("10.00"),
    currency: overrides.currency ?? "INR",
    method: overrides.method ?? "cod",
    status: overrides.status ?? "pending",
    provider: overrides.provider ?? null,
    providerReference: overrides.providerReference ?? null,
    providerPaymentId: overrides.providerPaymentId ?? null,
    failureReason: overrides.failureReason ?? null,
    paidAt: overrides.paidAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

export interface FakePaymentRepositoryHandle {
  repo: PaymentRepository;
  seedPayment(payment: Payment): void;
  getPayments(): Payment[];
  nextPaymentId(): string;
}

export function createFakePaymentRepository(): FakePaymentRepositoryHandle {
  const payments: Payment[] = [];

  const nextPaymentId = (): string => `payment-${++paymentSeq}`;

  const repo: PaymentRepository = {
    async createPayment(data: CreatePaymentData) {
      const now = new Date();
      const payment = makePayment(nextPaymentId(), {
        orderId: data.orderId,
        customerId: data.customerId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        provider: data.provider,
        providerReference: data.providerReference,
        createdAt: now,
        updatedAt: now,
      });
      payments.push(payment);
      return payment;
    },

    async findPaymentById(id) {
      return payments.find((p) => p.id === id) ?? null;
    },

    async findPaymentByOrder(orderId) {
      const matches = payments
        .filter((p) => p.orderId === orderId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return matches[0] ?? null;
    },

    async updatePaymentStatus(id, data: UpdatePaymentStatusData) {
      const idx = payments.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const updated: Payment = {
        ...payments[idx]!,
        status: data.status,
        providerPaymentId: data.providerPaymentId,
        failureReason: data.failureReason,
        paidAt: data.paidAt,
        updatedAt: new Date(),
      };
      payments[idx] = updated;
      return updated;
    },
  };

  return {
    repo,
    seedPayment(payment) {
      const idx = payments.findIndex((p) => p.id === payment.id);
      if (idx === -1) payments.push(payment);
      else payments[idx] = payment;
    },
    getPayments: () => payments,
    nextPaymentId,
  };
}