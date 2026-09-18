import type { Decimal } from "decimal.js";
import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { PaymentProvider } from "../../domain/payment/payment.provider.js";
import type { OrderClient } from "../../domain/order/order.client.js";
import type { Payment, PaymentMethod } from "../../domain/payment/payment.types.js";
import type { PaymentEventPublisher } from "./payment-event.publisher.js";
import {
  PaymentForbiddenError,
  PaymentProviderError,
  PaymentStateConflictError,
  PaymentValidationError,
} from "./errors.js";

export interface CreatePaymentInput {
  orderId: string;
  amount: Decimal;
  currency?: string;
  method?: PaymentMethod;
}

export interface CreatePaymentDeps {
  payments: PaymentRepository;
  provider: PaymentProvider | null;
  orderClient: OrderClient | null;
  eventPublisher?: PaymentEventPublisher | null;
}

export const createPayment =
  (deps: CreatePaymentDeps) =>
  async (
    customerId: string,
    input: CreatePaymentInput,
    authToken?: string,
  ): Promise<Payment> => {
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

    if (deps.orderClient) {
      if (!authToken) {
        throw new PaymentValidationError("Authentication token is required to create a payment");
      }

      const orderTotal = await deps.orderClient.getOrderTotal(input.orderId, authToken);

      if (!orderTotal) {
        throw new PaymentProviderError("Order not found");
      }

      if (orderTotal.customerId !== customerId) {
        throw new PaymentForbiddenError();
      }

      if (!orderTotal.totalAmount.equals(input.amount)) {
        throw new PaymentValidationError("Payment amount does not match order total");
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

    const payment = await deps.payments.createPayment({
      orderId: input.orderId,
      customerId,
      amount: input.amount,
      currency,
      method,
      provider,
      providerReference,
    });

    if (deps.eventPublisher) {
      await deps.eventPublisher.publishPaymentCreated(payment);
    }

    return payment;
  };