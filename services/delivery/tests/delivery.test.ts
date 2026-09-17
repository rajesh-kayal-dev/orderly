import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createDeliveryHttpTestApi, request, type ApiResponse } from "./helpers/http-api.js";

const DELIVERIES_BASE = "/deliveries";

describe("delivery assignment API", () => {
  let api: Awaited<ReturnType<typeof createDeliveryHttpTestApi>>;

  before(async () => {
    api = await createDeliveryHttpTestApi();
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

  async function createPartnerProfile(userId: string): Promise<string> {
    const token = api.issueToken(userId);
    const res = await request(api.baseUrl, "/delivery-partners/me", { method: "POST", token });
    assert.equal(res.status, 201);
    return String((data(res) as Record<string, unknown>).id);
  }

  it("creates a pending delivery for a new order as admin", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token,
      body: { orderId: "order-1" },
    });

    assert.equal(res.status, 201);
    assert.equal((res.body as { success: boolean }).success, true);
    assert.equal(data(res).orderId, "order-1");
    assert.equal(data(res).status, "pending");
    assert.equal(data(res).partnerId, null);
  });

  it("rejects a duplicate delivery for the same order", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token,
      body: { orderId: "order-1" },
    });

    assert.equal(res.status, 409);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("never trusts a client-supplied partner identity", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token,
      body: { orderId: "order-2", partnerId: "attacker-picked-partner" },
    });

    assert.equal(res.status, 201);
    assert.equal(data(res).orderId, "order-2");
    assert.equal(data(res).partnerId, null);
    assert.equal(data(res).status, "pending");
  });

  it("returns the delivery by id", async () => {
    const adminToken = api.issueToken("admin-1", "ADMIN");
    const created = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: adminToken,
      body: { orderId: "order-3" },
    });

    const id = String(data(created).id);

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/${id}`, {
      method: "GET",
      token: adminToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).id, id);
    assert.equal(data(res).orderId, "order-3");
  });

  it("returns the delivery by order id", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/order/order-1`, {
      method: "GET",
      token,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).orderId, "order-1");
  });

  it("returns 404 for an unknown delivery and unknown order", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const byId = await request(api.baseUrl, `${DELIVERIES_BASE}/missing-delivery`, {
      method: "GET",
      token,
    });
    assert.equal(byId.status, 404);

    const byOrder = await request(api.baseUrl, `${DELIVERIES_BASE}/order/unknown-order`, {
      method: "GET",
      token,
    });
    assert.equal(byOrder.status, 404);
  });

  it("returns 400 for invalid create payloads", async () => {
    const token = api.issueToken("admin-1", "ADMIN");

    const empty = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token,
      body: { orderId: "" },
    });
    assert.equal(empty.status, 400);

    const missing = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token,
      body: {},
    });
    assert.equal(missing.status, 400);
  });

  it("lets a partner accept an available delivery", async () => {
    const partnerId = await createPartnerProfile("partner-accept");
    const adminToken = api.issueToken("admin-1", "ADMIN");
    const partnerToken = api.issueToken("partner-accept");

    const created = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: adminToken,
      body: { orderId: "order-accept" },
    });
    const id = String(data(created).id);

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${id}`, {
      method: "PUT",
      token: partnerToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).status, "assigned");
    assert.equal(data(res).partnerId, partnerId);
  });

  it("is idempotent when the same partner accepts again", async () => {
    const partnerToken = api.issueToken("partner-accept");

    const delivery = api.deliveryHandle
      .getDeliveries()
      .find((d) => d.orderId === "order-accept");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${delivery!.id}`, {
      method: "PUT",
      token: partnerToken,
    });

    assert.equal(res.status, 200);
    assert.equal(data(res).status, "assigned");
  });

  it("rejects an unrelated partner from accepting another partner's assignment", async () => {
    const enemyPartnerId = await createPartnerProfile("partner-rival");
    const rivalToken = api.issueToken("partner-rival");

    const delivery = api.deliveryHandle
      .getDeliveries()
      .find((d) => d.orderId === "order-accept");

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${delivery!.id}`, {
      method: "PUT",
      token: rivalToken,
    });

    assert.equal(res.status, 409);
    assert.notEqual(delivery!.partnerId, enemyPartnerId);
  });

  it("rejects accept when the partner has no profile", async () => {
    const adminToken = api.issueToken("admin-1", "ADMIN");
    const created = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: adminToken,
      body: { orderId: "order-noprofile" },
    });
    const id = String(data(created).id);

    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${id}`, {
      method: "PUT",
      token: api.issueToken("partner-noprofile"),
    });

    assert.equal(res.status, 404);
    assert.equal((res.body as { success: boolean }).success, false);
  });

  it("returns 404 when accepting an unknown delivery", async () => {
    const res = await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/missing-delivery`, {
      method: "PUT",
      token: api.issueToken("partner-accept"),
    });

    assert.equal(res.status, 404);
  });

  it("lists only the authenticated partner's deliveries", async () => {
    await createPartnerProfile("partner-a");
    await createPartnerProfile("partner-b");
    const adminToken = api.issueToken("admin-1", "ADMIN");

    const forA = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: adminToken,
      body: { orderId: "order-for-a" },
    });
    const forB = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: adminToken,
      body: { orderId: "order-for-b" },
    });
    const aId = String(data(forA).id);
    const bId = String(data(forB).id);

    await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${aId}`, {
      method: "PUT",
      token: api.issueToken("partner-a"),
    });
    await request(api.baseUrl, `${DELIVERIES_BASE}/me/accept/${bId}`, {
      method: "PUT",
      token: api.issueToken("partner-b"),
    });

    const resA = await request(api.baseUrl, `${DELIVERIES_BASE}/me`, {
      method: "GET",
      token: api.issueToken("partner-a"),
    });
    const resB = await request(api.baseUrl, `${DELIVERIES_BASE}/me`, {
      method: "GET",
      token: api.issueToken("partner-b"),
    });

    assert.equal(resA.status, 200);
    assert.deepEqual(
      dataList(resA).map((d) => d.orderId),
      ["order-for-a"],
    );
    assert.deepEqual(
      dataList(resB).map((d) => d.orderId),
      ["order-for-b"],
    );
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      body: { orderId: "order-x" },
    });

    assert.equal(res.status, 401);
  });

  it("rejects wrong-role access", async () => {
    const customerToken = api.issueToken("customer-1", "CUSTOMER");

    const createAsCustomer = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: customerToken,
      body: { orderId: "order-y" },
    });
    assert.equal(createAsCustomer.status, 403);

    const acceptAsCustomer = await request(api.baseUrl, `${DELIVERIES_BASE}/me`, {
      method: "GET",
      token: customerToken,
    });
    assert.equal(acceptAsCustomer.status, 403);
  });

  it("rejects a partner from creating deliveries (admin only)", async () => {
    const res = await request(api.baseUrl, `${DELIVERIES_BASE}`, {
      method: "POST",
      token: api.issueToken("partner-accept"),
      body: { orderId: "order-z" },
    });

    assert.equal(res.status, 403);
  });
});