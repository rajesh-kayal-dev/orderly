import { after, before, describe, it } from "node:test";
import { EventTypes, ServiceName } from "@orderly/contracts";
import { createEventConsumer, createKafka, createProducer, defineEventsConfig, ensureTopics } from "../src/index.js";

const brokers = process.env.KAFKA_BROKERS;

const skipped = brokers === undefined || brokers.trim() === "";

describe("Kafka smoke test", { skip: skipped }, () => {
  const config = defineEventsConfig(brokers !== undefined ? { brokers: [brokers] } : {});
  const kafka = createKafka(config);
  const producer = createProducer(kafka, ServiceName.Order);

  before(async () => {
    await ensureTopics(kafka);
    await producer.connect();
  });

  after(async () => {
    await producer.disconnect();
  });

  it("produce/consume round-trip through a real broker", { timeout: 30000 }, async () => {
    const marker = `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const consumer = createEventConsumer(kafka);

    let resolveEvent: (() => void) | undefined;
    const gotEvent = new Promise<void>((resolve) => {
      resolveEvent = resolve;
    });

    try {
      await consumer.connect({
        groupId: `orderly.test.smoke-${Date.now()}`,
        fromBeginning: true,
        handlers: {
          [EventTypes.OrderPlaced]: async (envelope) => {
            if (envelope.payload.orderId === marker) {
              resolveEvent?.();
            }
          },
        },
      });

      await producer.publish(EventTypes.OrderPlaced, {
        orderId: marker,
        customerId: "cus_smoke",
        restaurantId: "res_smoke",
        subtotal: "500.00",
        deliveryFee: "0.00",
        totalAmount: "500.00",
        currency: "INR",
        paymentMethod: "cod",
        paymentStatus: "pending",
        createdAt: new Date().toISOString(),
      });

      await gotEvent;
    } finally {
      await consumer.disconnect().catch(() => undefined);
    }
  });
});
