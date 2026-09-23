import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaNotificationRepository } from "../src/infrastructure/database/repositories/prisma-notification.repository.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://orderly:orderly@localhost:5434/orderly_notification";

function newId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function createdAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60000);
}

describe("prisma notification repository (real database)", () => {
  let db: PrismaClient | null = null;
  let notifications: PrismaNotificationRepository;
  let available = false;
  const createdNotificationIds: string[] = [];

  before(async () => {
    try {
      const adapter = new PrismaPg({ connectionString });
      db = new PrismaClient({ adapter });
      notifications = new PrismaNotificationRepository(db);
      await db.$queryRaw`SELECT 1`;
      available = true;
    } catch {
      available = false;
    }
  });

  after(async () => {
    if (db && available) {
      try {
        await db.notification.deleteMany({ where: { id: { in: createdNotificationIds } } });
      } catch {}
      await db.$disconnect();
    }
  });

  async function createNotification(userId: string, overrides: Record<string, unknown> = {}) {
    const notification = await notifications.create({
      userId,
      channel: "in_app",
      recipient: null,
      title: "Order update",
      body: "Your order is on the way",
      metadata: null,
      ...overrides,
    });
    createdNotificationIds.push(notification.id);
    return notification;
  }

  it("creates a pending notification and reads it back", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const userId = newId("user");
    const notification = await createNotification(userId);

    const byId = await notifications.findById(notification.id);
    assert.notEqual(byId, null);
    assert.equal(byId!.userId, userId);
    assert.equal(byId!.status, "pending");
    assert.equal(byId!.channel, "in_app");
    assert.equal(byId!.recipient, null);
    assert.equal(byId!.metadata, null);
    assert.equal(byId!.providerReference, null);
    assert.equal(byId!.failureReason, null);
    assert.equal(byId!.sentAt, null);
    assert.equal(byId!.failedAt, null);
    assert.equal(byId!.readAt, null);
    assert.ok(byId!.createdAt instanceof Date);
    assert.ok(byId!.updatedAt instanceof Date);
  });

  it("round-trips channel, recipient, and metadata", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const notification = await createNotification(newId("user"), {
      channel: "email",
      recipient: "person@example.com",
      metadata: { orderId: "order-123", at: 42 },
    });

    const byId = await notifications.findById(notification.id);
    assert.notEqual(byId, null);
    assert.equal(byId!.channel, "email");
    assert.equal(byId!.recipient, "person@example.com");
    assert.deepEqual(byId!.metadata, { orderId: "order-123", at: 42 });
  });

  it("lists a user's notifications newest first and filters by status", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const userId = newId("user");
    const newer = await createNotification(userId);
    const older = await createNotification(userId);
    const third = await createNotification(userId);

    await notifications.recordSend(older.id, {
      status: "sent",
      providerReference: "ref-1",
      failureReason: null,
    });

    const all = await notifications.listByUserId(userId);
    assert.deepEqual(
      all.map((n) => n.id).sort(),
      [newer.id, older.id, third.id].sort(),
    );

    const sent = await notifications.listByUserId(userId, { status: "sent" });
    assert.deepEqual(
      sent.map((n) => n.id),
      [older.id],
    );
  });

  it("records a successful send with provider reference and sentAt", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const notification = await createNotification(newId("user"));
    assert.notEqual(notification, null);

    const sent = await notifications.recordSend(notification.id, {
      status: "sent",
      providerReference: "console-abc",
      failureReason: null,
    });

    assert.notEqual(sent, null);
    assert.equal(sent!.status, "sent");
    assert.equal(sent!.providerReference, "console-abc");
    assert.equal(sent!.failureReason, null);
    assert.ok(sent!.sentAt instanceof Date);
    assert.equal(sent!.failedAt, null);
  });

  it("records a failed send with failure reason and failedAt", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const notification = await createNotification(newId("user"));

    const failed = await notifications.recordSend(notification.id, {
      status: "failed",
      providerReference: null,
      failureReason: "Provider downtime",
    });

    assert.notEqual(failed, null);
    assert.equal(failed!.status, "failed");
    assert.equal(failed!.failureReason, "Provider downtime");
    assert.ok(failed!.failedAt instanceof Date);
    assert.equal(failed!.sentAt, null);
  });

  it("refuses a second send on a non-pending notification", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const notification = await createNotification(newId("user"));

    const first = await notifications.recordSend(notification.id, {
      status: "sent",
      providerReference: "ref-1",
      failureReason: null,
    });
    assert.notEqual(first, null);

    const second = await notifications.recordSend(notification.id, {
      status: "sent",
      providerReference: "ref-2",
      failureReason: null,
    });
    assert.equal(second, null);
  });

  it("marks a notification read only for its owner and only once", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const owner = newId("user");
    const notification = await createNotification(owner);

    const read = await notifications.markRead(notification.id, owner);
    assert.notEqual(read, null);
    assert.equal(read!.id, notification.id);
    assert.ok(read!.readAt instanceof Date);

    const again = await notifications.markRead(notification.id, owner);
    assert.equal(again, null);

    const asStranger = await notifications.markRead(notification.id, newId("user"));
    assert.equal(asStranger, null);
  });

  it("marks all unread notifications read for the caller and is idempotent", async (t) => {
    if (!available || !db) {
      return t.skip("prisma database is not reachable");
    }

    const userId = newId("user");
    const otherUser = newId("user");
    await createNotification(userId);
    await createNotification(userId);
    const alreadyRead = await createNotification(userId);
    await notifications.markRead(alreadyRead.id, userId);
    await createNotification(otherUser);

    const first = await notifications.markAllRead(userId);
    assert.equal(first, 2);

    const second = await notifications.markAllRead(userId);
    assert.equal(second, 0);
  });
});