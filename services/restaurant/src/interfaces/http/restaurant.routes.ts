import { Router, type Router as ExpressRouter } from "express";
import { createRestaurant } from "../../application/restaurant/create-restaurant.js";
import { getRestaurant } from "../../application/restaurant/get-restaurant.js";
import { getRestaurantByOwner } from "../../application/restaurant/get-restaurant-by-owner.js";
import { listRestaurants } from "../../application/restaurant/list-restaurants.js";
import { updateRestaurant } from "../../application/restaurant/update-restaurant.js";
import { openRestaurant } from "../../application/restaurant/open-restaurant.js";
import { closeRestaurant } from "../../application/restaurant/close-restaurant.js";
import type { RestaurantRepository } from "../../domain/restaurant/restaurant.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  createRestaurantSchema,
  listRestaurantsQuerySchema,
  restaurantIdParamsSchema,
  updateRestaurantSchema,
} from "./restaurant.schemas.js";

export interface RestaurantRouterDeps {
  restaurantRepository: RestaurantRepository;
  tokenVerifier: TokenVerifier;
}

export const createRestaurantRouter = ({
  restaurantRepository,
  tokenVerifier,
}: RestaurantRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createRestaurantUseCase = createRestaurant(restaurantRepository);
  const getRestaurantUseCase = getRestaurant(restaurantRepository);
  const getRestaurantByOwnerUseCase = getRestaurantByOwner(restaurantRepository);
  const listRestaurantsUseCase = listRestaurants(restaurantRepository);
  const updateRestaurantUseCase = updateRestaurant(restaurantRepository);
  const openRestaurantUseCase = openRestaurant(restaurantRepository);
  const closeRestaurantUseCase = closeRestaurant(restaurantRepository);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.get("/my-profile", requireAuthMiddleware, async (req, res) => {
    try {
      const restaurant = await getRestaurantByOwnerUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/my-profile", requireAuthMiddleware, async (req, res) => {
    try {
      const input = updateRestaurantSchema.parse(req.body);
      const restaurant = await updateRestaurantUseCase((req as AuthenticatedRequest).userId, input);
      return void res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/my-profile/open", requireAuthMiddleware, async (req, res) => {
    try {
      const restaurant = await openRestaurantUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/my-profile/close", requireAuthMiddleware, async (req, res) => {
    try {
      const restaurant = await closeRestaurantUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/", async (req, res) => {
    try {
      const input = listRestaurantsQuerySchema.parse(req.query);
      const result = await listRestaurantsUseCase({
        search: input.search,
        activeOnly: input.activeOnly === "true",
        limit: input.limit,
        offset: input.offset,
      });
      return void res.status(200).json({ success: true, data: result.restaurants, total: result.total });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createRestaurantSchema.parse(req.body);
      const restaurant = await createRestaurantUseCase((req as AuthenticatedRequest).userId, input);
      return void res.status(201).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = restaurantIdParamsSchema.parse(req.params);
      const restaurant = await getRestaurantUseCase(id);
      return void res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};