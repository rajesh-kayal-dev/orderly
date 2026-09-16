import type { Decimal } from "decimal.js";
import type { Payment, PaymentMethod, PaymentStatus } from "./payment.types.js";

export interface CreatePaymentData {
  orderId: string;
  customerId: string;
  amount: Decimal;
  currency: string;
  method: PaymentMethod;
  provider: string | null;
  providerReference: string | null;
}

export interface UpdatePaymentStatusData {
  status: PaymentStatus;
  providerPaymentId: string | null;
  failureReason: string | null;
  paidAt: Date | null;
}

export interface PaymentRepository {
  createPayment(data: CreatePaymentData): Promise<Payment>;
  findPaymentById(id: string): Promise<Payment | null>;
  findPaymentByOrder(orderId: string): Promise<Payment | null>;
  updatePaymentStatus(id: string, data: UpdatePaymentStatusData): Promise<Payment | null>;
}