import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, type CartView } from "../../domain/order/cart.types.js";
import type { OrderActor } from "../order/create-order.js";
import { CartItemNotFoundError } from "../order/errors.js";

export const removeCartItem =
  (carts: CartRepository) =>
  async (actor: OrderActor, itemId: string): Promise<CartView> => {
    const item = await carts.findCartItemWithOwner(itemId);

    if (!item) {
      throw new CartItemNotFoundError();
    }

    const isCustomerMatch = Boolean(actor.customerId && item.cart.customerId === actor.customerId);
    const isGuestMatch = Boolean(actor.guestSessionId && item.cart.guestSessionId === actor.guestSessionId);

    if (!isCustomerMatch && !isGuestMatch) {
      throw new CartItemNotFoundError();
    }

    await carts.deleteCartItem(itemId);

    const cart = await carts.findCartById(item.cart.id);

    if (!cart) {
      throw new Error("Cart not found after removing item");
    }

    return cartToView(cart);
  };
