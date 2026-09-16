import { describe, it, afterEach } from "node:test";
import assert from "node:assert";
import { Decimal } from "decimal.js";
import type { HttpTestApi } from "./helpers/http-api.js";
import { createHttpTestApi, request } from "./helpers/http-api.js";
import { createFakePaymentProvider } from "./helpers/fake-payment.provider.js";
import { makePayment } from "./helpers/fake-payment.repository.js";
import {
  createFakeOrderClient,
  makeOrderTotal,
} from "./helpers/fake-order.client.js";

describe("payment verify HTTP API", () => {
  let api: HttpTestApi | undefined;

  afterEach(async () => {
    await api?.close();
    api = undefined;
  });

  const verifyBody = {
    razorpay_order_id: "rzp_order-1",
    razorpay_payment_id: "pay_123",
    razorpay_signature: "sig_123",
  };

  it("requires authentication to verify a payment", async () => {
    api = await createHttpTestApi({ provider: createFakePaymentProvider(), orderClient: createFakeOrderClient().client });

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      body: verifyBody,
    });

    assert.strictEqual(response.status, 401);
  });

  it("marks a pending online payment as paid on successful verification", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(response.body!.success, true);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.status, "paid");
    assert.strictEqual(data.providerPaymentId, "pay_123");
  });

  it("returns 400 for a missing signature", async () => {
    api = await createHttpTestApi({ provider: createFakePaymentProvider(), orderClient: createFakeOrderClient().client });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: {
        razorpay_order_id: "rzp_order-1",
        razorpay_payment_id: "pay_123",
      },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((response.body as Record<string, unknown>).message, "Validation failed");
  });

  it("returns 404 for an unknown payment", async () => {
    api = await createHttpTestApi({ provider: createFakePaymentProvider(), orderClient: createFakeOrderClient().client });
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/missing/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 404);
  });

  it("returns 403 for another customer's payment", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ customerId: "customer-2" }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-2",
        amount: new Decimal("10.00"),
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 403);
  });

  it("returns 400 when provider verification is invalid and marks the payment failed", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    const provider = createFakePaymentProvider();
    provider.setVerifyResult({ valid: false });
    api = await createHttpTestApi({ provider, orderClient: orderClient.client });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 400);
    const fetched = api.handle.getPayments().find((p) => p.id === "payment-1")!;
    assert.strictEqual(fetched.status, "failed");
  });

  it("returns 409 when the payment is already paid", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "online",
        status: "paid",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 409);
    assert.strictEqual((response.body as Record<string, unknown>).message, "Payment is already paid");
  });

  it("returns 400 when the payment is COD", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "cod",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      (response.body as Record<string, unknown>).message,
      "Only online payments can be verified",
    );
  });

  it("returns 400 when no provider is configured", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("10.00") }));
    api = await createHttpTestApi({ orderClient: orderClient.client });
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
        method: "online",
        provider: "razorpay",
        providerReference: "rzp_order-1",
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1/verify", {
      method: "POST",
      token,
      body: verifyBody,
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      (response.body as Record<string, unknown>).message,
      "Payment provider is not configured",
    );
  });

  it("forwards the create order amount when orderClient is configured", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("29.14") }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 29.14, method: "online" },
    });

    assert.strictEqual(response.status, 201);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.method, "online");
    assert.strictEqual(orderClient.getFetchCalls().length, 1);
    assert.strictEqual(orderClient.getFetchCalls()[0]?.authToken, token);
  });

  it("rejects create when the amount does not match the order total", async () => {
    const orderClient = createFakeOrderClient();
    orderClient.setOrder(makeOrderTotal({ totalAmount: new Decimal("50.00") }));
    api = await createHttpTestApi({
      provider: createFakePaymentProvider(),
      orderClient: orderClient.client,
    });
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 10, method: "online" },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      (response.body as Record<string, unknown>).message,
      "Payment amount does not match order total",
    );
  });
});