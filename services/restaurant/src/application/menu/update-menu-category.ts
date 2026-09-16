import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import { MenuCategoryNotFoundError, RestaurantProfileNotFoundError } from "../restaurant/errors.js";
import type { MenuCategory } from "../../domain/menu/menu.types.js";

export interface UpdateMenuCategoryInput {
  name?: string;
  sortOrder?: number;
}

export const updateMenuCategory =
  (restaurants: RestaurantRepository, menu: MenuRepository) =>
  async (ownerId: string, categoryId: string, input: UpdateMenuCategoryInput): Promise<MenuCategory> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    const category = await menu.findCategoryById(categoryId);

    if (!category || category.restaurantId !== restaurant.id) {
      throw new MenuCategoryNotFoundError();
    }

    const updated = await menu.updateCategory(categoryId, {
      name: input.name,
      sortOrder: input.sortOrder,
    });

    if (!updated) {
      throw new MenuCategoryNotFoundError();
    }

    return updated;
  };