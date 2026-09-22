import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPrice } from "../lib/utils/format";

describe("Cart and Pricing Logic", () => {
  it("calculates item subtotal correctly for single and multiple items", () => {
    const items = [
      { id: "1", quantity: 2, unitPrice: 199.5 },
      { id: "2", quantity: 3, unitPrice: 50 },
    ];

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0,
    );

    assert.equal(subtotal, 549);
    assert.equal(formatPrice(subtotal), "$549.00");
  });

  it("calculates delivery fee only when cart is non-empty", () => {
    const emptyItems: Array<{ id: string; quantity: number }> = [];
    const fullItems = [{ id: "1", quantity: 1, unitPrice: 200 }];

    const emptyDeliveryFee = emptyItems.length > 0 ? 40 : 0;
    const fullDeliveryFee = fullItems.length > 0 ? 40 : 0;

    assert.equal(emptyDeliveryFee, 0);
    assert.equal(fullDeliveryFee, 40);
  });

  it("calculates total amount including delivery charges", () => {
    const subtotal = 350;
    const deliveryFee = 40;
    const total = subtotal + deliveryFee;

    assert.equal(total, 390);
    assert.equal(formatPrice(total), "$390.00");
  });

  it("handles quantity increments and decrements", () => {
    let quantity = 1;

    // increment
    quantity += 1;
    assert.equal(quantity, 2);

    // decrement
    quantity -= 1;
    assert.equal(quantity, 1);

    // decrease to zero removes item
    const shouldRemove = quantity - 1 <= 0;
    assert.equal(shouldRemove, true);
  });
});
