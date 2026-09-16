import { describe, it } from "node:test";
import assert from "node:assert";
import { Decimal } from "decimal.js";
import { createPayment } from "../src/application/payment/create-payment.js";
import { getPayment } from "../src/application/payment/get-payment.js";
import { getPaymentByOrder } from "../src/application/payment/get-payment-by-order.js";
import { markPaymentPaid } from "../src/application/payment/mark-payment-paid.js";
import { markPaymentFailed } from "../src/application/payment/mark-payment-failed.js";
import {
  PaymentForbiddenError,
  PaymentNotFoundError,
  PaymentStateConflictError,
  PaymentValidationError,
} from "../src/application/payment/errors.js";
import {
  createFakePaymentRepository,
  makePayment,
} from "./helpers/fake-payment.repository.js";
import { createFakePaymentProvider } from "./helpers/fake-payment.provider.js";

const amount = new Decimal("10.00");

describe("createPayment", () => {
  it("creates a pending COD payment without invoking a provider", async () => {
    const handle = createFakePaymentRepository();
    const provider = createFakePaymentProvider();
    const useCase = createPayment({ payments: handle.repo, provider, orderClient: null });

    const payment = await useCase("customer-1", {
      orderId: "order-1",
      amount,
      method: "cod",
    });

    assert.strictEqual(payment.status, "pending");
    assert.strictEqual(payment.method, "cod");
    assert.strictEqual(payment.customerId, "customer-1");
    assert.strictEqual(payment.orderId, "order-1");
    assert.strictEqual(payment.currency, "INR");
    assert.ok(payment.amount.equals(amount));
    assert.strictEqual(payment.provider, null);
    assert.strictEqual(payment.providerReference, null);
    assert.strictEqual(provider.createCalls.length, 0);
  });

  it("creates an online payment through the provider and stores the reference", async () => {
    const handle = createFakePaymentRepository();
    const provider = createFakePaymentProvider();
    const useCase = createPayment({ payments: handle.repo, provider, orderClient: null });

    const payment = await useCase("customer-1", {
      orderId: "order-1",
      amount,
      method: "online",
    });

    assert.strictEqual(payment.method, "online");
    assert.strictEqual(payment.provider, "razorpay");
    assert.strictEqual(payment.providerReference, "rzp_order-1");
    assert.strictEqual(provider.createCalls.length, 1);
    assert.strictEqual(provider.createCalls[0]?.orderId, "order-1");
  });

  it("rejects online payment when no provider is configured", async () => {
    const handle = createFakePaymentRepository();
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount, method: "online" }),
      (error: unknown) =>
        error instanceof PaymentValidationError &&
        error.message === "Payment provider is not configured",
    );
  });

  it("rejects a non-positive amount", async () => {
    const handle = createFakePaymentRepository();
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount: new Decimal(0), method: "cod" }),
      (error: unknown) =>
        error instanceof PaymentValidationError &&
        error.message === "Payment amount must be greater than zero",
    );

    assert.strictEqual(handle.getPayments().length, 0);
  });

  it("is idempotent and reuses an existing pending payment", async () => {
    const handle = createFakePaymentRepository();
    const existing = makePayment("payment-1", {
      orderId: "order-1",
      customerId: "customer-1",
      amount,
    });
    handle.seedPayment(existing);
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    const payment = await useCase("customer-1", { orderId: "order-1", amount });

    assert.strictEqual(payment.id, existing.id);
    assert.strictEqual(handle.getPayments().length, 1);
  });

  it("rejects creating a new payment when the order is already paid", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", status: "paid" }),
    );
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount }),
      (error: unknown) =>
        error instanceof PaymentStateConflictError &&
        error.message === "Order already has a paid payment",
    );
  });

  it("allows a fresh payment after a previous one failed", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount,
        status: "failed",
      }),
    );
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    const payment = await useCase("customer-1", { orderId: "order-1", amount });

    assert.notStrictEqual(payment.id, "payment-1");
    assert.strictEqual(handle.getPayments().length, 2);
  });
});

describe("getPayment", () => {
  it("returns the payment for the owning customer", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = getPayment(handle.repo);

    const payment = await useCase("customer-1", "payment-1");

    assert.strictEqual(payment.id, "payment-1");
  });

  it("throws PaymentNotFoundError for an unknown payment", async () => {
    const handle = createFakePaymentRepository();
    const useCase = getPayment(handle.repo);

    await assert.rejects(useCase("customer-1", "missing"), PaymentNotFoundError);
  });

  it("throws PaymentForbiddenError for another customer's payment", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = getPayment(handle.repo);

    await assert.rejects(useCase("customer-2", "payment-1"), PaymentForbiddenError);
  });
});

describe("getPaymentByOrder", () => {
  it("returns the payment for the owning customer's order", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = getPaymentByOrder(handle.repo);

    const payment = await useCase("customer-1", "order-1");

    assert.strictEqual(payment.id, "payment-1");
  });

  it("throws PaymentNotFoundError when the order has no payment", async () => {
    const handle = createFakePaymentRepository();
    const useCase = getPaymentByOrder(handle.repo);

    await assert.rejects(useCase("customer-1", "order-1"), PaymentNotFoundError);
  });

  it("throws PaymentForbiddenError for another customer's order", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = getPaymentByOrder(handle.repo);

    await assert.rejects(useCase("customer-2", "order-1"), PaymentForbiddenError);
  });
});

describe("markPaymentPaid", () => {
  it("marks a pending payment as paid and records the provider payment id", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = markPaymentPaid(handle.repo);

    const payment = await useCase("payment-1", { providerPaymentId: "pay_123" });

    assert.strictEqual(payment.status, "paid");
    assert.strictEqual(payment.providerPaymentId, "pay_123");
    assert.ok(payment.paidAt instanceof Date);
  });

  it("is idempotent when the payment is already paid", async () => {
    const handle = createFakePaymentRepository();
    const paid = makePayment("payment-1", {
      orderId: "order-1",
      customerId: "customer-1",
      status: "paid",
      paidAt: new Date(),
    });
    handle.seedPayment(paid);
    const useCase = markPaymentPaid(handle.repo);

    const payment = await useCase("payment-1");

    assert.strictEqual(payment, paid);
  });

  it("throws PaymentStateConflictError from a terminal status", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        status: "cancelled",
      }),
    );
    const useCase = markPaymentPaid(handle.repo);

    await assert.rejects(
      useCase("payment-1"),
      (error: unknown) =>
        error instanceof PaymentStateConflictError &&
        error.message === "Cannot change payment status from cancelled to paid",
    );
  });

  it("throws PaymentNotFoundError for an unknown payment", async () => {
    const handle = createFakePaymentRepository();
    const useCase = markPaymentPaid(handle.repo);

    await assert.rejects(useCase("missing"), PaymentNotFoundError);
  });
});

describe("markPaymentFailed", () => {
  it("marks a pending payment as failed and records the reason", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount }),
    );
    const useCase = markPaymentFailed(handle.repo);

    const payment = await useCase("payment-1", { failureReason: "Signature verification failed" });

    assert.strictEqual(payment.status, "failed");
    assert.strictEqual(payment.failureReason, "Signature verification failed");
    assert.strictEqual(payment.paidAt, null);
  });

  it("is idempotent when the payment is already failed", async () => {
    const handle = createFakePaymentRepository();
    const failed = makePayment("payment-1", {
      orderId: "order-1",
      customerId: "customer-1",
      status: "failed",
    });
    handle.seedPayment(failed);
    const useCase = markPaymentFailed(handle.repo);

    const payment = await useCase("payment-1");

    assert.strictEqual(payment, failed);
  });

  it("throws PaymentStateConflictError from a paid status", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        status: "paid",
      }),
    );
    const useCase = markPaymentFailed(handle.repo);

    await assert.rejects(
      useCase("payment-1"),
      (error: unknown) =>
        error instanceof PaymentStateConflictError &&
        error.message === "Cannot change payment status from paid to failed",
    );
  });

  it("throws PaymentNotFoundError for an unknown payment", async () => {
    const handle = createFakePaymentRepository();
    const useCase = markPaymentFailed(handle.repo);

    await assert.rejects(useCase("missing"), PaymentNotFoundError);
  });
});