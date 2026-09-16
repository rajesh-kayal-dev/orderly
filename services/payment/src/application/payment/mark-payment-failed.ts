import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { Payment } from "../../domain/payment/payment.types.js";
import { canTransitionPaymentStatus } from "../../domain/payment/payment.types.js";
import { PaymentNotFoundError, PaymentStateConflictError } from "./errors.js";

export interface MarkPaymentFailedInput {
  failureReason?: string | null;
}

export const markPaymentFailed =
  (payments: PaymentRepository) =>
  async (paymentId: string, input: MarkPaymentFailedInput = {}): Promise<Payment> => {
    const payment = await payments.findPaymentById(paymentId);

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.status === "failed") {
      return payment;
    }

    if (!canTransitionPaymentStatus(payment.status, "failed")) {
      throw new PaymentStateConflictError(
        `Cannot change payment status from ${payment.status} to failed`,
      );
    }

    const updated = await payments.updatePaymentStatus(paymentId, {
      status: "failed",
      providerPaymentId: null,
      failureReason: input.failureReason ?? null,
      paidAt: null,
    });

    return updated!;
  };