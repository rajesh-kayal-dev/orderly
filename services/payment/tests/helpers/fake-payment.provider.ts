import type {
  CreateProviderPaymentInput,
  PaymentProvider,
} from "../../src/domain/payment/payment.provider.js";

export interface FakePaymentProvider extends PaymentProvider {
  createCalls: CreateProviderPaymentInput[];
}

export function createFakePaymentProvider(): FakePaymentProvider {
  const createCalls: CreateProviderPaymentInput[] = [];

  return {
    createCalls,
    async createPayment(input: CreateProviderPaymentInput) {
      createCalls.push(input);
      return { provider: "razorpay", providerReference: `rzp_${input.orderId}` };
    },
    async verifyPayment() {
      return { valid: true };
    },
  };
}