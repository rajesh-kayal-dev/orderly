import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { MenuCategoryWithItems } from "../../domain/menu/menu.types.js";

export const getFullMenu =
  (menu: MenuRepository) =>
  async (restaurantId: string): Promise<MenuCategoryWithItems[]> =>
    menu.listCategoriesWithItems(restaurantId);