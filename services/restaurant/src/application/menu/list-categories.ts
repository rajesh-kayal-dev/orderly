import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { MenuCategory } from "../../domain/menu/menu.types.js";

export const listCategories =
  (menu: MenuRepository) =>
  async (restaurantId: string): Promise<MenuCategory[]> =>
    menu.listCategoriesByRestaurant(restaurantId);