import type { CartRepository } from "../../domain/order/cart.repository.js";
import { cartToView, MAX_QUANTITY, type CartView } from "../../domain/order/cart.types.js";
import type { MenuCatalogClient } from "../../domain/menu-catalog/menu-catalog.client.js";
import {
  CartItemQuantityLimitError,
  MenuItemNotFoundError,
  MenuItemUnavailableError,
  RestaurantClosedError,
  RestaurantNotFoundError,
} from "../order/errors.js";

export interface AddCartItemInput {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
}

export const addCartItem =
  (carts: CartRepository, catalog: MenuCatalogClient) =>
  async (customerId: string, input: AddCartItemInput): Promise<CartView> => {
    const restaurant = await catalog.getRestaurant(input.restaurantId);

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    if (!restaurant.isOpen) {
      throw new RestaurantClosedError();
    }

    const menuItems = await catalog.listMenuItems(input.restaurantId);
    const menuItem = menuItems.find((item) => item.id === input.menuItemId);

    if (!menuItem) {
      throw new MenuItemNotFoundError();
    }

    if (!menuItem.isAvailable) {
      throw new MenuItemUnavailableError();
    }

    let cart = await carts.findCartByCustomer(customerId);

    if (!cart) {
      cart = await carts.createCart(customerId, input.restaurantId);
    } else if (cart.restaurantId !== input.restaurantId) {
      await carts.clearCartItems(cart.id);
      await carts.updateCartRestaurant(cart.id, input.restaurantId);
      cart = await carts.findCartById(cart.id);

      if (!cart) {
        throw new Error("Cart not found after switching restaurant");
      }
    }

    const existing = await carts.findCartItem(cart.id, input.menuItemId);
    const nextQuantity = existing ? existing.quantity + input.quantity : input.quantity;

    if (nextQuantity > MAX_QUANTITY) {
      throw new CartItemQuantityLimitError(MAX_QUANTITY);
    }

    if (existing) {
      await carts.setCartItemQuantity(existing.id, nextQuantity);
    } else {
      await carts.createCartItem(cart.id, input.menuItemId, input.quantity);
    }

    const updated = await carts.findCartById(cart.id);

    if (!updated) {
      throw new Error("Cart not found after adding item");
    }

    return cartToView(updated);
  };