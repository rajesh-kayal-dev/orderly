import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { Payment } from "../../domain/payment/payment.types.js";
import { canTransitionPaymentStatus } from "../../domain/payment/payment.types.js";
import type { PaymentEventPublisher } from "./payment-event.publisher.js";
import { PaymentNotFoundError, PaymentStateConflictError } from "./errors.js";

export interface MarkPaymentPaidInput {
  providerPaymentId?: string | null;
}

export const markPaymentPaid =
  (payments: PaymentRepository, eventPublisher?: PaymentEventPublisher | null) =>
  async (paymentId: string, input: MarkPaymentPaidInput = {}): Promise<Payment> => {
    const payment = await payments.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.status === "paid") {
      return payment;
    }

    if (!canTransitionPaymentStatus(payment.status, "paid")) {
      throw new PaymentStateConflictError(
        `Cannot change payment status from ${payment.status} to paid`,
      );
    }

    const updated = await payments.updatePaymentStatus(paymentId, {
      status: "paid",
      providerPaymentId: input.providerPaymentId ?? null,
      failureReason: null,
      paidAt: new Date(),
    });

    if (eventPublisher && updated) {
      await eventPublisher.publishPaymentSucceeded(updated);
    }

    return updated!;
  };