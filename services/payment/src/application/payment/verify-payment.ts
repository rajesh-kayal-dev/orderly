import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { PaymentProvider } from "../../domain/payment/payment.provider.js";
import type { OrderClient } from "../../domain/order/order.client.js";
import type { Payment } from "../../domain/payment/payment.types.js";
import type { PaymentEventPublisher } from "./payment-event.publisher.js";
import {
  PaymentForbiddenError,
  PaymentNotFoundError,
  PaymentProviderError,
  PaymentStateConflictError,
  PaymentValidationError,
  PaymentVerificationError,
} from "./errors.js";

export interface VerifyPaymentInput {
  providerReference: string;
  providerPaymentId: string;
  providerPaymentSignature: string;
}

export interface VerifyPaymentDeps {
  payments: PaymentRepository;
  provider: PaymentProvider | null;
  orderClient: OrderClient | null;
  eventPublisher?: PaymentEventPublisher | null;
}

export const verifyPayment =
  (deps: VerifyPaymentDeps) =>
  async (
    customerId: string,
    paymentId: string,
    authToken: string,
    input: VerifyPaymentInput,
  ): Promise<Payment> => {
    const payment = await deps.payments.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.customerId !== customerId) {
      throw new PaymentForbiddenError();
    }

    if (payment.status === "paid") {
      throw new PaymentStateConflictError("Payment is already paid");
    }

    if (payment.status !== "pending") {
      throw new PaymentStateConflictError(
        `Cannot verify payment in "${payment.status}" status`,
      );
    }

    if (payment.method !== "online") {
      throw new PaymentVerificationError("Only online payments can be verified");
    }

    if (!deps.provider) {
      throw new PaymentValidationError("Payment provider is not configured");
    }

    if (!deps.orderClient) {
      throw new PaymentProviderError("Order client is not configured");
    }

    const orderTotal = await deps.orderClient.getOrderTotal(payment.orderId, authToken);

    if (!orderTotal) {
      throw new PaymentProviderError("Order not found");
    }

    if (orderTotal.customerId !== customerId) {
      throw new PaymentForbiddenError();
    }

    if (!orderTotal.totalAmount.equals(payment.amount)) {
      throw new PaymentVerificationError("Payment amount does not match order total");
    }

    try {
      const result = await deps.provider.verifyPayment({
        providerReference: input.providerReference,
        providerPaymentId: input.providerPaymentId,
        providerPaymentSignature: input.providerPaymentSignature,
      });

      if (!result.valid) {
        const failedPayment = await deps.payments.updatePaymentStatus(payment.id, {
          status: "failed",
          providerPaymentId: input.providerPaymentId,
          failureReason: "Provider signature verification failed",
          paidAt: null,
        });

        if (deps.eventPublisher && failedPayment) {
          await deps.eventPublisher.publishPaymentFailed(failedPayment);
        }

        throw new PaymentVerificationError("Payment verification failed");
      }
    } catch (error) {
      if (error instanceof PaymentVerificationError) throw error;
      if (error instanceof PaymentNotFoundError) throw error;
      if (error instanceof PaymentForbiddenError) throw error;
      if (error instanceof PaymentStateConflictError) throw error;
      throw new PaymentProviderError(
        `Provider verification error: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }

    const updated = await deps.payments.updatePaymentStatus(payment.id, {
      status: "paid",
      providerPaymentId: input.providerPaymentId,
      failureReason: null,
      paidAt: new Date(),
    });

    if (deps.eventPublisher && updated) {
      await deps.eventPublisher.publishPaymentSucceeded(updated);
    }

    return updated!;
  };
