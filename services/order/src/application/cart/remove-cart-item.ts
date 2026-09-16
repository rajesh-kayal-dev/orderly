import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, type CartView } from "../../domain/order/cart.types.js";
import { CartItemNotFoundError } from "../order/errors.js";

export const removeCartItem =
  (carts: CartRepository) =>
  async (customerId: string, itemId: string): Promise<CartView> => {
    const item = await carts.findCartItemWithOwner(itemId);

    if (!item || item.cart.customerId !== customerId) {
      throw new CartItemNotFoundError();
    }

    await carts.deleteCartItem(itemId);

    const cart = await carts.findCartById(item.cart.id);

    if (!cart) {
      throw new Error("Cart not found after removing item");
    }

    return cartToView(cart);
  };