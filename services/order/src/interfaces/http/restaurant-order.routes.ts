import { Router, type Router as ExpressRouter } from "express";
import {
  acceptOrder,
  markReady,
  rejectOrder,
  startPreparing,
  type UpdateRestaurantOrderStatusDeps,
} from "../../application/order/restaurant-order-actions.js";
import { getRestaurantOrder } from "../../application/order/get-restaurant-order.js";
import { listRestaurantOrders } from "../../application/order/list-restaurant-orders.js";
import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { RestaurantOwnershipClient } from "../../domain/restaurant-ownership/restaurant-ownership.client.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import { listOrdersQuerySchema, orderIdParamsSchema } from "./order.schemas.js";

export interface RestaurantOrderRouterDeps extends UpdateRestaurantOrderStatusDeps {
  orderRepository: OrderRepository;
  restaurantOwnershipClient: RestaurantOwnershipClient;
  tokenVerifier: TokenVerifier;
}

const getAccessToken = (req: AuthenticatedRequest): string => {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
};

export const createRestaurantOrderRouter = ({
  orderRepository,
  restaurantOwnershipClient,
  tokenVerifier,
}: RestaurantOrderRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const deps: UpdateRestaurantOrderStatusDeps = { restaurantOwnershipClient, orderRepository };
  const getOrderUseCase = getRestaurantOrder(restaurantOwnershipClient, orderRepository);
  const listOrdersUseCase = listRestaurantOrders(restaurantOwnershipClient, orderRepository);
  const acceptOrderUseCase = acceptOrder(deps);
  const rejectOrderUseCase = rejectOrder(deps);
  const startPreparingUseCase = startPreparing(deps);
  const markReadyUseCase = markReady(deps);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.get("/", requireAuthMiddleware, async (req, res) => {
    try {
      const query = listOrdersQuerySchema.parse(req.query);
      const result = await listOrdersUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        query,
      );
      return void res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await getOrderUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        id,
      );
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id/accept", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await acceptOrderUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        id,
      );
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id/reject", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await rejectOrderUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        id,
      );
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id/preparing", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await startPreparingUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        id,
      );
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id/ready", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await markReadyUseCase(
        (req as AuthenticatedRequest).userId,
        getAccessToken(req as AuthenticatedRequest),
        id,
      );
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};