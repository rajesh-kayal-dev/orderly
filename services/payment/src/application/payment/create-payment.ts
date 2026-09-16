import type { Decimal } from "decimal.js";
import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { PaymentProvider } from "../../domain/payment/payment.provider.js";
import type { Payment, PaymentMethod } from "../../domain/payment/payment.types.js";
import { PaymentStateConflictError, PaymentValidationError } from "./errors.js";

export interface CreatePaymentInput {
  orderId: string;
  amount: Decimal;
  currency?: string;
  method?: PaymentMethod;
}

export interface CreatePaymentDeps {
  payments: PaymentRepository;
  provider: PaymentProvider | null;
}

export const createPayment =
  (deps: CreatePaymentDeps) =>
  async (customerId: string, input: CreatePaymentInput): Promise<Payment> => {
    const method = input.method ?? "cod";
    const currency = input.currency ?? "INR";

    if (input.amount.lte(0)) {
      throw new PaymentValidationError("Payment amount must be greater than zero");
    }

    const existing = await deps.payments.findPaymentByOrder(input.orderId);

    if (existing) {
      if (existing.status === "paid") {
        throw new PaymentStateConflictError("Order already has a paid payment");
      }

      if (existing.status === "pending") {
        return existing;
      }
    }

    let provider: string | null = null;
    let providerReference: string | null = null;

    if (method === "online") {
      if (!deps.provider) {
        throw new PaymentValidationError("Payment provider is not configured");
      }

      const intent = await deps.provider.createPayment({
        orderId: input.orderId,
        amount: input.amount,
        currency,
      });

      provider = intent.provider;
      providerReference = intent.providerReference;
    }

    return deps.payments.createPayment({
      orderId: input.orderId,
      customerId,
      amount: input.amount,
      currency,
      method,
      provider,
      providerReference,
    });
  };