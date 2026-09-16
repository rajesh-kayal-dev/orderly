import { describe, it, after, afterEach } from "node:test";
import assert from "node:assert";
import { Decimal } from "decimal.js";
import {
  createHttpTestApi,
  request,
  type HttpTestApi,
} from "./helpers/http-api.js";
import { createFakePaymentProvider } from "./helpers/fake-payment.provider.js";
import { makePayment } from "./helpers/fake-payment.repository.js";

describe("payment HTTP API", () => {
  let api: HttpTestApi | undefined;

  afterEach(async () => {
    await api?.close();
    api = undefined;
  });

  after(async () => {
    await api?.close();
  });

  it("requires authentication to create a payment", async () => {
    api = await createHttpTestApi();

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      body: { orderId: "order-1", amount: 10 },
    });

    assert.strictEqual(response.status, 401);
  });

  it("creates a COD payment for the authenticated customer", async () => {
    api = await createHttpTestApi();
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 29.14 },
    });

    assert.strictEqual(response.status, 201);
    assert.deepStrictEqual(response.body!.success, true);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.amount, "29.14");
    assert.strictEqual(data.currency, "INR");
    assert.strictEqual(data.method, "cod");
    assert.strictEqual(data.status, "pending");
    assert.strictEqual(data.customerId, "customer-1");
    assert.strictEqual(data.provider, null);
  });

  it("creates an online payment when a provider is configured", async () => {
    api = await createHttpTestApi({ provider: createFakePaymentProvider() });
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 29.14, method: "online" },
    });

    assert.strictEqual(response.status, 201);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.method, "online");
    assert.strictEqual(data.provider, "razorpay");
    assert.strictEqual(data.providerReference, "rzp_order-1");
  });

  it("rejects online payment when no provider is configured", async () => {
    api = await createHttpTestApi();
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 29.14, method: "online" },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      (response.body as Record<string, unknown>).message,
      "Payment provider is not configured",
    );
  });

  it("rejects a non-positive amount", async () => {
    api = await createHttpTestApi();
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments", {
      method: "POST",
      token,
      body: { orderId: "order-1", amount: 0 },
    });

    assert.strictEqual(response.status, 400);
    assert.strictEqual((response.body as Record<string, unknown>).message, "Validation failed");
  });

  it("requires authentication to read a payment", async () => {
    api = await createHttpTestApi();

    const response = await request(api.baseUrl, "/payments/payment-1");

    assert.strictEqual(response.status, 401);
  });

  it("returns a payment by id for the owning customer", async () => {
    api = await createHttpTestApi();
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/payment-1", { token });

    assert.strictEqual(response.status, 200);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.id, "payment-1");
  });

  it("returns 404 for an unknown payment", async () => {
    api = await createHttpTestApi();
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/missing", { token });

    assert.strictEqual(response.status, 404);
  });

  it("returns 403 for another customer's payment", async () => {
    api = await createHttpTestApi();
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
      }),
    );
    const token = api.issueToken("customer-2");

    const response = await request(api.baseUrl, "/payments/payment-1", { token });

    assert.strictEqual(response.status, 403);
  });

  it("returns a payment by order id for the owning customer", async () => {
    api = await createHttpTestApi();
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
      }),
    );
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/order/order-1", { token });

    assert.strictEqual(response.status, 200);
    const data = response.body!.data as Record<string, unknown>;
    assert.strictEqual(data.orderId, "order-1");
  });

  it("returns 403 for another customer's order payment", async () => {
    api = await createHttpTestApi();
    api.handle.seedPayment(
      makePayment("payment-1", {
        orderId: "order-1",
        customerId: "customer-1",
        amount: new Decimal("10.00"),
      }),
    );
    const token = api.issueToken("customer-2");

    const response = await request(api.baseUrl, "/payments/order/order-1", { token });

    assert.strictEqual(response.status, 403);
  });

  it("returns 404 when the order has no payment", async () => {
    api = await createHttpTestApi();
    const token = api.issueToken("customer-1");

    const response = await request(api.baseUrl, "/payments/order/order-missing", { token });

    assert.strictEqual(response.status, 404);
  });
});