import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";
import { makeRestaurant, makeCategory, makeMenuItem } from "./helpers/fake-restaurant.repository.js";

function data(res: { body: Record<string, unknown> | null }): Record<string, unknown> | null {
  return (res.body?.data as Record<string, unknown> | undefined) ?? null;
}

describe("Menu HTTP", () => {
  let api: HttpTestApi;
  let ownerToken: string;

  before(async () => {
    api = await createHttpTestApi();
    ownerToken = api.issueToken("menu-owner");

    const create = await request(api.baseUrl, "/restaurants", {
      method: "POST",
      token: ownerToken,
      body: { name: "Menu Place" },
    });
    const id = (data(create) as Record<string, unknown>).id as string;
    api.handle.setOwnerRestaurantId("menu-owner", id);
  });

  after(async () => {
    await api.close();
  });

  describe("Categories", () => {
    it("creates a category", async () => {
      const res = await request(api.baseUrl, "/menu/categories", {
        method: "POST",
        token: ownerToken,
        body: { name: "Appetizers", sortOrder: 1 },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data(res)?.name, "Appetizers");
      assert.strictEqual(data(res)?.sortOrder, 1);
    });

    it("returns 401 without token", async () => {
      const res = await request(api.baseUrl, "/menu/categories", {
        method: "POST",
        body: { name: "No Auth" },
      });
      assert.strictEqual(res.status, 401);
    });

    it("returns 404 when restaurant profile missing", async () => {
      const token = api.issueToken("no-restaurant-owner");
      const res = await request(api.baseUrl, "/menu/categories", {
        method: "POST",
        token,
        body: { name: "No Restaurant" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("lists categories ordered by sortOrder", async () => {
      const otherToken = api.issueToken("list-cat-owner");
      const create = await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: otherToken,
        body: { name: "Ordered Place" },
      });
      const rId = (data(create) as Record<string, unknown>).id as string;

      api.handle.seedCategory(makeCategory("list-cat-1", { restaurantId: rId, name: "Desserts", sortOrder: 3 }));
      api.handle.seedCategory(makeCategory("list-cat-2", { restaurantId: rId, name: "Drinks", sortOrder: 1 }));
      api.handle.seedCategory(makeCategory("list-cat-3", { restaurantId: rId, name: "Mains", sortOrder: 2 }));

      const res = await request(api.baseUrl, `/menu/categories/${rId}`);
      assert.strictEqual(res.status, 200);
      const cats = data(res) as Record<string, unknown>[];
      assert.deepStrictEqual(cats.map((c) => c.name), ["Drinks", "Mains", "Desserts"]);
    });
  });

  describe("Update category", () => {
    it("updates category name and sortOrder", async () => {
      const rId = api.handle.getRestaurantByOwnerId("menu-owner")!.id;
      api.handle.seedCategory(makeCategory("upd-cat", { restaurantId: rId, name: "Old Name", sortOrder: 1 }));

      const res = await request(api.baseUrl, "/menu/categories/upd-cat", {
        method: "PUT",
        token: ownerToken,
        body: { name: "New Name", sortOrder: 5 },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.name, "New Name");
      assert.strictEqual(data(res)?.sortOrder, 5);
    });

    it("returns 404 for foreign category", async () => {
      const otherToken = api.issueToken("cat-other-owner");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: otherToken,
        body: { name: "Other Cats" },
      });
      const otherRId = api.handle.getRestaurantByOwnerId("cat-other-owner")!.id;
      api.handle.seedCategory(makeCategory("foreign-cat-upd", { restaurantId: otherRId, name: "Foreign" }));

      const res = await request(api.baseUrl, "/menu/categories/foreign-cat-upd", {
        method: "PUT",
        token: ownerToken,
        body: { name: "Hijack" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("returns 404 for missing category", async () => {
      const res = await request(api.baseUrl, "/menu/categories/does-not-exist", {
        method: "PUT",
        token: ownerToken,
        body: { name: "Nothing" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("returns 401 without token", async () => {
      const res = await request(api.baseUrl, "/menu/categories/upd-cat", {
        method: "PUT",
        body: { name: "No Auth" },
      });
      assert.strictEqual(res.status, 401);
    });
  });

  describe("Menu items", () => {
    it("creates an item without category", async () => {
      const res = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Plain Item", price: 9.5 },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data(res)?.name, "Plain Item");
      assert.strictEqual(data(res)?.isAvailable, true);
      assert.ok((data(res)?.price as string).startsWith("9.5") || data(res)?.price === "9.5");
    });

    it("creates an item validating Decimal round-trip", async () => {
      const res = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Priced Item", price: 12.5 },
      });
      assert.strictEqual(res.status, 201);
      assert.ok((data(res)?.price as string).startsWith("12.5"));
    });

    it("creates an item in a category", async () => {
      const rId = api.handle.getRestaurantByOwnerId("menu-owner")!.id;
      const category = api.handle.getCategoriesByRestaurantId(rId)[0];

      const res = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Category Item", price: 5.0, categoryId: category?.id },
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data(res)?.categoryId, category?.id);
    });

    it("returns 404 for foreign category on create", async () => {
      const otherToken = api.issueToken("other-owner");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: otherToken,
        body: { name: "Other Place" },
      });
      const otherRId = api.handle.getRestaurantByOwnerId("other-owner")!.id;
      api.handle.seedCategory(makeCategory("foreign-cat", { restaurantId: otherRId, name: "Foreign" }));

      const res = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Bad Item", price: 1.0, categoryId: "foreign-cat" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("lists items filtered by restaurant", async () => {
      const rId = api.handle.getRestaurantByOwnerId("menu-owner")!.id;
      const res = await request(api.baseUrl, `/menu?restaurantId=${rId}`);
      assert.strictEqual(res.status, 200);
      assert.ok((data(res) as Record<string, unknown>[]).length >= 3);
    });

    it("returns 400 for invalid price", async () => {
      const res = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Bad price", price: -5 },
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe("Update menu item", () => {
    it("updates an item", async () => {
      const create = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Update Me", price: 3.0 },
      });
      const itemId = (data(create) as Record<string, unknown>).id as string;

      const res = await request(api.baseUrl, `/menu/${itemId}`, {
        method: "PUT",
        token: ownerToken,
        body: { name: "Updated", price: 4.25, isAvailable: false },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.name, "Updated");
      assert.strictEqual(data(res)?.isAvailable, false);
      assert.ok((data(res)?.price as string).startsWith("4.25"));
    });

    it("returns 404 for foreign menu item", async () => {
      const otherToken = api.issueToken("update-other-owner");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: otherToken,
        body: { name: "Other Place 2" },
      });
      const otherRId = api.handle.getRestaurantByOwnerId("update-other-owner")!.id;
      api.handle.seedMenuItem(makeMenuItem("foreign-item", { restaurantId: otherRId, price: undefined }));

      const res = await request(api.baseUrl, "/menu/foreign-item", {
        method: "PUT",
        token: ownerToken,
        body: { name: "Hijack" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("returns 404 for missing menu item", async () => {
      const res = await request(api.baseUrl, "/menu/does-not-exist", {
        method: "PUT",
        token: ownerToken,
        body: { name: "Nothing" },
      });
      assert.strictEqual(res.status, 404);
    });

    it("clears categoryId while preserving other fields", async () => {
      const rId = api.handle.getRestaurantByOwnerId("menu-owner")!.id;
      const category = api.handle.getCategoriesByRestaurantId(rId)[0];

      const create = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Detach Me", price: 6.0, categoryId: category?.id },
      });
      const itemId = (data(create) as Record<string, unknown>).id as string;

      const res = await request(api.baseUrl, `/menu/${itemId}`, {
        method: "PUT",
        token: ownerToken,
        body: { categoryId: null, name: "Detached", price: 7.5 },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.name, "Detached");
      assert.strictEqual(data(res)?.categoryId, null);
      assert.ok((data(res)?.price as string).startsWith("7.5"));
    });
  });

  describe("Toggle availability", () => {
    it("toggles availability", async () => {
      const create = await request(api.baseUrl, "/menu", {
        method: "POST",
        token: ownerToken,
        body: { name: "Toggle Me", price: 2.0 },
      });
      const itemId = (data(create) as Record<string, unknown>).id as string;

      const res = await request(api.baseUrl, `/menu/${itemId}/toggle-availability`, {
        method: "PATCH",
        token: ownerToken,
        body: { isAvailable: false },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data(res)?.isAvailable, false);
    });

    it("returns 404 for foreign menu item on toggle", async () => {
      const otherToken = api.issueToken("toggle-other-owner");
      await request(api.baseUrl, "/restaurants", {
        method: "POST",
        token: otherToken,
        body: { name: "Other Place 3" },
      });
      const otherRId = api.handle.getRestaurantByOwnerId("toggle-other-owner")!.id;
      api.handle.seedMenuItem(makeMenuItem("foreign-toggle-item", { restaurantId: otherRId, price: undefined }));

      const res = await request(api.baseUrl, "/menu/foreign-toggle-item/toggle-availability", {
        method: "PATCH",
        token: ownerToken,
        body: { isAvailable: true },
      });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("Full menu", () => {
    it("returns categories with items", async () => {
      const rId = api.handle.getRestaurantByOwnerId("menu-owner")!.id;
      const res = await request(api.baseUrl, `/menu/full/${rId}`);
      assert.strictEqual(res.status, 200);
      const cats = data(res) as Record<string, unknown>[];
      assert.ok(cats.length >= 1);
      assert.ok(Array.isArray(cats[0]?.items));
    });
  });
});