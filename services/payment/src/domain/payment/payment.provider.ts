import type { Decimal } from "decimal.js";

export interface CreateProviderPaymentInput {
  orderId: string;
  amount: Decimal;
  currency: string;
}

export interface ProviderPaymentIntent {
  provider: string;
  providerReference: string;
}

export interface VerifyProviderPaymentInput {
  providerReference: string;
  providerPaymentId: string;
}

export interface PaymentProvider {
  createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentIntent>;
  verifyPayment(input: VerifyProviderPaymentInput): Promise<{ valid: boolean }>;
}