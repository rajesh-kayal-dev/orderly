import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import { RestaurantProfileNotFoundError } from "../restaurant/errors.js";
import type { MenuCategory } from "../../domain/menu/menu.types.js";

export interface CreateMenuCategoryInput {
  name: string;
  sortOrder?: number;
}

export const createCategory =
  (restaurants: RestaurantRepository, menu: MenuRepository) =>
  async (ownerId: string, input: CreateMenuCategoryInput): Promise<MenuCategory> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    return menu.createCategory({
      restaurantId: restaurant.id,
      name: input.name,
      sortOrder: input.sortOrder,
    });
  };