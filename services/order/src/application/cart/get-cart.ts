import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, emptyCartView, type CartView } from "../../domain/order/cart.types.js";

export const getCart =
  (carts: CartRepository) =>
  async (customerId: string): Promise<CartView> => {
    const cart = await carts.findCartByCustomer(customerId);

    if (!cart) {
      return emptyCartView();
    }

    return cartToView(cart);
  };