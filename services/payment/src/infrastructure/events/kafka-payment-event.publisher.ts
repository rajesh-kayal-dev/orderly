import { EventTypes } from "@orderly/contracts";
import type { OrderlyProducer } from "@orderly/events";
import type { Decimal } from "decimal.js";
import type { PaymentEventPublisher } from "../../application/payment/payment-event.publisher.js";
import type { Payment } from "../../domain/payment/payment.types.js";

export class KafkaPaymentEventPublisher implements PaymentEventPublisher {
  constructor(private readonly producer: OrderlyProducer) {}

  async publishPaymentCreated(payment: Payment): Promise<void> {
    await this.producer.publish(
      EventTypes.PaymentCreated,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        customerId: payment.customerId,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
        method: payment.method,
      },
      { key: payment.id },
    );
  }

  async publishPaymentSucceeded(payment: Payment): Promise<void> {
    await this.producer.publish(
      EventTypes.PaymentSucceeded,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
        provider: payment.provider,
        paidAt: (payment.paidAt ?? new Date()).toISOString(),
      },
      { key: payment.id },
    );
  }

  async publishPaymentFailed(payment: Payment): Promise<void> {
    await this.producer.publish(
      EventTypes.PaymentFailed,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount.toFixed(2),
        currency: payment.currency,
        failureReason: payment.failureReason,
      },
      { key: payment.id },
    );
  }

  async publishPaymentCancelled(payment: Payment): Promise<void> {
    await this.producer.publish(
      EventTypes.PaymentCancelled,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
      },
      { key: payment.id },
    );
  }

  async publishPaymentRefunded(payment: Payment, refundAmount: Decimal): Promise<void> {
    await this.producer.publish(
      EventTypes.PaymentRefunded,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        refundAmount: refundAmount.toFixed(2),
      },
      { key: payment.id },
    );
  }
}
