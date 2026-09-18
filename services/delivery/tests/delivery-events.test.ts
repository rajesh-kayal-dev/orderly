import assert from "node:assert";
import { describe, it } from "node:test";
import {
  EventTypes,
  topicOf,
  type DeliveryAssignedPayload,
  type DeliveryCreatedPayload,
  type DeliveryDeliveredPayload,
  type DeliveryFailedPayload,
  type DeliveryInTransitPayload,
  type DeliveryPickedUpPayload,
  type EventEnvelope,
  type EventType,
  type PayloadOf,
} from "@orderly/contracts";
import type { OrderlyProducer, PublishOptions } from "@orderly/events";
import { acceptDelivery } from "../src/application/delivery/accept-delivery.js";
import { createDelivery } from "../src/application/delivery/create-delivery.js";
import type { DeliveryEventPublisher } from "../src/application/delivery/delivery-event.publisher.js";
import {
  completeDelivery,
  failDelivery,
  pickupDelivery,
  startTransitDelivery,
} from "../src/application/delivery/transition-delivery.js";
import type { DeliveryRepository } from "../src/domain/delivery/delivery.repository.js";
import type { Delivery } from "../src/domain/delivery/delivery.types.js";
import { KafkaDeliveryEventPublisher } from "../src/infrastructure/events/kafka-delivery-event.publisher.js";
import {
  createFakeDeliveryPartnerRepository,
  makeDeliveryPartner,
} from "./helpers/fake-delivery-partner.repository.js";
import {
  createFakeDeliveryRepository,
  makeDelivery,
} from "./helpers/fake-delivery.repository.js";

class RecordingDeliveryEventPublisher implements DeliveryEventPublisher {
  readonly created: Delivery[] = [];
  readonly assigned: Delivery[] = [];
  readonly pickedUp: Delivery[] = [];
  readonly inTransit: Delivery[] = [];
  readonly delivered: Delivery[] = [];
  readonly failed: Array<{ delivery: Delivery; failureReason: string | null }> = [];

  async publishDeliveryCreated(delivery: Delivery): Promise<void> {
    this.created.push(delivery);
  }

  async publishDeliveryAssigned(delivery: Delivery): Promise<void> {
    this.assigned.push(delivery);
  }

  async publishDeliveryPickedUp(delivery: Delivery): Promise<void> {
    this.pickedUp.push(delivery);
  }

  async publishDeliveryInTransit(delivery: Delivery): Promise<void> {
    this.inTransit.push(delivery);
  }

  async publishDeliveryDelivered(delivery: Delivery): Promise<void> {
    this.delivered.push(delivery);
  }

  async publishDeliveryFailed(delivery: Delivery, failureReason?: string | null): Promise<void> {
    this.failed.push({ delivery, failureReason: failureReason ?? null });
  }
}

describe("Delivery lifecycle event publishing", () => {
  it("publishes delivery.created after successful delivery creation", async () => {
    const handle = createFakeDeliveryRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();
    const useCase = createDelivery(handle.repo, eventPublisher);

    const delivery = await useCase("order-101");

    assert.strictEqual(delivery.orderId, "order-101");
    assert.strictEqual(eventPublisher.created.length, 1);
    assert.strictEqual(eventPublisher.created[0]?.id, delivery.id);
    assert.strictEqual(eventPublisher.created[0]?.orderId, "order-101");
    assert.strictEqual(eventPublisher.assigned.length, 0);
  });

  it("does not publish delivery.created when DB persistence fails", async () => {
    const handle = createFakeDeliveryRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();
    const failingRepo: DeliveryRepository = {
      ...handle.repo,
      async create() {
        throw new Error("DB insert error");
      },
    };
    const useCase = createDelivery(failingRepo, eventPublisher);

    await assert.rejects(useCase("order-102"), /DB insert error/);
    assert.strictEqual(eventPublisher.created.length, 0);
  });

  it("publishes delivery.assigned after successful acceptance by available partner", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const delivery = makeDelivery("order-201", { status: "pending", partnerId: null });
    deliveryHandle.seedDelivery(delivery);
    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);

    const useCase = acceptDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const accepted = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(accepted.status, "assigned");
    assert.strictEqual(accepted.partnerId, partner.id);
    assert.strictEqual(eventPublisher.assigned.length, 1);
    assert.strictEqual(eventPublisher.assigned[0]?.id, delivery.id);
    assert.strictEqual(eventPublisher.assigned[0]?.partnerId, partner.id);
  });

  it("does not publish duplicate delivery.assigned on idempotent re-acceptance", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-202", { status: "assigned", partnerId: partner.id });
    deliveryHandle.seedDelivery(delivery);

    const useCase = acceptDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const result = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(result.status, "assigned");
    assert.strictEqual(eventPublisher.assigned.length, 0);
  });

  it("does not publish delivery.assigned if DB accept transition fails or is rejected", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-2", { isAvailable: false });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-203", { status: "pending" });
    deliveryHandle.seedDelivery(delivery);

    const useCase = acceptDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    await assert.rejects(useCase("user-partner-2", delivery.id), /Delivery partner is currently unavailable/);

    assert.strictEqual(eventPublisher.assigned.length, 0);
  });

  it("publishes delivery.picked_up after successful pickup transition", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-301", { status: "assigned", partnerId: partner.id });
    deliveryHandle.seedDelivery(delivery);

    const useCase = pickupDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const updated = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(updated.status, "picked_up");
    assert.strictEqual(eventPublisher.pickedUp.length, 1);
    assert.strictEqual(eventPublisher.pickedUp[0]?.id, delivery.id);
  });

  it("publishes delivery.in_transit after successful startTransit transition", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-401", { status: "picked_up", partnerId: partner.id });
    deliveryHandle.seedDelivery(delivery);

    const useCase = startTransitDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const updated = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(updated.status, "in_transit");
    assert.strictEqual(eventPublisher.inTransit.length, 1);
    assert.strictEqual(eventPublisher.inTransit[0]?.id, delivery.id);
  });

  it("publishes delivery.delivered after successful complete transition", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-501", { status: "in_transit", partnerId: partner.id });
    deliveryHandle.seedDelivery(delivery);

    const useCase = completeDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const updated = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(updated.status, "delivered");
    assert.strictEqual(eventPublisher.delivered.length, 1);
    assert.strictEqual(eventPublisher.delivered[0]?.id, delivery.id);
  });

  it("publishes delivery.failed after successful fail transition", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    partnerHandle.seedProfile(partner);
    const delivery = makeDelivery("order-601", { status: "in_transit", partnerId: partner.id });
    deliveryHandle.seedDelivery(delivery);

    const useCase = failDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    const updated = await useCase("user-partner-1", delivery.id);

    assert.strictEqual(updated.status, "failed");
    assert.strictEqual(eventPublisher.failed.length, 1);
    assert.strictEqual(eventPublisher.failed[0]?.delivery.id, delivery.id);
  });

  it("does not publish events when state transition is rejected due to invalid current status or unowned partner", async () => {
    const deliveryHandle = createFakeDeliveryRepository();
    const partnerHandle = createFakeDeliveryPartnerRepository();
    const eventPublisher = new RecordingDeliveryEventPublisher();

    const partner1 = makeDeliveryPartner("user-partner-1", { isAvailable: true });
    const partner2 = makeDeliveryPartner("user-partner-2", { isAvailable: true });
    partnerHandle.seedProfile(partner1);
    partnerHandle.seedProfile(partner2);

    const delivery = makeDelivery("order-701", { status: "assigned", partnerId: partner1.id });
    deliveryHandle.seedDelivery(delivery);

    // Partner 2 attempts to pick up Partner 1's delivery -> Rejected!
    const useCase = pickupDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    await assert.rejects(useCase("user-partner-2", delivery.id), /not assigned/i);

    assert.strictEqual(eventPublisher.pickedUp.length, 0);

    // Partner 1 attempts invalid transition assigned -> delivered directly -> Rejected!
    const completeUseCase = completeDelivery(deliveryHandle.repo, partnerHandle.repo, eventPublisher);
    await assert.rejects(completeUseCase("user-partner-1", delivery.id), /Cannot change delivery status/i);

    assert.strictEqual(eventPublisher.delivered.length, 0);
  });
});

describe("KafkaDeliveryEventPublisher", () => {
  it("uses Event Backbone event types, payloads, keys, topics, and envelope conventions", async () => {
    const publishedMessages: Array<{
      type: EventType;
      payload: unknown;
      options: PublishOptions | undefined;
    }> = [];

    const fakeProducer: OrderlyProducer = {
      async connect() {},
      async disconnect() {},
      async publish<K extends EventType>(type: K, payload: PayloadOf<K>, options?: PublishOptions) {
        publishedMessages.push({ type, payload, options });
      },
      async send(_envelope: EventEnvelope, _options?: PublishOptions) {},
    };

    const publisher = new KafkaDeliveryEventPublisher(fakeProducer);
    const createdAt = new Date("2026-09-18T10:00:00.000Z");
    const updatedAt = new Date("2026-09-18T10:05:00.000Z");
    const deliveredAt = new Date("2026-09-18T10:30:00.000Z");

    const delivery = makeDelivery("order-backbone-1", {
      id: "del-100",
      partnerId: "partner-100",
      status: "delivered",
      deliveredAt,
      createdAt,
      updatedAt,
    });

    await publisher.publishDeliveryCreated(delivery);
    await publisher.publishDeliveryAssigned(delivery);
    await publisher.publishDeliveryPickedUp(delivery);
    await publisher.publishDeliveryInTransit(delivery);
    await publisher.publishDeliveryDelivered(delivery);

    assert.strictEqual(publishedMessages.length, 5);

    // Check DeliveryCreated
    assert.strictEqual(publishedMessages[0]?.type, EventTypes.DeliveryCreated);
    assert.deepStrictEqual(publishedMessages[0]?.payload as DeliveryCreatedPayload, {
      deliveryId: "del-100",
      orderId: "order-backbone-1",
      createdAt: createdAt.toISOString(),
    });
    assert.deepStrictEqual(publishedMessages[0]?.options, { key: "order-backbone-1" });

    // Check DeliveryAssigned
    assert.strictEqual(publishedMessages[1]?.type, EventTypes.DeliveryAssigned);
    assert.deepStrictEqual(publishedMessages[1]?.payload as DeliveryAssignedPayload, {
      deliveryId: "del-100",
      orderId: "order-backbone-1",
      partnerId: "partner-100",
      assignedAt: updatedAt.toISOString(),
    });

    // Check DeliveryPickedUp
    assert.strictEqual(publishedMessages[2]?.type, EventTypes.DeliveryPickedUp);
    assert.deepStrictEqual(publishedMessages[2]?.payload as DeliveryPickedUpPayload, {
      deliveryId: "del-100",
      orderId: "order-backbone-1",
      partnerId: "partner-100",
    });

    // Check DeliveryInTransit
    assert.strictEqual(publishedMessages[3]?.type, EventTypes.DeliveryInTransit);
    assert.deepStrictEqual(publishedMessages[3]?.payload as DeliveryInTransitPayload, {
      deliveryId: "del-100",
      orderId: "order-backbone-1",
    });

    // Check DeliveryDelivered
    assert.strictEqual(publishedMessages[4]?.type, EventTypes.DeliveryDelivered);
    assert.deepStrictEqual(publishedMessages[4]?.payload as DeliveryDeliveredPayload, {
      deliveryId: "del-100",
      orderId: "order-backbone-1",
      deliveredAt: deliveredAt.toISOString(),
    });

    // Check topics
    assert.deepStrictEqual(publishedMessages.map((m) => topicOf(m.type)), [
      "orderly.delivery.created",
      "orderly.delivery.assigned",
      "orderly.delivery.picked_up",
      "orderly.delivery.in_transit",
      "orderly.delivery.delivered",
    ]);
  });

  it("never includes sensitive information in delivery event payloads", async () => {
    const publishedMessages: Array<{ type: EventType; payload: unknown }> = [];
    const fakeProducer: OrderlyProducer = {
      async connect() {},
      async disconnect() {},
      async publish<K extends EventType>(type: K, payload: PayloadOf<K>) {
        publishedMessages.push({ type, payload });
      },
      async send() {},
    };

    const publisher = new KafkaDeliveryEventPublisher(fakeProducer);
    const delivery = makeDelivery("order-sec", {
      id: "del-sec",
      partnerId: "partner-sec",
    });

    await publisher.publishDeliveryCreated(delivery);
    await publisher.publishDeliveryAssigned(delivery);
    await publisher.publishDeliveryPickedUp(delivery);
    await publisher.publishDeliveryInTransit(delivery);
    await publisher.publishDeliveryDelivered(delivery);

    for (const msg of publishedMessages) {
      const json = JSON.stringify(msg.payload);
      assert.strictEqual(json.includes("password"), false);
      assert.strictEqual(json.includes("token"), false);
      assert.strictEqual(json.includes("secret"), false);
      assert.strictEqual(json.includes("apiKey"), false);
      assert.strictEqual(json.includes("cardNumber"), false);
    }
  });
});
