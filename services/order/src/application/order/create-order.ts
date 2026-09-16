import { Decimal } from "decimal.js";
import type { CartRepository } from "../../domain/order/cart.repository.js";
import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { Order } from "../../domain/order/order.types.js";
import type { MenuCatalogClient } from "../../domain/menu-catalog/menu-catalog.client.js";
import {
  CartEmptyError,
  MenuItemNotFoundError,
  MenuItemUnavailableError,
  RestaurantClosedError,
  RestaurantNotFoundError,
} from "./errors.js";

export interface CreateOrderInput {
  deliveryAddressId?: string;
  deliveryAddress?: { label?: string; street: string; city: string };
  notes?: string;
  deliveryFee?: number;
}

export const createOrder =
  (carts: CartRepository, orders: OrderRepository, catalog: MenuCatalogClient) =>
  async (customerId: string, input: CreateOrderInput): Promise<Order> => {
    const cart = await carts.findCartByCustomer(customerId);

    if (!cart || cart.items.length === 0) {
      throw new CartEmptyError();
    }

    const restaurantId = cart.restaurantId;

    if (!restaurantId) {
      throw new CartEmptyError();
    }

    const restaurant = await catalog.getRestaurant(restaurantId);

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    if (!restaurant.isOpen) {
      throw new RestaurantClosedError();
    }

    const menuItems = await catalog.listMenuItems(restaurantId);
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    let subtotal = new Decimal(0);

    const orderItems = cart.items.map((cartItem) => {
      const menuItem = menuItemsById.get(cartItem.menuItemId);

      if (!menuItem) {
        throw new MenuItemNotFoundError();
      }

      if (!menuItem.isAvailable) {
        throw new MenuItemUnavailableError();
      }

      const unitPrice = new Decimal(menuItem.price.toString());
      const itemSubtotal = unitPrice.mul(cartItem.quantity);
      subtotal = subtotal.plus(itemSubtotal);

      return {
        menuItemId: cartItem.menuItemId,
        menuItemName: menuItem.name,
        quantity: cartItem.quantity,
        unitPrice,
        subtotal: itemSubtotal,
      };
    });

    const deliveryFee = new Decimal(input.deliveryFee ?? 0);
    const totalAmount = subtotal.plus(deliveryFee);

    const order = await orders.createOrder({
      customerId,
      restaurantId,
      deliveryAddressId: input.deliveryAddressId ?? null,
      deliveryAddress: (input.deliveryAddress as unknown) ?? null,
      notes: input.notes ?? null,
      subtotal,
      deliveryFee,
      totalAmount,
      items: orderItems,
    });

    await carts.clearCartItems(cart.id);
    await carts.updateCartRestaurant(cart.id, null);

    return orders.findOrderById(order.id).then((o) => o!);
  };