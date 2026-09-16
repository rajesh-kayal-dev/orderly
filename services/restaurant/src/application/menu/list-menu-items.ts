import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { MenuItem } from "../../domain/menu/menu.types.js";

export const listMenuItems =
  (menu: MenuRepository) =>
  async (restaurantId: string, categoryId?: string): Promise<MenuItem[]> =>
    menu.listMenuItemsByRestaurant(restaurantId, categoryId);