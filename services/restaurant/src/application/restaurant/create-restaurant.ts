import type { CreateRestaurantData, RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { Restaurant } from "../../domain/restaurant/restaurant.types.js";
import { RestaurantAlreadyExistsError } from "./errors.js";

export interface CreateRestaurantInput extends Omit<CreateRestaurantData, "ownerId"> {}

export const createRestaurant =
  (restaurants: RestaurantRepository) =>
  async (ownerId: string, data: CreateRestaurantInput): Promise<Restaurant> => {
    const existing = await restaurants.findByOwnerId(ownerId);

    if (existing) {
      throw new RestaurantAlreadyExistsError();
    }

    return restaurants.create({ ...data, ownerId });
  };