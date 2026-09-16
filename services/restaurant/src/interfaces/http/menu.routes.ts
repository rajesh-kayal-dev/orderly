import { Router, type Router as ExpressRouter } from "express";
import { createCategory } from "../../application/menu/create-category.js";
import { listCategories } from "../../application/menu/list-categories.js";
import { getFullMenu } from "../../application/menu/get-full-menu.js";
import { createMenuItem } from "../../application/menu/create-menu-item.js";
import { listMenuItems } from "../../application/menu/list-menu-items.js";
import { updateMenuItem } from "../../application/menu/update-menu-item.js";
import { updateMenuCategory } from "../../application/menu/update-menu-category.js";
import { toggleMenuItemAvailability } from "../../application/menu/toggle-menu-item-availability.js";
import type { MenuRepository } from "../../domain/menu/menu.repository.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  categoryIdParamsSchema,
  createCategorySchema,
  createMenuItemSchema,
  listMenuItemsQuerySchema,
  menuItemIdParamsSchema,
  toggleAvailabilityBodySchema,
  updateCategorySchema,
  updateMenuItemSchema,
} from "./menu.schemas.js";

export interface MenuRouterDeps {
  restaurantRepository: RestaurantRepository;
  menuRepository: MenuRepository;
  tokenVerifier: TokenVerifier;
}

export const createMenuRouter = ({
  restaurantRepository,
  menuRepository,
  tokenVerifier,
}: MenuRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createCategoryUseCase = createCategory(restaurantRepository, menuRepository);
  const listCategoriesUseCase = listCategories(menuRepository);
  const getFullMenuUseCase = getFullMenu(menuRepository);
  const createMenuItemUseCase = createMenuItem(restaurantRepository, menuRepository);
  const listMenuItemsUseCase = listMenuItems(menuRepository);
  const updateMenuItemUseCase = updateMenuItem(restaurantRepository, menuRepository);
  const updateMenuCategoryUseCase = updateMenuCategory(restaurantRepository, menuRepository);
  const toggleAvailabilityUseCase = toggleMenuItemAvailability(restaurantRepository, menuRepository);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.post("/categories", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createCategorySchema.parse(req.body);
      const category = await createCategoryUseCase((req as AuthenticatedRequest).userId, input);
      return void res.status(201).json({ success: true, data: category });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/categories/:restaurantId", async (req, res) => {
    try {
      const categories = await listCategoriesUseCase(req.params.restaurantId!);
      return void res.status(200).json({ success: true, data: categories });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/categories/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = categoryIdParamsSchema.parse(req.params);
      const input = updateCategorySchema.parse(req.body);
      const category = await updateMenuCategoryUseCase((req as AuthenticatedRequest).userId, id, input);
      return void res.status(200).json({ success: true, data: category });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/full/:restaurantId", async (req, res) => {
    try {
      const fullMenu = await getFullMenuUseCase(req.params.restaurantId!);
      return void res.status(200).json({ success: true, data: fullMenu });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/", async (req, res) => {
    try {
      const input = listMenuItemsQuerySchema.parse(req.query);
      const items = await listMenuItemsUseCase(input.restaurantId, input.categoryId);
      return void res.status(200).json({ success: true, data: items });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createMenuItemSchema.parse(req.body);
      const item = await createMenuItemUseCase((req as AuthenticatedRequest).userId, input);
      return void res.status(201).json({ success: true, data: item });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = menuItemIdParamsSchema.parse(req.params);
      const input = updateMenuItemSchema.parse(req.body);
      const item = await updateMenuItemUseCase((req as AuthenticatedRequest).userId, id, input);
      return void res.status(200).json({ success: true, data: item });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.patch("/:id/toggle-availability", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = menuItemIdParamsSchema.parse(req.params);
      const input = toggleAvailabilityBodySchema.parse(req.body);
      const item = await toggleAvailabilityUseCase(
        (req as AuthenticatedRequest).userId,
        id,
        input.isAvailable,
      );
      return void res.status(200).json({ success: true, data: item });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};