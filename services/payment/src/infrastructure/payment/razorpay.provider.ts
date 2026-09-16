import { createHmac } from "node:crypto";
import type {
  CreateProviderPaymentInput,
  PaymentProvider,
  ProviderPaymentIntent,
  VerifyProviderPaymentInput,
} from "../../domain/payment/payment.provider.js";
import { PaymentProviderError } from "../../application/payment/errors.js";

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export class RazorpayPaymentProvider implements PaymentProvider {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly baseUrl = "https://api.razorpay.com/v1";
  private readonly timeoutMs: number;

  constructor(
    keyId: string,
    keySecret: string,
    timeoutMs: number = 10000,
  ) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.timeoutMs = timeoutMs;
  }

  async createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentIntent> {
    const amountPaise = input.amount.mul(100).round().toNumber();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: input.currency,
          receipt: input.orderId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PaymentProviderError(
          `Razorpay order creation failed with status ${response.status}`,
        );
      }

      const body = (await response.json()) as RazorpayOrderResponse;

      return {
        provider: "razorpay",
        providerReference: body.id,
      };
    } catch (error) {
      if (error instanceof PaymentProviderError) throw error;
      throw new PaymentProviderError(
        `Razorpay order creation failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<{ valid: boolean }> {
    const expectedSignature = createHmac("sha256", this.keySecret)
      .update(`${input.providerReference}|${input.providerPaymentId}`)
      .digest("hex");

    const valid = expectedSignature === input.providerPaymentSignature;

    return { valid };
  }
}
