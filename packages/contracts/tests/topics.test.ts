import { describe, it } from "node:test";
import assert from "node:assert";
import {
  EVENT_TYPES,
  EventTypes,
  ServiceName,
  TOPIC_PREFIX,
  consumerGroupId,
  eventTypeFromTopic,
  isEventType,
  listTopicNames,
  topicCatalog,
  topicOf,
} from "../src/index.js";

describe("topicOf", () => {
  it("builds `<prefix>.<event>` for every event type", () => {
    for (const event of EVENT_TYPES) {
      assert.strictEqual(topicOf(event), `${TOPIC_PREFIX}.${event}`);
    }
  });

  it("uses snake_case enum values for event names", () => {
    assert.strictEqual(EventTypes.OrderPickedUp, "order.picked_up");
    assert.strictEqual(EventTypes.DeliveryInTransit, "delivery.in_transit");
  });
});

describe("topicCatalog / listTopicNames", () => {
  it("covers every event type and produces unique topics", () => {
    const topics = new Set<string>();
    for (const event of EVENT_TYPES) {
      const topic = topicCatalog[event];
      assert.strictEqual(topic, topicOf(event));
      assert.strictEqual(topics.has(topic), false, `duplicate topic ${topic}`);
      topics.add(topic);
    }
    assert.strictEqual(listTopicNames().length, EVENT_TYPES.length);
  });

  it("prefixes every topic with the document-hop prefix", () => {
    for (const topic of listTopicNames()) {
      assert.ok(topic.startsWith(`${TOPIC_PREFIX}.`));
    }
  });
});

describe("eventTypeFromTopic", () => {
  it("round-trips through topicOf", () => {
    for (const event of EVENT_TYPES) {
      assert.strictEqual(eventTypeFromTopic(topicOf(event)), event);
    }
  });

  it("returns null for topics without the orderly prefix", () => {
    assert.strictEqual(eventTypeFromTopic("order.placed"), null);
    assert.strictEqual(eventTypeFromTopic("other.order.placed"), null);
  });

  it("returns null for unknown event names", () => {
    assert.strictEqual(eventTypeFromTopic(`${TOPIC_PREFIX}.order.teleported`), null);
  });
});

describe("isEventType", () => {
  it("accepts registered events and rejects everything else", () => {
    assert.strictEqual(isEventType(EventTypes.OrderPlaced), true);
    assert.strictEqual(isEventType("order.placed"), true);
    assert.strictEqual(isEventType("order.teleported"), false);
    assert.strictEqual(isEventType(""), false);
  });
});

describe("consumerGroupId", () => {
  it("builds `<prefix>.<service>.<purpose>`", () => {
    assert.strictEqual(consumerGroupId(ServiceName.Payment, "order-lifecycle"), "orderly.payment.order-lifecycle");
  });

  it("rejects an empty purpose", () => {
    assert.throws(() => consumerGroupId(ServiceName.Order, ""));
  });
});