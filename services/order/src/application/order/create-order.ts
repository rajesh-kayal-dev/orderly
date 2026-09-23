import { Decimal } from "decimal.js";
import type { CartRepository } from "../../domain/order/cart.repository.js";
import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { ContactInfoSnapshot, DeliveryAddressSnapshot, Order, PaymentMethod } from "../../domain/order/order.types.js";
import type { MenuCatalogClient } from "../../domain/menu-catalog/menu-catalog.client.js";
import type { OrderEventPublisher } from "./order-event.publisher.js";
import {
  CartEmptyError,
  MenuItemNotFoundError,
  MenuItemUnavailableError,
  RestaurantClosedError,
  RestaurantNotFoundError,
} from "./errors.js";

export interface OrderActor {
  customerId?: string | null;
  guestSessionId?: string | null;
}

export type OrderActorParam = string | OrderActor;

export interface CreateOrderInput {
  deliveryAddressId?: string;
  deliveryAddress?: DeliveryAddressSnapshot;
  contactInfo?: ContactInfoSnapshot;
  deliveryFee?: number | string | Decimal;
  notes?: string;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
}

export const createOrder =
  (carts: CartRepository, orders: OrderRepository, catalog: MenuCatalogClient, eventPublisher: OrderEventPublisher) =>
  async (actor: OrderActorParam, input: CreateOrderInput): Promise<Order> => {
    const customerId = typeof actor === "string" ? actor : actor.customerId;
    const guestSessionId = typeof actor === "string" ? null : actor.guestSessionId;

    // 1. Idempotency protection: if key already exists, return existing order to avoid duplicate billing
    if (input.idempotencyKey) {
      const existing = await orders.findOrderByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // 2. Locate cart for customer or guest session
    const cart = customerId
      ? await carts.findCartByCustomer(customerId)
      : guestSessionId
      ? await carts.findCartByGuestSession(guestSessionId)
      : null;

    if (!cart || cart.items.length === 0) {
      throw new CartEmptyError();
    }

    const restaurantId = cart.restaurantId;
    if (!restaurantId) {
      throw new CartEmptyError();
    }

    // 3. Verify restaurant status
    const restaurant = await catalog.getRestaurant(restaurantId);
    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }
    if (!restaurant.isOpen) {
      throw new RestaurantClosedError();
    }

    // 4. Server-Side Price & Total Calculation from Trusted Catalog Data
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

      // Calculate strictly from trusted server catalog price
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

    // Server-side delivery fee calculation (defaults to 0 if not provided)
    const deliveryFee =
      input.deliveryFee !== undefined ? new Decimal(input.deliveryFee.toString()) : new Decimal(0);
    const totalAmount = subtotal.plus(deliveryFee);

    // 5. Persist order with immutable contact and delivery snapshots
    const order = await orders.createOrder({
      customerId: customerId ?? null,
      guestSessionId: guestSessionId ?? null,
      restaurantId,
      deliveryAddressId: input.deliveryAddressId ?? null,
      deliveryAddress: input.deliveryAddress ?? null,
      contactInfo: input.contactInfo ?? null,
      notes: input.notes ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      paymentMethod: input.paymentMethod ?? "cod",
      subtotal,
      deliveryFee,
      totalAmount,
      items: orderItems,
    });

    // 6. Publish OrderPlaced event
    await eventPublisher.publishOrderPlaced(order);

    // 7. Clear cart items
    await carts.clearCartItems(cart.id);
    await carts.updateCartRestaurant(cart.id, null);

    const freshOrder = await orders.findOrderById(order.id);
    return freshOrder!;
  };
