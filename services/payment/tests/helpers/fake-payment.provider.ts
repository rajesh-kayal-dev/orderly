import type {
  CreateProviderPaymentInput,
  PaymentProvider,
  VerifyProviderPaymentInput,
} from "../../src/domain/payment/payment.provider.js";

export interface FakePaymentProvider extends PaymentProvider {
  createCalls: CreateProviderPaymentInput[];
  verifyCalls: VerifyProviderPaymentInput[];
  setVerifyResult(result: { valid: boolean }): void;
}

export function createFakePaymentProvider(): FakePaymentProvider {
  const createCalls: CreateProviderPaymentInput[] = [];
  const verifyCalls: VerifyProviderPaymentInput[] = [];
  let verifyResult: { valid: boolean } = { valid: true };

  return {
    createCalls,
    verifyCalls,
    setVerifyResult(result) {
      verifyResult = result;
    },
    async createPayment(input: CreateProviderPaymentInput) {
      createCalls.push(input);
      return { provider: "razorpay", providerReference: `rzp_${input.orderId}` };
    },
    async verifyPayment(input: VerifyProviderPaymentInput) {
      verifyCalls.push(input);
      return verifyResult;
    },
  };
}