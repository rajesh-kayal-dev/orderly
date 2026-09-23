import type { CartRepository } from "../../domain/order/cart.repository.js";
import { emptyCartView, type CartView } from "../../domain/order/cart.types.js";
import type { OrderActor } from "../order/create-order.js";

export const clearCart =
  (carts: CartRepository) =>
  async (actor: OrderActor): Promise<CartView> => {
    const cart = actor.customerId
      ? await carts.findCartByCustomer(actor.customerId)
      : actor.guestSessionId
      ? await carts.findCartByGuestSession(actor.guestSessionId)
      : null;

    if (cart) {
      await carts.clearCartItems(cart.id);
      await carts.updateCartRestaurant(cart.id, null);
    }

    return emptyCartView();
  };
