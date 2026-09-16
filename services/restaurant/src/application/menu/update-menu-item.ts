import { Decimal } from "decimal.js";
import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import { MenuCategoryNotFoundError, MenuItemNotFoundError, RestaurantProfileNotFoundError } from "../restaurant/errors.js";
import type { MenuItem } from "../../domain/menu/menu.types.js";

export interface UpdateMenuItemInput {
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
}

export const updateMenuItem =
  (restaurants: RestaurantRepository, menu: MenuRepository) =>
  async (ownerId: string, menuItemId: string, input: UpdateMenuItemInput): Promise<MenuItem> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    const item = await menu.findMenuItemById(menuItemId);

    if (!item || item.restaurantId !== restaurant.id) {
      throw new MenuItemNotFoundError();
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await menu.findCategoryById(input.categoryId);

      if (!category || category.restaurantId !== restaurant.id) {
        throw new MenuCategoryNotFoundError();
      }
    }

    const data = {
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      isAvailable: input.isAvailable,
      price: input.price === undefined ? undefined : new Decimal(input.price),
      categoryId: input.categoryId,
    };

    const updated = await menu.updateMenuItem(menuItemId, data);

    if (!updated) {
      throw new MenuItemNotFoundError();
    }

    return updated;
  };