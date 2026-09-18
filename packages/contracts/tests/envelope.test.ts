import { describe, it } from "node:test";
import assert from "node:assert";
import {
  ENVELOPE_VERSION,
  EventTypes,
  ServiceName,
  createEnvelope,
  decodeEnvelope,
  encodeEnvelope,
  isEnvelope,
  isServiceName,
} from "../src/index.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("createEnvelope", () => {
  it("fills defaults for id, version, occurredAt and preserves source and payload", () => {
    const createdAt = "2026-09-18T10:00:00.000Z";
    const envelope = createEnvelope(EventTypes.OrderPlaced, {
      orderId: "order-1",
      customerId: "customer-1",
      restaurantId: "restaurant-1",
      subtotal: "25.00",
      deliveryFee: "5.00",
      totalAmount: "30.00",
      currency: "INR",
      paymentMethod: "cod",
      paymentStatus: "pending",
      createdAt,
    }, { source: ServiceName.Order });

    assert.match(envelope.id, UUID_RE);
    assert.strictEqual(envelope.type, EventTypes.OrderPlaced);
    assert.strictEqual(envelope.version, ENVELOPE_VERSION);
    assert.ok(!Number.isNaN(Date.parse(envelope.occurredAt)));
    assert.strictEqual(envelope.source, ServiceName.Order);
    assert.deepStrictEqual(envelope.payload, {
      orderId: "order-1",
      customerId: "customer-1",
      restaurantId: "restaurant-1",
      subtotal: "25.00",
      deliveryFee: "5.00",
      totalAmount: "30.00",
      currency: "INR",
      paymentMethod: "cod",
      paymentStatus: "pending",
      createdAt,
    });
  });

  it("honours explicit id, occurredAt and version", () => {
    const envelope = createEnvelope(EventTypes.DeliveryDelivered, {
      deliveryId: "delivery-1",
      orderId: "order-1",
      deliveredAt: "2026-09-18T10:05:00.000Z",
    }, {
      source: ServiceName.Delivery,
      id: "fixed-id",
      occurredAt: "2026-09-18T10:05:00.000Z",
      version: 2,
    });

    assert.strictEqual(envelope.id, "fixed-id");
    assert.strictEqual(envelope.occurredAt, "2026-09-18T10:05:00.000Z");
    assert.strictEqual(envelope.version, 2);
  });
});

describe("encodeEnvelope / decodeEnvelope", () => {
  const payload = { orderId: "order-1" };

  it("round-trips an envelope through a buffer", () => {
    const envelope = createEnvelope(EventTypes.OrderReady, payload, { source: ServiceName.Order });
    const encoded = encodeEnvelope(envelope);
    assert.ok(Buffer.isBuffer(encoded));
    const decoded = decodeEnvelope(encoded);
    assert.notStrictEqual(decoded, null);
    assert.deepStrictEqual(decoded, envelope);
  });

  it("returns null for empty, null or undefined input", () => {
    assert.strictEqual(decodeEnvelope(null), null);
    assert.strictEqual(decodeEnvelope(undefined), null);
    assert.strictEqual(decodeEnvelope(Buffer.alloc(0)), null);
  });

  it("returns null for invalid JSON", () => {
    assert.strictEqual(decodeEnvelope(Buffer.from("not-json", "utf8")), null);
  });

  it("returns null when required envelope fields are missing", () => {
    const missingFields = Buffer.from(JSON.stringify({ type: EventTypes.OrderReady, payload }), "utf8");
    assert.strictEqual(decodeEnvelope(missingFields), null);
  });

  it("returns null when type is not a registered event", () => {
    const unknown = Buffer.from(
      JSON.stringify({
        id: "e1",
        type: "order.teleported",
        version: 1,
        occurredAt: "2026-09-18T10:00:00.000Z",
        source: ServiceName.Order,
        payload,
      }),
      "utf8",
    );
    assert.strictEqual(decodeEnvelope(unknown), null);
  });
});

describe("isEnvelope / isServiceName", () => {
  it("validates a well-formed envelope", () => {
    const envelope = createEnvelope(EventTypes.PaymentSucceeded, {
      paymentId: "payment-1",
      orderId: "order-1",
      amount: "30.00",
      currency: "INR",
      provider: null,
      paidAt: "2026-09-18T10:01:00.000Z",
    }, { source: ServiceName.Payment });
    assert.strictEqual(isEnvelope(envelope), true);
  });

  it("rejects non-objects", () => {
    assert.strictEqual(isEnvelope("order.placed"), false);
    assert.strictEqual(isEnvelope(null), false);
  });

  it("accepts only known service names", () => {
    assert.strictEqual(isServiceName(ServiceName.Order), true);
    assert.strictEqual(isServiceName("orderly"), false);
    assert.strictEqual(isServiceName(123), false);
  });
});