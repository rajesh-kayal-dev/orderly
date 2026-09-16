import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { RestaurantOwnershipClient } from "../../domain/restaurant-ownership/restaurant-ownership.client.js";
import { OrderForbiddenError, OrderNotFoundError, RestaurantOwnershipError } from "./errors.js";

export const getRestaurantOrder =
  (restaurants: RestaurantOwnershipClient, orders: OrderRepository) =>
  async (ownerId: string, accessToken: string, orderId: string) => {
    const restaurant = await restaurants.getRestaurantByOwner(ownerId, accessToken);

    if (!restaurant) {
      throw new RestaurantOwnershipError();
    }

    const order = await orders.findOrderById(orderId);

    if (!order) {
      throw new OrderNotFoundError();
    }

    if (order.restaurantId !== restaurant.id) {
      throw new OrderForbiddenError();
    }

    return order;
  };