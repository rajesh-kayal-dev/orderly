import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";
import { makeRestaurant } from "./helpers/fake-restaurant.repository.js";

describe("Restaurant HTTP", () => {
  let api: HttpTestApi;

  before(async () => {
    api = await createHttpTestApi();
  });

  after(async () => {
    await api.close();
  });

  describe("POST /restaurants", () => {
    it("creates restaurant for authenticated user", async () => {
      const token = api.issueToken("user-1");
      const res = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Pizza Place" },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body?.success, true);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.name, "Pizza Place");
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.ownerId, "user-1");
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.isActive, true);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.isOpen, true);
    });

    it("returns 401 without token", async () => {
      const res = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        body: { name: "No Auth" },
      });
      assert.strictEqual(res.status, 401);
    });

    it("returns 409 when restaurant already exists for user", async () => {
      const token = api.issueToken("dup-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "First" },
      });
      const res = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Second" },
      });
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body?.success, false);
    });

    it("returns 400 for invalid input", async () => {
      const token = api.issueToken("user-valid");
      const res = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: {},
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe("GET /restaurants", () => {
    it("lists all restaurants", async () => {
      const token = api.issueToken("list-user-1");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Restaurant A" },
      });

      const res = await request(api.baseUrl, "/restaurants");

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body?.success, true);
      assert.ok(Array.isArray(res.body?.data));
      assert.ok((res.body?.data as unknown[])?.length >= 1);
    });

    it("filters by activeOnly=true", async () => {
      const inactiveId = api.handle.nextRestaurantId();
      const inactive = makeRestaurant(inactiveId, {
        ownerId: `owner-${inactiveId}`,
        name: "Inactive Place",
        isActive: false,
      });
      api.handle.seedRestaurant(inactive);

      const res = await request(api.baseUrl, "/restaurants?activeOnly=true");

      assert.strictEqual(res.status, 200);
      const names = (res.body?.data as Record<string, unknown>[])?.map((r) => r.name);
      assert.ok(!names?.includes("Inactive Place"));
    });

    it("searches by name", async () => {
      const token = api.issueToken("search-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Unique Taco Stand" },
      });

      const res = await request(api.baseUrl, "/restaurants?search=Unique+Taco");

      assert.strictEqual(res.status, 200);
      const names = (res.body?.data as Record<string, unknown>[])?.map((r) => r.name);
      assert.ok(names?.includes("Unique Taco Stand"));
    });
  });

  describe("GET /restaurants/:id", () => {
    it("returns restaurant by id", async () => {
      const token = api.issueToken("get-user-1");
      const create = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Get Place" },
      });
      const id = (create.body?.data as Record<string, unknown>)?.id as string;

      const res = await request(api.baseUrl, `/restaurants/${id}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.name, "Get Place");
    });

    it("returns 404 for unknown id", async () => {
      const res = await request(api.baseUrl, "/restaurants/nonexistent");
      assert.strictEqual(res.status, 404);
    });
  });

  describe("GET /restaurants/my-profile", () => {
    it("returns own restaurant profile", async () => {
      const token = api.issueToken("profile-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "My Place" },
      });

      const res = await request(api.baseUrl, "/restaurants/my-profile", { token });

      assert.strictEqual(res.status, 200);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.name, "My Place");
    });

    it("returns 401 without token", async () => {
      const res = await request(api.baseUrl, "/restaurants/my-profile");
      assert.strictEqual(res.status, 401);
    });

    it("returns 404 when no profile exists", async () => {
      const token = api.issueToken("no-profile-user");
      const res = await request(api.baseUrl, "/restaurants/my-profile", { token });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("PUT /restaurants/my-profile", () => {
    it("updates own restaurant profile", async () => {
      const token = api.issueToken("update-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Original Name" },
      });

      const res = await request(api.baseUrl, "/restaurants/my-profile", {
        method: "PUT",
        token,
        body: { name: "Updated Name" },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.name, "Updated Name");
    });

    it("returns 404 for user without restaurant", async () => {
      const token = api.issueToken("update-missing-user");
      const res = await request(api.baseUrl, "/restaurants/my-profile", {
        method: "PUT",
        token,
        body: { name: "Should Fail" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("prevents owner from overwriting another owner's restaurant", async () => {
      const tokenA = api.issueToken("owner-A-profile");
      const tokenB = api.issueToken("owner-B-profile");

      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: tokenA,
        body: { name: "Restaurant A" },
      });

      const updateRes = await request(api.baseUrl, "/restaurants/my-profile", {
        method: "PUT",
        token: tokenB,
        body: { name: "Hijack A" },
      });
      assert.strictEqual(updateRes.status, 404);
    });
  });

  describe("POST /restaurants/my-profile/open and close", () => {
    it("opens a closed restaurant", async () => {
      const token = api.issueToken("open-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Open Place" },
      });

      // close first
      await request(api.baseUrl, "/restaurants/my-profile/close", { method: "POST", token });

      const res = await request(api.baseUrl, "/restaurants/my-profile/open", { method: "POST", token });
      assert.strictEqual(res.status, 200);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.isOpen, true);
    });

    it("closes an open restaurant", async () => {
      const token = api.issueToken("close-user");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token,
        body: { name: "Close Place" },
      });

      const res = await request(api.baseUrl, "/restaurants/my-profile/close", { method: "POST", token });
      assert.strictEqual(res.status, 200);
      assert.strictEqual((res.body?.data as Record<string, unknown>)?.isOpen, false);
    });

    it("returns 401 for open without auth", async () => {
      const res = await request(api.baseUrl, "/restaurants/my-profile/open", { method: "POST" });
      assert.strictEqual(res.status, 401);
    });

    it("returns 404 when restaurant not found on open", async () => {
      const token = api.issueToken("open-missing-user");
      const res = await request(api.baseUrl, "/restaurants/my-profile/open", { method: "POST", token });
      assert.strictEqual(res.status, 404);
    });
  });
});