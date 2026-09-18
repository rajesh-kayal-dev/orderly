import assert from "node:assert";
import { describe, it } from "node:test";
import { EventTypes, topicOf, type EventEnvelope, type EventType, type PayloadOf } from "@orderly/contracts";
import type { OrderlyProducer, PublishOptions } from "@orderly/events";
import { Decimal } from "decimal.js";
import { createOrder } from "../src/application/order/create-order.js";
import type { OrderEventPublisher } from "../src/application/order/order-event.publisher.js";
import { acceptOrder } from "../src/application/order/restaurant-order-actions.js";
import type { OrderRepository } from "../src/domain/order/order.repository.js";
import type { Order, OrderStatus } from "../src/domain/order/order.types.js";
import { KafkaOrderEventPublisher } from "../src/infrastructure/events/kafka-order-event.publisher.js";
import { makeCart, makeCartItem, makeMenuItem, makeOrder, makeRestaurant, createFakeRepositories } from "./helpers/fake-repositories.js";

class RecordingOrderEventPublisher implements OrderEventPublisher {
  readonly placed: Order[] = [];
  readonly statusChanges: Array<{ order: Order; previousStatus: OrderStatus }> = [];

  async publishOrderPlaced(order: Order): Promise<void> {
    this.placed.push(order);
  }

  async publishOrderStatusChanged(order: Order, previousStatus: OrderStatus): Promise<void> {
    this.statusChanges.push({ order, previousStatus });
  }
}

function seedOrderCart(): ReturnType<typeof createFakeRepositories> {
  const repositories = createFakeRepositories();
  repositories.seedRestaurant(makeRestaurant("rest-events"));
  repositories.seedMenuItem(makeMenuItem("item-events", { restaurantId: "rest-events", price: new Decimal("12.50") }));
  const cart = makeCart("cart-events", "customer-events", "rest-events", []);
  repositories.seedCart(cart);
  repositories.seedCartItem(makeCartItem("cart-item-events", cart.id, "item-events", 2));
  return repositories;
}

describe("Order lifecycle publishing", () => {
  it("publishes order.placed only after successful order creation", async () => {
    const repositories = seedOrderCart();
    const publisher = new RecordingOrderEventPublisher();

    const order = await createOrder(
      repositories.cartRepo,
      repositories.orderRepo,
      repositories.catalogClient,
      publisher,
    )("customer-events", { deliveryFee: 2.5 });

    assert.strictEqual(publisher.placed.length, 1);
    assert.strictEqual(publisher.placed[0]?.id, order.id);
    assert.strictEqual(publisher.placed[0]?.totalAmount.toFixed(2), "27.50");
  });

  it("does not publish order.placed when persistence fails", async () => {
    const repositories = seedOrderCart();
    const publisher = new RecordingOrderEventPublisher();
    const failingOrders: OrderRepository = {
      ...repositories.orderRepo,
      async createOrder() {
        throw new Error("database unavailable");
      },
    };

    await assert.rejects(
      createOrder(repositories.cartRepo, failingOrders, repositories.catalogClient, publisher)("customer-events", {}),
      /database unavailable/,
    );
    assert.strictEqual(publisher.placed.length, 0);
  });

  it("publishes a status event after a successful transition", async () => {
    const repositories = createFakeRepositories();
    const publisher = new RecordingOrderEventPublisher();
    repositories.seedRestaurantOwnership("owner-events", "rest-events");
    repositories.seedOrder(makeOrder("order-events", { restaurantId: "rest-events", status: "placed" }));

    const order = await acceptOrder({
      orderRepository: repositories.orderRepo,
      restaurantOwnershipClient: repositories.restaurantOwnershipClient,
      eventPublisher: publisher,
    })("owner-events", "access-token", "order-events");

    assert.strictEqual(order.status, "accepted");
    assert.deepStrictEqual(publisher.statusChanges.map((change) => ({
      id: change.order.id,
      previousStatus: change.previousStatus,
      status: change.order.status,
    })), [{ id: "order-events", previousStatus: "placed", status: "accepted" }]);
  });

  it("does not publish a status event when the transition is rejected", async () => {
    const repositories = createFakeRepositories();
    const publisher = new RecordingOrderEventPublisher();
    repositories.seedRestaurantOwnership("owner-events", "rest-events");
    repositories.seedOrder(makeOrder("order-events-invalid", { restaurantId: "rest-events", status: "preparing" }));

    await assert.rejects(
      acceptOrder({
        orderRepository: repositories.orderRepo,
        restaurantOwnershipClient: repositories.restaurantOwnershipClient,
        eventPublisher: publisher,
      })("owner-events", "access-token", "order-events-invalid"),
      /Cannot change order status/,
    );
    assert.strictEqual(publisher.statusChanges.length, 0);
  });
});

describe("KafkaOrderEventPublisher", () => {
  it("uses Event Backbone event types, payloads, keys, and topics", async () => {
    const messages: Array<{ type: EventType; payload: unknown; options: PublishOptions | undefined }> = [];
    const producer: OrderlyProducer = {
      async connect() {},
      async disconnect() {},
      async publish<K extends EventType>(type: K, payload: PayloadOf<K>, options?: PublishOptions) {
        messages.push({ type, payload, options });
      },
      async send(_envelope: EventEnvelope, _options?: PublishOptions) {},
    };
    const publisher = new KafkaOrderEventPublisher(producer);
    const createdAt = new Date("2026-09-18T10:00:00.000Z");
    const updatedAt = new Date("2026-09-18T10:01:00.000Z");
    const order = makeOrder("order-envelope", {
      customerId: "customer-envelope",
      restaurantId: "restaurant-envelope",
      subtotal: new Decimal("20.00"),
      deliveryFee: new Decimal("2.50"),
      totalAmount: new Decimal("22.50"),
      createdAt,
      updatedAt,
      status: "accepted",
    });

    await publisher.publishOrderPlaced(order);
    await publisher.publishOrderStatusChanged(order, "placed");

    assert.deepStrictEqual(messages, [
      {
        type: EventTypes.OrderPlaced,
        payload: {
          orderId: "order-envelope",
          customerId: "customer-envelope",
          restaurantId: "restaurant-envelope",
          subtotal: "20.00",
          deliveryFee: "2.50",
          totalAmount: "22.50",
          currency: "INR",
          paymentMethod: "cod",
          paymentStatus: "pending",
          createdAt: createdAt.toISOString(),
        },
        options: { key: "order-envelope" },
      },
      {
        type: EventTypes.OrderAccepted,
        payload: {
          orderId: "order-envelope",
          restaurantId: "restaurant-envelope",
          acceptedAt: updatedAt.toISOString(),
        },
        options: { key: "order-envelope" },
      },
    ]);
    assert.deepStrictEqual(messages.map((message) => topicOf(message.type)), [
      "orderly.order.placed",
      "orderly.order.accepted",
    ]);
  });
});
