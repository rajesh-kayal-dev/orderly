import type { Decimal } from "decimal.js";
import type { Payment } from "../../domain/payment/payment.types.js";

/**
 * Publishes Payment lifecycle facts after the corresponding Payment persistence
 * operation has succeeded. Implementations are infrastructure concerns.
 */
export interface PaymentEventPublisher {
  publishPaymentCreated(payment: Payment): Promise<void>;
  publishPaymentSucceeded(payment: Payment): Promise<void>;
  publishPaymentFailed(payment: Payment): Promise<void>;
  publishPaymentCancelled(payment: Payment): Promise<void>;
  publishPaymentRefunded(payment: Payment, refundAmount: Decimal): Promise<void>;
}
