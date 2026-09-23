import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, MAX_QUANTITY, type CartView } from "../../domain/order/cart.types.js";
import type { OrderActor } from "../order/create-order.js";
import { CartItemNotFoundError, CartItemQuantityLimitError } from "../order/errors.js";

export const updateCartItemQuantity =
  (carts: CartRepository) =>
  async (actor: OrderActor, itemId: string, quantity: number): Promise<CartView> => {
    const item = await carts.findCartItemWithOwner(itemId);

    if (!item) {
      throw new CartItemNotFoundError();
    }

    const isCustomerMatch = Boolean(actor.customerId && item.cart.customerId === actor.customerId);
    const isGuestMatch = Boolean(actor.guestSessionId && item.cart.guestSessionId === actor.guestSessionId);

    if (!isCustomerMatch && !isGuestMatch) {
      throw new CartItemNotFoundError();
    }

    if (quantity > MAX_QUANTITY) {
      throw new CartItemQuantityLimitError(MAX_QUANTITY);
    }

    if (quantity <= 0) {
      await carts.deleteCartItem(itemId);
    } else {
      await carts.setCartItemQuantity(itemId, quantity);
    }

    const cart = await carts.findCartById(item.cart.id);

    if (!cart) {
      throw new Error("Cart not found after updating item");
    }

    return cartToView(cart);
  };
