import { describe, it } from "node:test";
import assert from "node:assert";
import { Decimal } from "decimal.js";
import { createPayment } from "../src/application/payment/create-payment.js";
import { verifyPayment } from "../src/application/payment/verify-payment.js";
import {
  PaymentForbiddenError,
  PaymentNotFoundError,
  PaymentProviderError,
  PaymentStateConflictError,
  PaymentValidationError,
  PaymentVerificationError,
} from "../src/application/payment/errors.js";
import {
  createFakePaymentRepository,
  makePayment,
} from "./helpers/fake-payment.repository.js";
import { createFakePaymentProvider } from "./helpers/fake-payment.provider.js";
import {
  createFakeOrderClient,
  makeOrderTotal,
} from "./helpers/fake-order.client.js";

const amount = new Decimal("10.00");
const verifyInput = {
  providerReference: "rzp_order-1",
  providerPaymentId: "pay_123",
  providerPaymentSignature: "sig_123",
};

function pendingOnlinePayment(orderId = "order-1", customerId = "customer-1") {
  return makePayment("payment-1", {
    orderId,
    customerId,
    amount,
    method: "online",
    provider: "razorpay",
    providerReference: "rzp_order-1",
  });
}

describe("createPayment with order verification", () => {
  it("skips verification when orderClient is null", async () => {
    const handle = createFakePaymentRepository();
    const useCase = createPayment({ payments: handle.repo, provider: null, orderClient: null });

    const payment = await useCase("customer-1", { orderId: "order-1", amount });

    assert.strictEqual(payment.status, "pending");
    assert.strictEqual(payment.amount.toString(), "10");
  });

  it("rejects a payment amount that does not match the order total", async () => {
    const handle = createFakePaymentRepository();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(
      makeOrderTotal({ id: "order-1", totalAmount: new Decimal("20.00"), customerId: "customer-1" }),
    );
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount: new Decimal("10.00") }, "token-1"),
      (error: unknown) =>
        error instanceof PaymentValidationError &&
        error.message === "Payment amount does not match order total",
    );

    assert.strictEqual(handle.getPayments().length, 0);
    assert.strictEqual(orderClient.getFetchCalls().length, 1);
  });

  it("rejects when the token is missing while order verification is configured", async () => {
    const handle = createFakePaymentRepository();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal());
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount }),
      (error: unknown) =>
        error instanceof PaymentValidationError &&
        error.message === "Authentication token is required to create a payment",
    );
  });

  it("rejects when the order does not exist", async () => {
    const handle = createFakePaymentRepository();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(null);
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-missing", amount }, "token-1"),
      (error: unknown) =>
        error instanceof PaymentProviderError && error.message === "Order not found",
    );
  });

  it("rejects when the order belongs to another customer", async () => {
    const handle = createFakePaymentRepository();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ customerId: "customer-2" }));
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", { orderId: "order-1", amount }, "token-1"),
      (error: unknown) =>
        error instanceof PaymentForbiddenError &&
        error.message === "Not authorized to access this payment",
    );
  });

  it("creates the payment when the amount matches the order total", async () => {
    const handle = createFakePaymentRepository();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    const useCase = createPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    const payment = await useCase("customer-1", { orderId: "order-1", amount }, "token-1");

    assert.strictEqual(payment.status, "pending");
    assert.strictEqual(orderClient.getFetchCalls()[0]?.authToken, "token-1");
  });
});

describe("verifyPayment", () => {
  it("marks a pending online payment as paid when verification succeeds", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: amount }));
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    const payment = await useCase("customer-1", "payment-1", "token-1", verifyInput);

    assert.strictEqual(payment.status, "paid");
    assert.strictEqual(payment.providerPaymentId, "pay_123");
    assert.ok(payment.paidAt instanceof Date);
    assert.strictEqual(provider.verifyCalls.length, 1);
    assert.strictEqual(provider.verifyCalls[0]?.providerReference, "rzp_order-1");
    assert.strictEqual(provider.verifyCalls[0]?.providerPaymentSignature, "sig_123");
  });

  it("marks the payment failed when provider verification is invalid", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    provider.setVerifyResult({ valid: false });
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: amount }));
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentVerificationError &&
        error.message === "Payment verification failed",
    );

    const payment = handle.getPayments().find((p) => p.id === "payment-1")!;
    assert.strictEqual(payment.status, "failed");
    assert.strictEqual(
      payment.failureReason,
      "Provider signature verification failed",
    );
  });

  it("throws PaymentNotFoundError for an unknown payment", async () => {
    const handle = createFakePaymentRepository();
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "missing", "token-1", verifyInput),
      PaymentNotFoundError,
    );
  });

  it("throws PaymentForbiddenError for another customer's payment", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-2", "payment-1", "token-1", verifyInput),
      PaymentForbiddenError,
    );
  });

  it("throws PaymentStateConflictError when the payment is already paid", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount,
        method: "online",
        status: "paid",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentStateConflictError &&
        error.message === "Payment is already paid",
    );
  });

  it("throws PaymentStateConflictError from a terminal status", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount,
        method: "online",
        status: "cancelled",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentStateConflictError &&
        error.message === "Cannot verify payment in \"cancelled\" status",
    );
  });

  it("rejects verifying a COD payment", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(
      makePayment("payment-1", { orderId: "order-1", customerId: "customer-1", amount, method: "cod" }),
    );
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentVerificationError &&
        error.message === "Only online payments can be verified",
    );
  });

  it("rejects verification when no provider is configured", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const orderClient = createFakeOrderClient();
    const useCase = verifyPayment({
      payments: handle.repo,
      provider: null,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentValidationError &&
        error.message === "Payment provider is not configured",
    );
  });

  it("rejects verification when the order total differs from the payment amount", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("99.99") }));
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentVerificationError &&
        error.message === "Payment amount does not match order total",
    );

    assert.strictEqual(provider.verifyCalls.length, 0);
  });

  it("rejects verification when the order is not found", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment("order-404"));
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(null);
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentProviderError && error.message === "Order not found",
    );
  });

  it("rejects verification when the order belongs to another customer", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ customerId: "customer-2" }));
    const useCase = verifyPayment({
      payments: handle.repo,
      provider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      PaymentForbiddenError,
    );
  });

  it("wraps provider exceptions as PaymentProviderError", async () => {
    const handle = createFakePaymentRepository();
    handle.seedPayment(pendingOnlinePayment());
    const provider = createFakePaymentProvider();
    const failingProvider = {
      ...provider,
      async verifyPayment() {
        throw new Error("downstream provider exploded");
      },
    };
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: amount }));
    const useCase = verifyPayment({
      payments: handle.repo,
      provider: failingProvider,
      orderClient: orderClient.client,
    });

    await assert.rejects(
      useCase("customer-1", "payment-1", "token-1", verifyInput),
      (error: unknown) =>
        error instanceof PaymentProviderError &&
        error.message === "Provider verification error: downstream provider exploded",
    );
  });
});