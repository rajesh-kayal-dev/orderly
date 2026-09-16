import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import { MenuItemNotFoundError, RestaurantProfileNotFoundError } from "../restaurant/errors.js";
import type { MenuItem } from "../../domain/menu/menu.types.js";

export const toggleMenuItemAvailability =
  (restaurants: RestaurantRepository, menu: MenuRepository) =>
  async (ownerId: string, menuItemId: string, isAvailable: boolean): Promise<MenuItem> => {
    const restaurant = await restaurants.findByOwnerId(ownerId);

    if (!restaurant) {
      throw new RestaurantProfileNotFoundError();
    }

    const item = await menu.findMenuItemById(menuItemId);

    if (!item || item.restaurantId !== restaurant.id) {
      throw new MenuItemNotFoundError();
    }

    const updated = await menu.updateMenuItemAvailability(menuItemId, isAvailable);

    if (!updated) {
      throw new MenuItemNotFoundError();
    }

    return updated;
  };