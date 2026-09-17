import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createNotification } from "../src/application/notification/create-notification.js";
import { getMyNotification, getNotification } from "../src/application/notification/get-notification.js";
import { listMyNotifications } from "../src/application/notification/list-my-notifications.js";
import { readAllNotifications } from "../src/application/notification/read-all-notifications.js";
import { readNotification } from "../src/application/notification/read-notification.js";
import { sendNotification } from "../src/application/notification/send-notification.js";
import {
  NotificationAlreadySentError,
  NotificationNotFoundError,
  NotificationNotOwnedError,
} from "../src/application/notification/errors.js";
import {
  createFakeNotificationProvider,
  createFakeNotificationRepository,
  makeNotification,
} from "./helpers/fake-notification.repository.js";

describe("notification use cases", () => {
  it("createNotification passes data through to the repository", async () => {
    const handle = createFakeNotificationRepository();
    const result = await createNotification(handle.repo)({
      userId: "user-1",
      channel: "email",
      recipient: "a@b.com",
      title: "Welcome",
      body: "Hello",
      metadata: { orderId: "o-1" },
    });

    assert.equal(result.userId, "user-1");
    assert.equal(result.channel, "email");
    assert.equal(result.status, "pending");
    assert.equal(handle.getNotifications().length, 1);
  });

  it("getNotification returns the notification when found", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-1", title: "Hi" }));

    const result = await getNotification(handle.repo)("n-1");
    assert.equal(result.id, "n-1");
  });

  it("getNotification throws NotificationNotFoundError when missing", async () => {
    const handle = createFakeNotificationRepository();

    await assert.rejects(() => getNotification(handle.repo)("nope"), NotificationNotFoundError);
  });

  it("getMyNotification enforces ownership", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-owner" }));

    const owned = await getMyNotification(handle.repo)("user-1", "n-owner");
    assert.equal(owned.id, "n-owner");

    await assert.rejects(
      () => getMyNotification(handle.repo)("user-2", "n-owner"),
      NotificationNotOwnedError,
    );
    await assert.rejects(
      () => getMyNotification(handle.repo)("user-1", "nope"),
      NotificationNotFoundError,
    );
  });

  it("listMyNotifications filters by status", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-p", status: "pending" }));
    handle.seedNotification(makeNotification("user-1", { id: "n-s", status: "sent" }));
    handle.seedNotification(makeNotification("user-2", { id: "n-other", status: "sent" }));

    const all = await listMyNotifications(handle.repo)("user-1");
    assert.deepEqual(
      all.map((n) => n.id).sort(),
      ["n-p", "n-s"],
    );

    const sent = await listMyNotifications(handle.repo)("user-1", "sent");
    assert.deepEqual(
      sent.map((n) => n.id),
      ["n-s"],
    );
  });

  it("readNotification marks the owner's unread notification read", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-read" }));

    const result = await readNotification(handle.repo)("user-1", "n-read");
    assert.equal(result.id, "n-read");
    assert.notEqual(result.readAt, null);
  });

  it("readNotification throws NotificationNotFoundError for a missing notification", async () => {
    const handle = createFakeNotificationRepository();

    await assert.rejects(
      () => readNotification(handle.repo)("user-1", "nope"),
      NotificationNotFoundError,
    );
  });

  it("readNotification throws NotificationNotOwnedError for another user's notification", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-other" }));

    await assert.rejects(
      () => readNotification(handle.repo)("user-2", "n-other"),
      NotificationNotOwnedError,
    );
  });

  it("readNotification rejects an already-read notification", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-already", readAt: new Date() }));

    await assert.rejects(
      () => readNotification(handle.repo)("user-1", "n-already"),
      NotificationNotOwnedError,
    );
  });

  it("readAllNotifications reports how many were updated", async () => {
    const handle = createFakeNotificationRepository();
    handle.seedNotification(makeNotification("user-1", { id: "n-1" }));
    handle.seedNotification(makeNotification("user-1", { id: "n-2", readAt: new Date() }));
    handle.seedNotification(makeNotification("user-1", { id: "n-3" }));
    handle.seedNotification(makeNotification("user-2", { id: "n-x" }));

    const result = await readAllNotifications(handle.repo)("user-1");
    assert.deepEqual(result, { updatedCount: 2 });
  });

  it("sendNotification records a sent notification with the provider reference", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();
    handle.seedNotification(
      makeNotification("user-1", { id: "n-send", channel: "email", recipient: "a@b.com" }),
    );

    const result = await sendNotification(handle.repo, provider.provider)("n-send");

    assert.equal(result.status, "sent");
    assert.equal(result.providerReference, "fake-ref");
    assert.notEqual(result.sentAt, null);
    assert.equal(provider.getSentInputs().length, 1);
    assert.equal(provider.getSentInputs()[0]!.userId, "user-1");
    assert.equal(provider.getSentInputs()[0]!.channel, "email");
    assert.equal(provider.getSentInputs()[0]!.recipient, "a@b.com");
  });

  it("sendNotification records a failure when the provider rejects delivery", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();
    provider.setResult({ success: false, failureReason: "SMTP down" });
    handle.seedNotification(makeNotification("user-1", { id: "n-fail" }));

    const result = await sendNotification(handle.repo, provider.provider)("n-fail");

    assert.equal(result.status, "failed");
    assert.equal(result.failureReason, "SMTP down");
    assert.notEqual(result.failedAt, null);
    assert.equal(result.sentAt, null);
  });

  it("sendNotification applies a default failure reason when the provider omits one", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();
    provider.setResult({ success: false });
    handle.seedNotification(makeNotification("user-1", { id: "n-fail-def" }));

    const result = await sendNotification(handle.repo, provider.provider)("n-fail-def");

    assert.equal(result.status, "failed");
    assert.equal(result.failureReason, "Notification provider rejected delivery");
  });

  it("sendNotification throws NotificationNotFoundError for a missing notification", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();

    await assert.rejects(
      () => sendNotification(handle.repo, provider.provider)("nope"),
      NotificationNotFoundError,
    );
  });

  it("sendNotification throws NotificationAlreadySentError for a non-pending notification", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();
    handle.seedNotification(makeNotification("user-1", { id: "n-sent", status: "sent" }));
    handle.seedNotification(makeNotification("user-1", { id: "n-failed", status: "failed" }));

    await assert.rejects(
      () => sendNotification(handle.repo, provider.provider)("n-sent"),
      NotificationAlreadySentError,
    );
    await assert.rejects(
      () => sendNotification(handle.repo, provider.provider)("n-failed"),
      NotificationAlreadySentError,
    );
  });

  it("sendNotification refuses a second send after the first one completes", async () => {
    const handle = createFakeNotificationRepository();
    const provider = createFakeNotificationProvider();
    handle.seedNotification(makeNotification("user-1", { id: "n-twice" }));

    const first = await sendNotification(handle.repo, provider.provider)("n-twice");
    assert.equal(first.status, "sent");

    await assert.rejects(
      () => sendNotification(handle.repo, provider.provider)("n-twice"),
      NotificationAlreadySentError,
    );
  });
});