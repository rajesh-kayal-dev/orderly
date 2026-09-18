import { describe, it } from "node:test";
import assert from "node:assert";
import { createEnvelope, encodeEnvelope, EventTypes, ServiceName, type EventEnvelope } from "@orderly/contracts";
import { createEventConsumer, dispatchKafkaMessage } from "../src/index.js";

const value = (envelope: EventEnvelope) => ({ key: Buffer.from("key-1"), value: encodeEnvelope(envelope) });

describe("dispatchKafkaMessage", () => {
  it("routes to the handler for the envelope type with a decoded payload", async () => {
    const envelope = createEnvelope(EventTypes.OrderPlaced, {
      orderId: "ord_1",
      customerId: "cus_1",
      restaurantId: "res_1",
      subtotal: "100.00",
      deliveryFee: "10.00",
      totalAmount: "110.00",
      currency: "INR",
      paymentMethod: "online",
      paymentStatus: "pending",
      createdAt: "2026-09-18T00:00:00.000Z",
    }, { source: ServiceName.Order });

    const events: string[] = [];
    await dispatchKafkaMessage(
      {
        [EventTypes.OrderPlaced]: async (envelope, context) => {
          events.push(`${envelope.payload.orderId}:${envelope.payload.restaurantId}:${context.topic}:${context.key}`);
        },
      },
      value(envelope),
      { topic: "orderly.order.placed", partition: 0, offset: "42", timestamp: "1726000000000" },
    );
    assert.deepStrictEqual(events, ["ord_1:res_1:orderly.order.placed:key-1"]);
  });

  it("ignores messages for event types with no handler", async () => {
    const envelope = createEnvelope(EventTypes.DeliveryAssigned, {
      deliveryId: "del_1",
      orderId: "ord_1",
      partnerId: "par_1",
      assignedAt: "2026-09-18T00:00:00.000Z",
    }, { source: ServiceName.Delivery });

    let calls = 0;
    await dispatchKafkaMessage(
      { [EventTypes.OrderPlaced]: async () => { calls += 1; } },
      value(envelope),
      { topic: "orderly.delivery.assigned", partition: 0, offset: "7", timestamp: "1726000000000" },
    );
    assert.strictEqual(calls, 0);
  });

  it("reports undecodable values through onError", async () => {
    let error: Error | undefined;
    await dispatchKafkaMessage(
      {},
      { key: null, value: Buffer.from("not-json") },
      { topic: "orderly.order.placed", partition: 1, offset: "9", timestamp: "1726000000000" },
      (caught) => { error = caught as Error; },
    );
    assert.ok(error instanceof Error);
    assert.match(error.message, /decode/i);
  });

  it("reports handler failures through onError with context", async () => {
    const envelope = createEnvelope(EventTypes.PaymentSucceeded, {
      paymentId: "pay_1",
      orderId: "ord_1",
      amount: "1100.00",
      currency: "INR",
      provider: "razorpay",
      paidAt: "2026-09-18T00:00:00.000Z",
    }, { source: ServiceName.Payment });

    let seen: { error: Error; offset: string } | undefined;
    await dispatchKafkaMessage(
      {
        [EventTypes.PaymentSucceeded]: async () => {
          throw new Error("handler boom");
        },
      },
      value(envelope),
      { topic: "orderly.payment.succeeded", partition: 2, offset: "13", timestamp: "1726000000000" },
      (caught, context) => { seen = { error: caught as Error, offset: context.offset }; },
    );
    assert.ok(seen);
    assert.match(seen.error.message, /handler boom/);
    assert.strictEqual(seen.offset, "13");
  });
});

describe("createEventConsumer", () => {
  it("connects before subscribing and waits for group assignment", async () => {
    const calls: string[] = [];
    let groupJoin: (() => void) | undefined;
    const consumer = {
      events: { GROUP_JOIN: "consumer.group_join" },
      async connect() { calls.push("connect"); },
      async subscribe() { calls.push("subscribe"); },
      async run() {
        calls.push("run");
        groupJoin?.();
      },
      async disconnect() { calls.push("disconnect"); },
      on(_eventName: string, listener: () => void) {
        groupJoin = listener;
        return () => { groupJoin = undefined; };
      },
    };
    const kafka = { consumer: () => consumer };
    const eventConsumer = createEventConsumer(kafka as never);

    await eventConsumer.connect({
      groupId: "orderly.test.assignment",
      handlers: { [EventTypes.OrderPlaced]: async () => undefined },
    });

    assert.deepStrictEqual(calls, ["connect", "subscribe", "run"]);
    await eventConsumer.disconnect();
    assert.deepStrictEqual(calls, ["connect", "subscribe", "run", "disconnect"]);
  });
});
