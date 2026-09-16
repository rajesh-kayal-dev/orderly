import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";
import { makeCart, makeCartItem, makeMenuItem, makeRestaurant } from "./helpers/fake-repositories.js";

function data(res: { body: Record<string, unknown> | null }): Record<string, unknown> | null {
  return (res.body?.data as Record<string, unknown> | undefined) ?? null;
}

describe("Cart HTTP", () => {
  let api: HttpTestApi;
  let token: string;

  before(async () => {
    api = await createHttpTestApi();
    token = api.issueToken("customer-1");

    api.handle.seedRestaurant(makeRestaurant("rest-1", { name: "Open Place" }));
    api.handle.seedRestaurant(makeRestaurant("rest-2", { name: "Closed Place", isOpen: false }));
    api.handle.seedRestaurant(makeRestaurant("rest-3", { name: "Inactive Place", isActive: false }));

    api.handle.seedMenuItem(makeMenuItem("item-1", { restaurantId: "rest-1", name: "Burger", price: 25.5 }));
    api.handle.seedMenuItem(makeMenuItem("item-2", { restaurantId: "rest-1", name: "Fries", price: 10 }));

    const tokensNotNeeded = data as unknown;
    void tokensNotNeeded;
  });

  after(async () => {
    await api.close();
  });

  describe("GET /cart", () => {
    it("returns an empty cart for a customer without one", async () => {
      const res = await request(api.baseUrl, "/cart", { token });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res), { cartId: null, restaurantId: null, items: [] });
    });

    it("returns 401 without a token", async () => {
      const res = await request(api.baseUrl, "/cart");
      assert.strictEqual(res.status, 401);
    });
  });

  describe("POST /cart/items", () => {
    it("adds an item to a new cart", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-1", quantity: 2 },
      });
      assert.strictEqual(res.status, 200);
      const cart = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.strictEqual(cart.restaurantId, "rest-1");
      assert.strictEqual(cart.items.length, 1);
      assert.strictEqual(cart.items[0]?.menuItemId, "item-1");
      assert.strictEqual(cart.items[0]?.quantity, 2);
    });

    it("increments quantity when the same item is added again", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-1", quantity: 1 },
      });
      assert.strictEqual(res.status, 200);
      const cart = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.strictEqual(cart.items.length, 1);
      assert.strictEqual(cart.items[0]?.quantity, 3);
    });

    it("rejects quantity above the maximum", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-1", quantity: 20 },
      });
      assert.strictEqual(res.status, 400);
    });

    it("returns 404 when the restaurant does not exist", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-unknown", menuItemId: "item-1", quantity: 1 },
      });
      assert.strictEqual(res.status, 404);
    });

    it("returns 409 when the restaurant is closed", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-2", menuItemId: "item-1", quantity: 1 },
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 409 when the menu item is unavailable", async () => {
      api.handle.seedMenuItem(makeMenuItem("item-3", { restaurantId: "rest-1", isAvailable: false }));
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-3", quantity: 1 },
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 404 when the menu item does not belong to the restaurant", async () => {
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-not-there", quantity: 1 },
      });
      assert.strictEqual(res.status, 404);
    });

    it("clears existing items when switching restaurants", async () => {
      const add = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-1", menuItemId: "item-1", quantity: 1 },
      });
      assert.strictEqual(add.status, 200);

      api.handle.seedMenuItem(makeMenuItem("item-4", { restaurantId: "rest-3", name: "Inactive Menu Item" }));
      api.handle.seedMenuItem(makeMenuItem("item-5", { restaurantId: "rest-3", name: "Inactive Menu Item 2" }));
      const res = await request(api.baseUrl, "/cart/items", {
        method: "POST",
        token,
        body: { restaurantId: "rest-3", menuItemId: "item-5", quantity: 1 },
      });
      assert.strictEqual(res.status, 200);
      const cart = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.strictEqual(cart.restaurantId, "rest-3");
      assert.strictEqual(cart.items.length, 1);
      assert.strictEqual(cart.items[0]?.menuItemId, "item-5");
    });
  });

  describe("PUT /cart/items/:itemId", () => {
    it("updates the quantity of an item", async () => {
      const cart = makeCart("cart-put", "customer-put", "rest-1", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("put-item-1", cart.id, "item-1", 1));

      const res = await request(api.baseUrl, `/cart/items/${cart.items[0]?.id ?? "put-item-1"}`, {
        method: "PUT",
        token: api.issueToken("customer-put"),
        body: { quantity: 5 },
      });
      assert.strictEqual(res.status, 200);
      const updated = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.strictEqual(updated.items[0]?.quantity, 5);
    });

    it("returns 400 for quantity below minimum", async () => {
      const res = await request(api.baseUrl, "/cart/items/whatever", {
        method: "PUT",
        token,
        body: { quantity: 0 },
      });
      assert.strictEqual(res.status, 400);
    });

    it("returns 404 for another customer's item", async () => {
      const cart = makeCart("cart-owner", "cart-owner-customer", "rest-1", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("owner-item", cart.id, "item-1", 1));

      const res = await request(api.baseUrl, "/cart/items/owner-item", {
        method: "PUT",
        token,
        body: { quantity: 2 },
      });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("DELETE /cart/items/:itemId", () => {
    it("removes an item", async () => {
      const cart = makeCart("cart-del", "customer-del", "rest-1", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("del-item", cart.id, "item-1", 1));

      const res = await request(api.baseUrl, "/cart/items/del-item", {
        method: "DELETE",
        token: api.issueToken("customer-del"),
      });
      assert.strictEqual(res.status, 200);
      const updated = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.deepStrictEqual(updated.items, []);
    });

    it("returns 404 for another customer's item", async () => {
      const cart = makeCart("cart-del-owner", "del-owner-customer", "rest-1", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("del-owner-item", cart.id, "item-1", 1));

      const res = await request(api.baseUrl, "/cart/items/del-owner-item", {
        method: "DELETE",
        token,
      });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("DELETE /cart", () => {
    it("clears all items", async () => {
      const res = await request(api.baseUrl, "/cart", {
        method: "DELETE",
        token,
      });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res), { cartId: null, restaurantId: null, items: [] });
    });
  });
});