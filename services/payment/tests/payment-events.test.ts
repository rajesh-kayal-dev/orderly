import assert from "node:assert";
import { describe, it } from "node:test";
import {
  EventTypes,
  topicOf,
  type EventEnvelope,
  type EventType,
  type PayloadOf,
  type PaymentCreatedPayload,
  type PaymentFailedPayload,
  type PaymentSucceededPayload,
} from "@orderly/contracts";
import type { OrderlyProducer, PublishOptions } from "@orderly/events";
import { Decimal } from "decimal.js";
import { createPayment } from "../src/application/payment/create-payment.js";
import { markPaymentPaid } from "../src/application/payment/mark-payment-paid.js";
import { markPaymentFailed } from "../src/application/payment/mark-payment-failed.js";
import { verifyPayment } from "../src/application/payment/verify-payment.js";
import type { PaymentEventPublisher } from "../src/application/payment/payment-event.publisher.js";
import type { PaymentRepository } from "../src/domain/payment/payment.repository.js";
import type { Payment } from "../src/domain/payment/payment.types.js";
import { KafkaPaymentEventPublisher } from "../src/infrastructure/events/kafka-payment-event.publisher.js";
import { createFakePaymentRepository, makePayment } from "./helpers/fake-payment.repository.js";
import { createFakePaymentProvider } from "./helpers/fake-payment.provider.js";
import { createFakeOrderClient, makeOrderTotal } from "./helpers/fake-order.client.js";

class RecordingPaymentEventPublisher implements PaymentEventPublisher {
  readonly created: Payment[] = [];
  readonly succeeded: Payment[] = [];
  readonly failed: Payment[] = [];
  readonly cancelled: Payment[] = [];
  readonly refunded: Array<{ payment: Payment; refundAmount: Decimal }> = [];

  async publishPaymentCreated(payment: Payment): Promise<void> {
    this.created.push(payment);
  }

  async publishPaymentSucceeded(payment: Payment): Promise<void> {
    this.succeeded.push(payment);
  }

  async publishPaymentFailed(payment: Payment): Promise<void> {
    this.failed.push(payment);
  }

  async publishPaymentCancelled(payment: Payment): Promise<void> {
    this.cancelled.push(payment);
  }

  async publishPaymentRefunded(payment: Payment, refundAmount: Decimal): Promise<void> {
    this.refunded.push({ payment, refundAmount });
  }
}

const amount = new Decimal("49.99");

describe("Payment lifecycle event publishing", () => {
  it("publishes payment.created only after successful payment creation", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: null,
      eventPublisher,
    });

    const payment = await useCase("customer-1", {
      orderId: "order-101",
      amount,
      method: "cod",
    });

    assert.strictEqual(eventPublisher.created.length, 1);
    assert.strictEqual(eventPublisher.created[0]?.id, payment.id);
    assert.strictEqual(eventPublisher.created[0]?.orderId, "order-101");
    assert.strictEqual(eventPublisher.succeeded.length, 0);
    assert.strictEqual(eventPublisher.failed.length, 0);
  });

  it("does not publish payment.created when database persistence fails", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    const failingRepo: PaymentRepository = {
      ...handle.repo,
      async createPayment() {
        throw new Error("database connection timeout");
      },
    };
    const useCase = createPayment({
      payments: failingRepo,
      provider: null,
      orderClient: null,
      eventPublisher,
    });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-102", amount, method: "cod" }),
      /database connection timeout/,
    );

    assert.strictEqual(eventPublisher.created.length, 0);
  });

  it("publishes payment.succeeded after markPaymentPaid updates status", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    const initial = makePayment("payment-201", {
      orderId: "order-201",
      customerId: "customer-1",
      amount,
      status: "pending",
    });
    handle.seedPayment(initial);

    const useCase = markPaymentPaid(handle.repo, eventPublisher);
    const updated = await useCase("payment-201", { providerPaymentId: "rzp_pay_999" });

    assert.strictEqual(updated.status, "paid");
    assert.strictEqual(eventPublisher.succeeded.length, 1);
    assert.strictEqual(eventPublisher.succeeded[0]?.id, "payment-201");
    assert.strictEqual(eventPublisher.succeeded[0]?.providerPaymentId, "rzp_pay_999");
  });

  it("does not publish payment.succeeded if database update fails", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    handle.seedPayment(
      makePayment("payment-202", { orderId: "order-202", customerId: "customer-1", amount }),
    );
    const failingRepo: PaymentRepository = {
      ...handle.repo,
      async updatePaymentStatus() {
        throw new Error("DB update error");
      },
    };

    const useCase = markPaymentPaid(failingRepo, eventPublisher);
    await assert.rejects(useCase("payment-202"), /DB update error/);

    assert.strictEqual(eventPublisher.succeeded.length, 0);
  });

  it("publishes payment.failed after markPaymentFailed updates status", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    handle.seedPayment(
      makePayment("payment-301", { orderId: "order-301", customerId: "customer-1", amount }),
    );

    const useCase = markPaymentFailed(handle.repo, eventPublisher);
    const updated = await useCase("payment-301", { failureReason: "Card declined" });

    assert.strictEqual(updated.status, "failed");
    assert.strictEqual(eventPublisher.failed.length, 1);
    assert.strictEqual(eventPublisher.failed[0]?.id, "payment-301");
    assert.strictEqual(eventPublisher.failed[0]?.failureReason, "Card declined");
  });

  it("publishes payment.succeeded on successful online payment verification", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    const provider = createFakePaymentProvider();
    const orderClientHandle = createFakeOrderClient();
    orderClientHandle.setOrder(
      makeOrderTotal({ id: "order-401", customerId: "customer-1", totalAmount: amount }),
    );

    handle.seedPayment(
      makePayment("payment-401", {
        orderId: "order-401",
        customerId: "customer-1",
        amount,
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order_401",
        status: "pending",
      }),
    );

    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClientHandle.client,
      eventPublisher,
    });

    const payment = await useCase("customer-1", "payment-401", "token-1", {
      providerReference: "rzp_order_401",
      providerPaymentId: "pay_401",
      providerPaymentSignature: "valid-signature",
    });

    assert.strictEqual(payment.status, "paid");
    assert.strictEqual(eventPublisher.succeeded.length, 1);
    assert.strictEqual(eventPublisher.succeeded[0]?.id, "payment-401");
  });

  it("publishes payment.failed on failed online payment verification", async () => {
    const handle = createFakePaymentRepository();
    const eventPublisher = new RecordingPaymentEventPublisher();
    const provider = createFakePaymentProvider();
    provider.setVerifyResult({ valid: false });
    const orderClientHandle = createFakeOrderClient();
    orderClientHandle.setOrder(
      makeOrderTotal({ id: "order-501", customerId: "customer-1", totalAmount: amount }),
    );

    handle.seedPayment(
      makePayment("payment-501", {
        orderId: "order-501",
        customerId: "customer-1",
        amount,
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order_501",
        status: "pending",
      }),
    );

    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClientHandle.client,
      eventPublisher,
    });

    await assert.rejects(
      useCase("customer-1", "payment-501", "token-1", {
        providerReference: "rzp_order_501",
        providerPaymentId: "pay_501",
        providerPaymentSignature: "invalid-signature",
      }),
      /Payment verification failed/,
    );

    assert.strictEqual(eventPublisher.failed.length, 1);
    assert.strictEqual(eventPublisher.failed[0]?.id, "payment-501");
    assert.strictEqual(
      eventPublisher.failed[0]?.failureReason,
      "Provider signature verification failed",
    );
  });
});

describe("KafkaPaymentEventPublisher", () => {
  it("uses Event Backbone event types, payloads, keys, topics, and envelope conventions", async () => {
    const publishedMessages: Array<{
      type: EventType;
      payload: unknown;
      options: PublishOptions | undefined;
    }> = [];

    const fakeProducer: OrderlyProducer = {
      async connect() {},
      async disconnect() {},
      async publish<K extends EventType>(type: K, payload: PayloadOf<K>, options?: PublishOptions) {
        publishedMessages.push({ type, payload, options });
      },
      async send(_envelope: EventEnvelope, _options?: PublishOptions) {},
    };

    const publisher = new KafkaPaymentEventPublisher(fakeProducer);
    const paidAt = new Date("2026-09-18T12:00:00.000Z");

    const payment = makePayment("pay-777", {
      orderId: "order-777",
      customerId: "customer-777",
      amount: new Decimal("150.75"),
      currency: "INR",
      method: "online",
      provider: "razorpay",
      status: "paid",
      paidAt,
    });

    await publisher.publishPaymentCreated(payment);
    await publisher.publishPaymentSucceeded(payment);

    const failedPayment = makePayment("pay-888", {
      orderId: "order-888",
      customerId: "customer-777",
      amount: new Decimal("50.00"),
      failureReason: "Insufficient funds",
    });

    await publisher.publishPaymentFailed(failedPayment);
    await publisher.publishPaymentCancelled(failedPayment);
    await publisher.publishPaymentRefunded(payment, new Decimal("150.75"));

    assert.strictEqual(publishedMessages.length, 5);

    // Verify payment.created
    assert.strictEqual(publishedMessages[0]?.type, EventTypes.PaymentCreated);
    assert.deepStrictEqual(publishedMessages[0]?.payload as PaymentCreatedPayload, {
      paymentId: "pay-777",
      orderId: "order-777",
      customerId: "customer-777",
      amount: "150.75",
      currency: "INR",
      method: "online",
    });
    assert.deepStrictEqual(publishedMessages[0]?.options, { key: "pay-777" });

    // Verify payment.succeeded
    assert.strictEqual(publishedMessages[1]?.type, EventTypes.PaymentSucceeded);
    assert.deepStrictEqual(publishedMessages[1]?.payload as PaymentSucceededPayload, {
      paymentId: "pay-777",
      orderId: "order-777",
      amount: "150.75",
      currency: "INR",
      provider: "razorpay",
      paidAt: paidAt.toISOString(),
    });

    // Verify payment.failed
    assert.strictEqual(publishedMessages[2]?.type, EventTypes.PaymentFailed);
    assert.deepStrictEqual(publishedMessages[2]?.payload as PaymentFailedPayload, {
      paymentId: "pay-888",
      orderId: "order-888",
      amount: "50.00",
      currency: "INR",
      failureReason: "Insufficient funds",
    });

    // Verify topics
    assert.deepStrictEqual(publishedMessages.map((m) => topicOf(m.type)), [
      "orderly.payment.created",
      "orderly.payment.succeeded",
      "orderly.payment.failed",
      "orderly.payment.cancelled",
      "orderly.payment.refunded",
    ]);
  });

  it("never includes sensitive payment data (cards, CVV, secrets) in event payloads", async () => {
    const publishedMessages: Array<{ type: EventType; payload: unknown }> = [];
    const fakeProducer: OrderlyProducer = {
      async connect() {},
      async disconnect() {},
      async publish<K extends EventType>(type: K, payload: PayloadOf<K>) {
        publishedMessages.push({ type, payload });
      },
      async send() {},
    };

    const publisher = new KafkaPaymentEventPublisher(fakeProducer);
    const payment = makePayment("pay-sec", {
      orderId: "order-sec",
      customerId: "customer-sec",
      amount: new Decimal("99.00"),
    });

    await publisher.publishPaymentCreated(payment);
    await publisher.publishPaymentSucceeded(payment);

    for (const msg of publishedMessages) {
      const json = JSON.stringify(msg.payload);
      assert.strictEqual(json.includes("cardNumber"), false);
      assert.strictEqual(json.includes("cvv"), false);
      assert.strictEqual(json.includes("secret"), false);
      assert.strictEqual(json.includes("apiKey"), false);
      assert.strictEqual(json.includes("password"), false);
    }
  });
});
