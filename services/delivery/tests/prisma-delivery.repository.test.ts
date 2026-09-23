import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { DeliveryTransitionTarget } from "../src/domain/delivery/delivery.repository.js";
import { sourcesOfDeliveryTransition } from "../src/domain/delivery/delivery.types.js";
import { PrismaDeliveryPartnerRepository } from "../src/infrastructure/database/repositories/prisma-delivery-partner.repository.js";
import { PrismaDeliveryRepository } from "../src/infrastructure/database/repositories/prisma-delivery.repository.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://orderly:orderly@localhost:5434/orderly_delivery";

function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

describe("prisma delivery repositories (real database)", () => {
  let db: PrismaClient | null = null;
  let deliveries: PrismaDeliveryRepository;
  let partners: PrismaDeliveryPartnerRepository;
  let available = false;
  const createdDeliveryIds: string[] = [];
  const createdPartnerIds: string[] = [];

  before(async () => {
    try {
      const adapter = new PrismaPg({ connectionString });
      db = new PrismaClient({ adapter });
      deliveries = new PrismaDeliveryRepository(db);
      partners = new PrismaDeliveryPartnerRepository(db);
      await db.$queryRaw`SELECT 1`;
      available = true;
    } catch {
      available = false;
    }
  });

  after(async () => {
    if (db && available) {
      try {
        await db.delivery.deleteMany({ where: { id: { in: createdDeliveryIds } } });
        await db.deliveryPartner.deleteMany({ where: { id: { in: createdPartnerIds } } });
      } catch {}
      await db.$disconnect();
    }
  });

  async function createPartner(t: { skip: (message?: string) => void }): Promise<string> {
    const partner = await partners.create({ userId: newId("user") });
    createdPartnerIds.push(partner.id);
    return partner.id;
  }

  async function createDelivery(orderId: string): Promise<string> {
    const delivery = await deliveries.create({ orderId });
    assert.notEqual(delivery, null);
    createdDeliveryIds.push(delivery!.id);
    return delivery!.id;
  }

  function transitionTarget(current: string, target: string): DeliveryTransitionTarget {
    return { fromStatuses: [current], target: target as DeliveryTransitionTarget["target"] };
  }

  it("maps transition sources to the correct targets", (t) => {
    assert.deepEqual(sourcesOfDeliveryTransition("assigned"), ["pending"]);
    assert.deepEqual(sourcesOfDeliveryTransition("picked_up"), ["assigned"]);
    assert.deepEqual(sourcesOfDeliveryTransition("in_transit"), ["picked_up"]);
    assert.deepEqual(sourcesOfDeliveryTransition("delivered"), ["in_transit"]);
    assert.deepEqual(sourcesOfDeliveryTransition("failed"), ["assigned", "picked_up", "in_transit"]);
    assert.deepEqual(sourcesOfDeliveryTransition("pending"), []);
    t.diagnostic("transition direction table verified");
  });

  it("creates a pending delivery and reads it back", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const orderId = newId("order");
    const id = await createDelivery(orderId);

    const byId = await deliveries.findById(id);
    assert.notEqual(byId, null);
    assert.equal(byId!.orderId, orderId);
    assert.equal(byId!.status, "pending");
    assert.equal(byId!.partnerId, null);
    assert.equal(byId!.pickupTime, null);
    assert.equal(byId!.deliveredAt, null);
    assert.equal(byId!.failedAt, null);
    assert.ok(byId!.createdAt instanceof Date);
    assert.ok(byId!.updatedAt instanceof Date);

    const byOrder = await deliveries.findByOrderId(orderId);
    assert.notEqual(byOrder, null);
    assert.equal(byOrder!.id, id);
  });

  it("guards accept: only a pending, unassigned delivery can be claimed", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const partnerId = await createPartner(t);
    const id = await createDelivery(newId("order"));

    const first = await deliveries.accept(id, partnerId);
    assert.notEqual(first, null);
    assert.equal(first!.status, "assigned");
    assert.equal(first!.partnerId, partnerId);

    const second = await deliveries.accept(id, partnerId);
    assert.equal(second, null);
  });

  it("walks the lifecycle and records each timestamp", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const partnerId = await createPartner(t);
    const id = await createDelivery(newId("order"));
    await deliveries.accept(id, partnerId);

    const pickedUp = await deliveries.transition(id, partnerId, transitionTarget("assigned", "picked_up"));
    assert.notEqual(pickedUp, null);
    assert.equal(pickedUp!.status, "picked_up");
    assert.ok(pickedUp!.pickupTime instanceof Date);

    const inTransit = await deliveries.transition(id, partnerId, transitionTarget("picked_up", "in_transit"));
    assert.notEqual(inTransit, null);
    assert.equal(inTransit!.status, "in_transit");
    assert.ok(inTransit!.inTransitAt instanceof Date);

    const delivered = await deliveries.transition(id, partnerId, transitionTarget("in_transit", "delivered"));
    assert.notEqual(delivered, null);
    assert.equal(delivered!.status, "delivered");
    assert.ok(delivered!.deliveredAt instanceof Date);
    assert.ok(delivered!.deliveredAt!.getTime() >= delivered!.updatedAt.getTime() - 60000);
  });

  it("atomically rejects a change when the current state is not a valid source", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const partnerId = await createPartner(t);
    const id = await createDelivery(newId("order"));
    await deliveries.accept(id, partnerId);

    const attempted = await deliveries.transition(id, partnerId, {
      fromStatuses: sourcesOfDeliveryTransition("in_transit"),
      target: "in_transit",
    });
    assert.equal(attempted, null);

    const fresh = await deliveries.findById(id);
    assert.equal(fresh!.status, "assigned");
    assert.equal(fresh!.inTransitAt, null);
  });

  it("rejects a transition from a different partner", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const ownerId = await createPartner(t);
    const strangerId = await createPartner(t);
    const id = await createDelivery(newId("order"));
    await deliveries.accept(id, ownerId);

    const attempted = await deliveries.transition(id, strangerId, transitionTarget("assigned", "picked_up"));
    assert.equal(attempted, null);
  });

  it("serializes concurrent accepts so only one partner wins", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const partnerA = await createPartner(t);
    const partnerB = await createPartner(t);
    const id = await createDelivery(newId("order"));

    const [resultA, resultB] = await Promise.all([
      deliveries.accept(id, partnerA),
      deliveries.accept(id, partnerB),
    ]);

    const winners = [resultA, resultB].filter((r) => r !== null);
    assert.equal(winners.length, 1);

    const fresh = await deliveries.findById(id);
    assert.equal(fresh!.status, "assigned");
    assert.equal(fresh!.partnerId, winners[0]!.partnerId);
  });

  it("serializes concurrent transitions so exactly one write succeeds", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const partnerId = await createPartner(t);
    const id = await createDelivery(newId("order"));
    await deliveries.accept(id, partnerId);

    const [toPickedUp, toFailed] = await Promise.all([
      deliveries.transition(id, partnerId, transitionTarget("assigned", "picked_up")),
      deliveries.transition(id, partnerId, transitionTarget("assigned", "failed")),
    ]);

    const winners = [toPickedUp, toFailed].filter((r) => r !== null);
    assert.equal(winners.length, 1);

    const fresh = await deliveries.findById(id);
    assert.equal(fresh!.status, winners[0]!.status);
  });

  it("creates a partner profile idempotently and flips availability", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const userId = newId("user");
    const first = await partners.create({ userId, vehicleType: "Motorbike", vehicleNumber: "KA-01-AB-1234" });
    const second = await partners.create({ userId, vehicleType: "Hatchback", vehicleNumber: "KA-02-CD-5678" });
    createdPartnerIds.push(first.id);
    createdPartnerIds.push(second.id);

    assert.equal(first.userId, userId);
    assert.equal(second.id, first.id);

    const updated = await partners.setAvailability(first.id, true);
    assert.notEqual(updated, null);
    assert.equal(updated!.isAvailable, true);

    const profile = await partners.findProfileByUserId(userId);
    assert.equal(profile!.isAvailable, true);
  });
});