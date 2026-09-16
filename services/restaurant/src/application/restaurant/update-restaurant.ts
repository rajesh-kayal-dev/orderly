import type { RestaurantRepository, UpdateRestaurantData } from "../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../domain/restaurant/restaurant.types.js";
import { RestaurantNotFoundError, RestaurantProfileNotFoundError } from "./errors.js";

export const updateRestaurant =
  (restaurants: RestaurantRepository) =>
  async (ownerId: string, data: UpdateRestaurantData): Promise<Restaurant> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    const updated = await restaurants.update(restaurant.id, data);

    if (!updated) {
      throw new RestaurantNotFoundError();
    }

    return updated;
  };