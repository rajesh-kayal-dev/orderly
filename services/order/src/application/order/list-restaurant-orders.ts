import type { OrderRepository, ListOrdersParams } from "../../domain/order/order.repository.js";
import type { RestaurantOwnershipClient } from "../../domain/restaurant-ownership/restaurant-ownership.client.js";
import { RestaurantOwnershipError } from "./errors.js";

export const listRestaurantOrders =
  (restaurants: RestaurantOwnershipClient, orders: OrderRepository) =>
  async (ownerId: string, accessToken: string, params: ListOrdersParams) => {
    const restaurant = await restaurants.getRestaurantByOwner(ownerId, accessToken);

    if (!restaurant) {
      throw new RestaurantOwnershipError();
    }

    return orders.listOrdersByRestaurant(restaurant.id, params);
  };