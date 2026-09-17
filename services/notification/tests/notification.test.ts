import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  createNotificationHttpTestApi,
  request,
  type ApiResponse,
} from "./helpers/http-api.js";
import { makeNotification } from "./helpers/fake-notification.repository.js";

const BASE = "/notifications";

describe("notification API", () => {
  let api: Awaited<ReturnType<typeof createNotificationHttpTestApi>>;
  let adminToken: string;

  before(async () => {
    api = await createNotificationHttpTestApi();
    adminToken = api.issueToken("admin-1", "ADMIN");
  });

  after(async () => {
    await api.close();
  });

  function data(res: ApiResponse): Record<string, unknown> {
    return res.body?.data as Record<string, unknown>;
  }

  function dataList(res: ApiResponse): Record<string, unknown>[] {
    return res.body?.data as Record<string, unknown>[];
  }

  function userId(res: ApiResponse): string {
    return String(data(res).userId);
  }

  async function createFor(
    userId: string,
    overrides: Record<string, unknown> = {},
  ): Promise<string> {
    const res = await request(api.baseUrl, BASE, {
      method: "POST",
      token: adminToken,
      body: { userId, title: "Order update", body: "Your order is on the way", ...overrides },
    });
    assert.equal(res.status, 201);
    return String(data(res).id);
  }

  it("creates a pending notification as admin with in_app defaults", async () => {
    const res = await request(api.baseUrl, BASE, {
      method: "POST",
      token: adminToken,
      body: { userId: "user-create", title: "Welcome", body: "Thanks for joining" },
    });

    assert.equal(res.status, 201);
    assert.equal((res.body as { success: boolean }).success, true);
    assert.equal(userId(res), "user-create");
    assert.equal(data(res).channel, "in_app");
    assert.equal(data(res).status, "pending");
    assert.equal(data(res).recipient, null);
    assert.equal(data(res).metadata, null);
  });

  it("stores channel, recipient, and metadata on create", async () => {
    const id = await createFor("user-create-2", {
      channel: "email",
      recipient: "person@example.com",
      metadata: { orderId: "order-123" },
    });

    const res = await request(api.baseUrl, `${BASE}/${id}`, {
      method: "GET",
      token: api.issueToken("user-create-2"),
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).channel, "email");
    assert.equal(data(res).recipient, "person@example.com");
    assert.equal((data(res).metadata as Record<string, unknown>).orderId, "order-123");
  });

  it("rejects invalid create payloads", async () => {
    const empty = await request(api.baseUrl, BASE, {
      method: "POST",
      token: adminToken,
      body: {},
    });
    assert.equal(empty.status, 400);
    assert.equal((empty.body as { success: boolean }).success, false);

    const blank = await request(api.baseUrl, BASE, {
      method: "POST",
      token: adminToken,
      body: { userId: "", title: "", body: "" },
    });
    assert.equal(blank.status, 400);
  });

  it("rejects non-admin create", async () => {
    const res = await request(api.baseUrl, BASE, {
      method: "POST",
      token: api.issueToken("customer-1"),
      body: { userId: "customer-1", title: "Hi", body: "Hello" },
    });

    assert.equal(res.status, 403);
  });

  it("lists only the authenticated user's notifications, newest first", async () => {
    const base = Date.now();
    api.notificationHandle.seedNotification(
      makeNotification("user-list-1", {
        id: "n-list-a1",
        title: "older",
        createdAt: new Date(base),
      }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-list-1", {
        id: "n-list-a2",
        title: "newer",
        createdAt: new Date(base + 60000),
      }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-list-2", { id: "n-list-b1", createdAt: new Date(base + 120000) }),
    );

    const res = await request(api.baseUrl, `${BASE}/me`, {
      method: "GET",
      token: api.issueToken("user-list-1"),
    });

    assert.equal(res.status, 200);
    assert.deepEqual(
      dataList(res).map((n) => n.id),
      ["n-list-a2", "n-list-a1"],
    );
  });

  it("filters the list by status", async () => {
    api.notificationHandle.seedNotification(
      makeNotification("user-filter", {
        id: "n-filter-pending",
        status: "pending",
      }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-filter", {
        id: "n-filter-sent",
        status: "sent",
        providerReference: "ref-1",
      }),
    );

    const res = await request(api.baseUrl, `${BASE}/me?status=sent`, {
      method: "GET",
      token: api.issueToken("user-filter"),
    });

    assert.equal(res.status, 200);
    assert.deepEqual(
      dataList(res).map((n) => n.id),
      ["n-filter-sent"],
    );
  });

  it("returns 400 for an invalid status filter", async () => {
    const res = await request(api.baseUrl, `${BASE}/me?status=bogus`, {
      method: "GET",
      token: api.issueToken("user-filter"),
    });

    assert.equal(res.status, 400);
  });

  it("marks a single notification read as the owner", async () => {
    const id = await createFor("user-read-1");

    const res = await request(api.baseUrl, `${BASE}/me/${id}/read`, {
      method: "PUT",
      token: api.issueToken("user-read-1"),
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).id, id);
    assert.notEqual(data(res).readAt, null);
  });

  it("returns 403 when the owner reads an already-read notification", async () => {
    const id = await createFor("user-read-2");

    const once = await request(api.baseUrl, `${BASE}/me/${id}/read`, {
      method: "PUT",
      token: api.issueToken("user-read-2"),
    });
    assert.equal(once.status, 200);

    const twice = await request(api.baseUrl, `${BASE}/me/${id}/read`, {
      method: "PUT",
      token: api.issueToken("user-read-2"),
    });
    assert.equal(twice.status, 403);
  });

  it("returns 403 when a user reads another user's notification", async () => {
    const id = await createFor("user-read-3");

    const res = await request(api.baseUrl, `${BASE}/me/${id}/read`, {
      method: "PUT",
      token: api.issueToken("user-read-other"),
    });

    assert.equal(res.status, 403);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 404 when reading an unknown notification", async () => {
    const res = await request(api.baseUrl, `${BASE}/me/missing/read`, {
      method: "PUT",
      token: api.issueToken("user-read-4"),
    });

    assert.equal(res.status, 404);
  });

  it("marks all unread notifications read for the caller only", async () => {
    api.notificationHandle.seedNotification(
      makeNotification("user-bulk", { id: "n-bulk-1", readAt: new Date() }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-bulk", { id: "n-bulk-2" }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-bulk", { id: "n-bulk-3" }),
    );
    api.notificationHandle.seedNotification(
      makeNotification("user-other", { id: "n-bulk-other" }),
    );

    const res = await request(api.baseUrl, `${BASE}/me/read-all`, {
      method: "PUT",
      token: api.issueToken("user-bulk"),
    });

    assert.equal(res.status, 200);
    assert.equal((data(res).updatedCount as number), 2);

    const list = await request(api.baseUrl, `${BASE}/me`, {
      method: "GET",
      token: api.issueToken("user-bulk"),
    });
    const unread = dataList(list).filter((n) => n.readAt === null);
    assert.equal(unread.length, 0);
  });

  it("returns a notification to its owner", async () => {
    const id = await createFor("user-get-1");

    const res = await request(api.baseUrl, `${BASE}/${id}`, {
      method: "GET",
      token: api.issueToken("user-get-1"),
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).id, id);
    assert.equal(userId(res), "user-get-1");
  });

  it("allows admin to view any notification", async () => {
    const id = await createFor("user-get-admin");

    const res = await request(api.baseUrl, `${BASE}/${id}`, {
      method: "GET",
      token: adminToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).id, id);
  });

  it("forbids a user from viewing another user's notification", async () => {
    const id = await createFor("user-get-owned");

    const res = await request(api.baseUrl, `${BASE}/${id}`, {
      method: "GET",
      token: api.issueToken("user-get-stranger"),
    });

    assert.equal(res.status, 403);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 404 for an unknown notification", async () => {
    const res = await request(api.baseUrl, `${BASE}/missing`, {
      method: "GET",
      token: adminToken,
    });

    assert.equal(res.status, 404);
  });

  it("sends a pending notification as admin and records the provider reference", async () => {
    const id = await createFor("user-send-1");

    const res = await request(api.baseUrl, `${BASE}/${id}/send`, {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).status, "sent");
    assert.equal(data(res).providerReference, "fake-ref");
    assert.notEqual(data(res).sentAt, null);
  });

  it("records a failure when the provider rejects delivery", async () => {
    api.providerHandle.setResult({ success: false, failureReason: "Provider downtime" });
    const id = await createFor("user-send-fail");

    const res = await request(api.baseUrl, `${BASE}/${id}/send`, {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).status, "failed");
    assert.equal(data(res).failureReason, "Provider downtime");
    assert.notEqual(data(res).failedAt, null);
  });

  it("rejects sending an already-sent notification", async () => {
    const id = await createFor("user-send-twice");

    await request(api.baseUrl, `${BASE}/${id}/send`, {
      method: "POST",
      token: adminToken,
    });

    const res = await request(api.baseUrl, `${BASE}/${id}/send`, {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 409);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 404 when sending an unknown notification", async () => {
    const res = await request(api.baseUrl, `${BASE}/missing/send`, {
      method: "POST",
      token: adminToken,
    });

    assert.equal(res.status, 404);
  });

  it("rejects non-admin send", async () => {
    const id = await createFor("user-send-forbidden");

    const res = await request(api.baseUrl, `${BASE}/${id}/send`, {
      method: "POST",
      token: api.issueToken("customer-1"),
    });

    assert.equal(res.status, 403);
  });

  it("rejects unauthenticated requests", async () => {
    const listWithoutToken = await request(api.baseUrl, `${BASE}/me`, { method: "GET" });
    assert.equal(listWithoutToken.status, 401);

    const createWithoutToken = await request(api.baseUrl, BASE, {
      method: "POST",
      body: { userId: "user-x", title: "Hi", body: "Hello" },
    });
    assert.equal(createWithoutToken.status, 401);
  });

  it("rejects malformed tokens", async () => {
    const res = await request(api.baseUrl, `${BASE}/me`, {
      method: "GET",
      token: "not-a-jwt",
    });

    assert.equal(res.status, 401);
  });
});