import { Decimal } from "decimal.js";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createHttpTestApi, request, type HttpTestApi } from "./helpers/http-api.js";
import {
  makeCart,
  makeCartItem,
  makeMenuItem,
  makeOrder,
  makeRestaurant,
} from "./helpers/fake-repositories.js";

function data(res: { body: Record<string, unknown> | null }): Record<string, unknown> | null {
  return (res.body?.data as Record<string, unknown> | undefined) ?? null;
}

describe("Order HTTP", () => {
  let api: HttpTestApi;
  let token: string;

  before(async () => {
    api = await createHttpTestApi();
    token = api.issueToken("order-customer");

    api.handle.seedRestaurant(makeRestaurant("order-rest"));
    api.handle.seedMenuItem(makeMenuItem("order-item-1", { restaurantId: "order-rest", name: "Pasta", price: 15.5 }));
    api.handle.seedMenuItem(makeMenuItem("order-item-2", { restaurantId: "order-rest", name: "Salad", price: 12 }));
    api.handle.seedMenuItem(makeMenuItem("order-item-3", { restaurantId: "order-rest", isAvailable: false }));

    const cart = makeCart("order-cart", "order-customer", "order-rest", []);
    api.handle.seedCart(cart);
    api.handle.seedCartItem(makeCartItem("order-cart-item-1", cart.id, "order-item-1", 2));
    api.handle.seedCartItem(makeCartItem("order-cart-item-2", cart.id, "order-item-2", 1));
  });

  after(async () => {
    await api.close();
  });

  describe("POST /orders", () => {
    it("creates an order from the customer's cart", async () => {
      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token,
        body: {
          deliveryAddressId: "addr-1",
          deliveryAddress: { label: "Work", street: "123 Main St", city: "Springfield" },
          notes: "Ring doorbell",
        },
      });
      assert.strictEqual(res.status, 201);

      const order = data(res) as Record<string, unknown> & { items: Record<string, unknown>[] };
      assert.strictEqual(order.restaurantId, "order-rest");
      assert.strictEqual(order.deliveryAddressId, "addr-1");
      assert.strictEqual(order.notes, "Ring doorbell");
      assert.strictEqual(order.status, "placed");
      assert.strictEqual(order.paymentStatus, "pending");
      assert.strictEqual(order.paymentMethod, "cod");
      assert.deepStrictEqual(order.deliveryAddress, {
        label: "Work",
        street: "123 Main St",
        city: "Springfield",
      });

      const subtotal = 15.5 * 2 + 12;
      assert.strictEqual(new Decimal(order.subtotal as string).toNumber(), subtotal);
      assert.strictEqual(new Decimal(order.deliveryFee as string).toNumber(), 0);
      assert.strictEqual(new Decimal(order.totalAmount as string).toNumber(), subtotal);

      assert.strictEqual(order.items.length, 2);
      const pastaItem = order.items.find((i: Record<string, unknown>) => i.menuItemId === "order-item-1");
      assert.strictEqual(pastaItem?.menuItemName, "Pasta");
      assert.strictEqual(pastaItem?.quantity, 2);
      assert.strictEqual(new Decimal(pastaItem?.unitPrice as string).toNumber(), 15.5);
      assert.strictEqual(new Decimal(pastaItem?.subtotal as string).toNumber(), 31);
    });

    it("clears the cart after order creation", async () => {
      const cartRes = await request(api.baseUrl, "/cart", { token });
      assert.strictEqual(cartRes.status, 200);
      assert.deepStrictEqual(data(cartRes), {
        cartId: "order-cart",
        restaurantId: null,
        items: [],
      });
    });

    it("returns 400 when the cart is empty", async () => {
      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token: api.issueToken("empty-cart-customer"),
        body: {},
      });
      assert.strictEqual(res.status, 400);
    });

    it("returns 409 when the restaurant is closed", async () => {
      const closedRest = makeRestaurant("closed-order-rest", { isOpen: false });
      api.handle.seedRestaurant(closedRest);
      const cart = makeCart("closed-cart", "closed-customer", "closed-order-rest", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("closed-cart-item", cart.id, "order-item-1", 1));

      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token: api.issueToken("closed-customer"),
        body: {},
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 409 when an item is unavailable", async () => {
      const cart = makeCart("unavail-cart", "unavail-customer", "order-rest", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("unavail-item", cart.id, "order-item-3", 1));

      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token: api.issueToken("unavail-customer"),
        body: {},
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 404 when a menu item is no longer in the catalog", async () => {
      const cart = makeCart("removed-cart", "removed-customer", "order-rest", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("removed-cart-item", cart.id, "item-gone", 1));

      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token: api.issueToken("removed-customer"),
        body: {},
      });
      assert.strictEqual(res.status, 404);
    });

    it("applies delivery fee to totalAmount", async () => {
      const cart = makeCart("fee-cart", "fee-customer", "order-rest", []);
      api.handle.seedCart(cart);
      api.handle.seedCartItem(makeCartItem("fee-item", cart.id, "order-item-2", 2));

      const res = await request(api.baseUrl, "/orders", {
        method: "POST",
        token: api.issueToken("fee-customer"),
        body: { deliveryFee: 5.5 },
      });
      assert.strictEqual(res.status, 201);
      const order = data(res) as Record<string, unknown>;
      const expectedSubtotal = 12 * 2;
      const expectedTotal = expectedSubtotal + 5.5;
      assert.strictEqual(new Decimal(order.subtotal as string).toNumber(), expectedSubtotal);
      assert.strictEqual(new Decimal(order.deliveryFee as string).toNumber(), 5.5);
      assert.strictEqual(new Decimal(order.totalAmount as string).toNumber(), expectedTotal);
    });
  });

  describe("GET /orders", () => {
    let listToken: string;

    before(async () => {
      listToken = api.issueToken("list-customer");
      for (let i = 0; i < 3; i++) {
        api.handle.seedOrder(
          makeOrder(`list-order-${i}`, { customerId: "list-customer", restaurantId: "order-rest" }),
        );
      }
    });

    it("lists orders for the customer", async () => {
      const res = await request(api.baseUrl, "/orders", { token: listToken });
      assert.strictEqual(res.status, 200);
      const body = res.body as Record<string, unknown> & { data: Record<string, unknown>[] };
      assert.strictEqual(body.data.length, 3);
      assert.strictEqual(body.total, 3);
    });

    it("paginates with limit and offset", async () => {
      const res = await request(api.baseUrl, "/orders?limit=1&offset=1", { token: listToken });
      assert.strictEqual(res.status, 200);
      const body = res.body as Record<string, unknown> & { data: Record<string, unknown>[] };
      assert.strictEqual(body.data.length, 1);
      assert.strictEqual(body.total, 3);
    });
  });

  describe("GET /orders/:id", () => {
    it("returns an order belonging to the customer", async () => {
      const list = await request(api.baseUrl, "/orders", { token });
      const body = list.body as Record<string, unknown> & { data: Record<string, unknown>[] };
      const orderId = body.data[0]!.id;

      const res = await request(api.baseUrl, `/orders/${orderId}`, { token });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res)?.id, orderId);
    });

    it("returns 403 for another customer's order", async () => {
      const list = await request(api.baseUrl, "/orders", { token });
      const body = list.body as Record<string, unknown> & { data: Record<string, unknown>[] };
      const orderId = body.data[0]!.id;

      const otherToken = api.issueToken("order-other");
      const res = await request(api.baseUrl, `/orders/${orderId}`, { token: otherToken });
      assert.strictEqual(res.status, 403);
    });

    it("returns 404 for a non-existent order", async () => {
      const res = await request(api.baseUrl, "/orders/non-existent", { token });
      assert.strictEqual(res.status, 404);
    });
  });

  describe("PUT /orders/:id/cancel", () => {
    it("cancels a placed order", async () => {
      const placedOrder = makeOrder("cancel-test", {
        customerId: "cancel-customer",
        restaurantId: "order-rest",
        subtotal: new Decimal("31.00"),
        totalAmount: new Decimal("31.00"),
        status: "placed",
        paymentStatus: "pending",
      });
      api.handle.seedOrder(placedOrder);

      const res = await request(api.baseUrl, "/orders/cancel-test/cancel", {
        method: "PUT",
        token: api.issueToken("cancel-customer"),
      });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res)?.status, "cancelled");
      assert.deepStrictEqual(data(res)?.paymentStatus, "cancelled");
    });

    it("cancels an accepted order", async () => {
      const order = makeOrder("cancel-accepted", {
        customerId: "cancel-customer-2",
        status: "accepted",
        paymentStatus: "pending",
      });
      api.handle.seedOrder(order);

      const res = await request(api.baseUrl, "/orders/cancel-accepted/cancel", {
        method: "PUT",
        token: api.issueToken("cancel-customer-2"),
      });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(data(res)?.status, "cancelled");
    });

    it("returns 409 when cancelling a delivered order", async () => {
      const order = makeOrder("cancel-delivered", {
        customerId: "cancel-customer-3",
        status: "delivered",
      });
      api.handle.seedOrder(order);

      const res = await request(api.baseUrl, "/orders/cancel-delivered/cancel", {
        method: "PUT",
        token: api.issueToken("cancel-customer-3"),
      });
      assert.strictEqual(res.status, 409);
    });

    it("returns 403 for another customer's order", async () => {
      const order = makeOrder("cancel-foreign", {
        customerId: "order-customer",
        status: "placed",
      });
      api.handle.seedOrder(order);

      const res = await request(api.baseUrl, "/orders/cancel-foreign/cancel", {
        method: "PUT",
        token: api.issueToken("foreign-canceller"),
      });
      assert.strictEqual(res.status, 403);
    });

    it("returns 404 for a non-existent order", async () => {
      const res = await request(api.baseUrl, "/orders/does-not-exist/cancel", {
        method: "PUT",
        token,
      });
      assert.strictEqual(res.status, 404);
    });
  });
});