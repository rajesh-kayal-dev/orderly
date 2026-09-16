import type {
  ListRestaurantsParams,
  ListRestaurantsResult,
  RestaurantRepository,
} from "../../domain/restaurant/restaurant.repository.js";

export const listRestaurants =
  (restaurants: RestaurantRepository) =>
  async (params: ListRestaurantsParams): Promise<ListRestaurantsResult> =>
    restaurants.list(params);