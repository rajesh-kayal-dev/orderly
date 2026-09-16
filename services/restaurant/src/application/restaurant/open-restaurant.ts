import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../domain/restaurant/restaurant.types.js";
import { RestaurantNotFoundError, RestaurantProfileNotFoundError } from "./errors.js";

export const openRestaurant =
  (restaurants: RestaurantRepository) =>
  async (ownerId: string): Promise<Restaurant> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    const updated = await restaurants.updateOpenState(restaurant.id, true);

    if (!updated) {
      throw new RestaurantNotFoundError();
    }

    return updated;
  };