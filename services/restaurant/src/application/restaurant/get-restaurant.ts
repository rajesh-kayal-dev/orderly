import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../domain/restaurant/restaurant.types.js";
import { RestaurantNotFoundError } from "./errors.js";

export const getRestaurant =
  (restaurants: RestaurantRepository) =>
  async (id: string): Promise<Restaurant> => {
    const restaurant = await restaurants.findById(id);

    if (!restaurant) {
      throw new RestaurantNotFoundError();
    }

    return restaurant;
  };