import { Decimal } from "decimal.js";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";
import { makeOrder } from "./helpers/fake-repositories.js";

function data(res: { body: Record<string, unknown> | null }): Record<string, unknown> | null {
  return (res.body?.data as Record<string, unknown> | undefined) ?? null;
}

function seedOrder(
  api: HttpTestApi,
  id: string,
  overrides: { status?: string; restaurantId?: string; customerId?: string; paymentStatus?: string } = {},
): void {
  api.handle.seedOrder(
    makeOrder(id, {
      customerId: overrides.customerId ?? "customer-x",
      restaurantId: overrides.restaurantId ?? "rest-1",
      status: (overrides.status as "placed") ?? "placed",
      paymentStatus: (overrides.paymentStatus as "pending") ?? "pending",
      subtotal: new Decimal("20.00"),
      totalAmount: new Decimal("20.00"),
    }),
  );
}

describe("Restaurant Order HTTP", () => {
  let api: HttpTestApi;
  let ownerToken: string;

  before(async () => {
    api = await createHttpTestApi();
    ownerToken = api.issueToken("owner-1", "RESTAURANT");
    api.handle.seedRestaurantOwnership("owner-1", "rest-1");
    api.handle.seedRestaurantOwnership("owner-2", "rest-2");
  });

  after(async () => {
    await api.close();
  });

  describe("GET /restaurant/orders", () => {
    it("lists only orders for the owned restaurant", async () => {
      seedOrder(api, "ro-list-1", { restaurantId: "rest-1" });
      seedOrder(api, "ro-list-2", { restaurantId: "rest-1" });
      seedOrder(api, "ro-list-3", { restaurantId: "rest-2" });

      const res = await request(api.baseUrl, "/restaurant/orders", { token: ownerToken });
      assert.strictEqual(res.status, 200);
      const body = res.body as Record<string, unknown> & { data: Record<string, unknown>[] };
      assert.strictEqual(body.total, 2);
      assert.deepStrictEqual(
        body.data.map((o: Record<string, unknown>) => o.restaurantId),
        ["rest-1", "rest-1"],
      );
    });

    it("returns 403 when the user has no restaurant profile", async () => {
      const res = await request(api.baseUrl, "/restaurant/orders", {
        token: api.issueToken("no-restaurant-owner", "RESTAURANT"),
      });
      assert.strictEqual(res.status, 403);
    });

    it("returns 401 without a token", async () => {
      const res = await request(api.baseUrl, "/restaurant/orders");
      assert.strictEqual(res.status, 401);
    });
  });

  describe("GET /restaurant/orders/:id", () => {
    it("returns an order belonging to the owned restaurant", async () => {
      seedOrder(api, "ro-get-1", { restaurantId: "rest-1" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-get-1", { token: ownerToken });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res)?.id, "ro-get-1");
    });

    it("returns 403 for an order of another restaurant", async () => {
      seedOrder(api, "ro-get-2", { restaurantId: "rest-2" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-get-2", { token: ownerToken });
      assert.strictEqual(res.status, 403);
    });

    it("returns 404 for a non-existent order", async () => {
      const res = await request(api.baseUrl, "/restaurant/orders/ro-missing", { token: ownerToken });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("PUT /restaurant/orders/:id/accept", () => {
    it("accepts a placed order", async () => {
      seedOrder(api, "ro-accept-1", { restaurantId: "rest-1" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-accept-1/accept", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.status, "accepted");
    });

    it("returns 409 when the order is not placed", async () => {
      seedOrder(api, "ro-accept-2", { restaurantId: "rest-1", status: "preparing" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-accept-2/accept", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 403 for an order of another restaurant", async () => {
      seedOrder(api, "ro-accept-3", { restaurantId: "rest-2" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-accept-3/accept", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe("PUT /restaurant/orders/:id/reject", () => {
    it("rejects a placed order and cancels payment", async () => {
      seedOrder(api, "ro-reject-1", { restaurantId: "rest-1" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-reject-1/reject", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.status, "cancelled");
    });

    it("rejects an accepted order", async () => {
      seedOrder(api, "ro-reject-2", { restaurantId: "rest-1", status: "accepted" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-reject-2/reject", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.status, "cancelled");
      assert.strictEqual(data(res)?.paymentStatus, "cancelled");
    });

    it("returns 409 when the order is already cancelled", async () => {
      seedOrder(api, "ro-reject-3", { restaurantId: "rest-1", status: "cancelled" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-reject-3/reject", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 409);
    });
  });

  describe("PUT /restaurant/orders/:id/preparing", () => {
    it("starts preparing an accepted order", async () => {
      seedOrder(api, "ro-prep-1", { restaurantId: "rest-1", status: "accepted" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-prep-1/preparing", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.status, "preparing");
    });

    it("returns 409 when the order is still placed", async () => {
      seedOrder(api, "ro-prep-2", { restaurantId: "rest-1" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-prep-2/preparing", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 409);
    });
  });

  describe("PUT /restaurant/orders/:id/ready", () => {
    it("marks a preparing order ready", async () => {
      seedOrder(api, "ro-ready-1", { restaurantId: "rest-1", status: "preparing" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-ready-1/ready", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.status, "ready");
    });

    it("returns 409 when the order is not preparing", async () => {
      seedOrder(api, "ro-ready-2", { restaurantId: "rest-1", status: "accepted" });
      const res = await request(api.baseUrl, "/restaurant/orders/ro-ready-2/ready", {
        method: "PUT",
        token: ownerToken,
      });
      assert.strictEqual(res.status, 409);
    });
  });
});