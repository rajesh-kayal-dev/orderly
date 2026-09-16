import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../domain/restaurant/restaurant.types.js";
import { RestaurantProfileNotFoundError } from "./errors.js";

export const getRestaurantByOwner =
  (restaurants: RestaurantRepository) =>
  async (ownerId: string): Promise<Restaurant> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    return restaurant;
  };