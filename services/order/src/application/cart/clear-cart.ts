import type { CartRepository } from "../../domain/order/cart.repository.js";
import { emptyCartView, type CartView } from "../../domain/order/cart.types.js";

export const clearCart =
  (carts: CartRepository) =>
  async (customerId: string): Promise<CartView> => {
    const cart = await carts.findCartByCustomer(customerId);

    if (cart) {
      await carts.clearCartItems(cart.id);
      await carts.updateCartRestaurant(cart.id, null);
    }

    return emptyCartView();
  };