import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, emptyCartView, type CartView } from "../../domain/order/cart.types.js";
import type { OrderActor } from "../order/create-order.js";

export const getCart =
  (carts: CartRepository) =>
  async (actor: OrderActor): Promise<CartView> => {
    const cart = actor.customerId
      ? await carts.findCartByCustomer(actor.customerId)
      : actor.guestSessionId
      ? await carts.findCartByGuestSession(actor.guestSessionId)
      : null;

    if (!cart) {
      return emptyCartView();
    }

    return cartToView(cart);
  };
