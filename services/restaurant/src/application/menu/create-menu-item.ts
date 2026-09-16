import { Decimal } from "decimal.js";
import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import { MenuCategoryNotFoundError, RestaurantProfileNotFoundError } from "../restaurant/errors.js";
import type { MenuItem } from "../../domain/menu/menu.types.js";

export interface CreateMenuItemInput {
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

export const createMenuItem =
  (restaurants: RestaurantRepository, menu: MenuRepository) =>
  async (ownerId: string, input: CreateMenuItemInput): Promise<MenuItem> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    if (input.categoryId !== undefined) {
      const category = await menu.findCategoryById(input.categoryId);

      if (!category || category.restaurantId !== restaurant.id) {
        throw new MenuCategoryNotFoundError();
      }
    }

    return menu.createMenuItem({
      restaurantId: restaurant.id,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: new Decimal(input.price),
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
    });
  };