import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotificationEventHandler } from "../src/application/events/notification-event.handler.js";
import { createFakeNotificationRepository } from "./helpers/fake-notification.repository.js";
import { EventEnvelope } from "@orderly/contracts";

function createTestEnvelope<T>(
  type: string,
  payload: T,
  overrides: Partial<EventEnvelope<T>> = {}
): EventEnvelope<T> {
  return {
    id: overrides.id ?? `evt-${Math.random().toString(36).substring(2, 9)}`,
    type: type as any,
    version: overrides.version ?? 1,
    occurredAt: overrides.occurredAt ?? new Date().toISOString(),
    source: (overrides.source ?? "order") as any,
    payload,
  };
}

describe("Notification Service Kafka Consumer & Event Handler", () => {
  it("processes order.placed event and creates notification with correct details", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    const envelope = createTestEnvelope("order.placed", {
      orderId: "order-101",
      customerId: "user-customer-1",
      restaurantId: "rest-1",
      subtotal: "20.00",
      deliveryFee: "5.00",
      totalAmount: "25.00",
      currency: "USD",
      paymentMethod: "card",
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
    });

    const result = await handler.handleEvent(envelope);

    assert.ok(result);
    assert.equal(result.userId, "user-customer-1");
    assert.equal(result.channel, "in_app");
    assert.equal(result.title, "Order Placed");
    assert.equal(result.body, "Order #order-101 placed for USD 25.00.");
    assert.equal(result.metadata?.eventId, envelope.id);
    assert.equal(result.metadata?.orderId, "order-101");

    const saved = handle.getNotifications();
    assert.equal(saved.length, 1);
  });

  it("processes payment.created event without leaking sensitive data", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    const envelope = createTestEnvelope("payment.created", {
      paymentId: "pay-202",
      orderId: "order-101",
      customerId: "user-customer-1",
      amount: "25.00",
      currency: "USD",
      method: "CARD",
    });

    const result = await handler.handleEvent(envelope);

    assert.ok(result);
    assert.equal(result.userId, "user-customer-1");
    assert.equal(result.title, "Payment Pending");
    assert.equal(result.body, "Payment of USD 25.00 created for order #order-101.");
    assert.equal(result.metadata?.eventId, envelope.id);
    assert.equal(result.metadata?.paymentId, "pay-202");
    assert.equal(result.metadata?.orderId, "order-101");
    // Ensure sensitive card data/tokens are not present
    assert.equal(result.metadata?.cardNumber, undefined);
    assert.equal(result.metadata?.cvv, undefined);
  });

  it("processes delivery.assigned event and notifies courier", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    const envelope = createTestEnvelope("delivery.assigned", {
      deliveryId: "deliv-303",
      orderId: "order-101",
      partnerId: "courier-777",
      assignedAt: new Date().toISOString(),
    });

    const result = await handler.handleEvent(envelope);

    assert.ok(result);
    assert.equal(result.userId, "courier-777");
    assert.equal(result.title, "Delivery Assigned");
    assert.equal(result.body, "Delivery #deliv-303 for order #order-101 has been assigned to you.");
    assert.equal(result.metadata?.deliveryId, "deliv-303");
  });

  it("handles duplicate event delivery idempotently", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    const envelope = createTestEnvelope("order.placed", {
      orderId: "order-101",
      customerId: "user-customer-1",
      restaurantId: "rest-1",
      subtotal: "10.00",
      deliveryFee: "2.00",
      totalAmount: "12.00",
      currency: "USD",
      paymentMethod: "card",
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
    }, { id: "fixed-event-id-999" });

    // First processing
    const firstResult = await handler.handleEvent(envelope);
    assert.ok(firstResult);
    assert.equal(handle.getNotifications().length, 1);

    // Second processing with same eventId
    const secondResult = await handler.handleEvent(envelope);
    assert.ok(secondResult);
    assert.equal(secondResult.id, firstResult.id);
    assert.equal(handle.getNotifications().length, 1);
  });

  it("safely skips unsupported event types", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    const envelope = createTestEnvelope("unknown.event.type", { foo: "bar" });

    const result = await handler.handleEvent(envelope);
    assert.equal(result, null);
    assert.equal(handle.getNotifications().length, 0);
  });

  it("safely handles malformed envelope or invalid JSON object", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    // Missing id/type
    const malformed = { data: {} } as any;

    const result = await handler.handleEvent(malformed);
    assert.equal(result, null);
    assert.equal(handle.getNotifications().length, 0);
  });

  it("safely skips events where payload lacks recipient information", async () => {
    const handle = createFakeNotificationRepository();
    const handler = new NotificationEventHandler(handle.repo);

    // order.accepted has no customerId or userId in standard contract
    const envelope = createTestEnvelope("order.accepted", {
      orderId: "order-101",
      acceptedAt: new Date().toISOString(),
    });

    const result = await handler.handleEvent(envelope);
    assert.equal(result, null);
    assert.equal(handle.getNotifications().length, 0);
  });
});
