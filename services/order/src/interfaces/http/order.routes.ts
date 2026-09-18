import { Router, type Router as ExpressRouter } from "express";
import { createOrder } from "../../application/order/create-order.js";
import { getOrder } from "../../application/order/get-order.js";
import { listCustomerOrders } from "../../application/order/list-customer-orders.js";
import { cancelOrder } from "../../application/order/cancel-order.js";
import type { OrderEventPublisher } from "../../application/order/order-event.publisher.js";
import type { CartRepository } from "../../domain/order/cart.repository.js";
import type { OrderRepository } from "../../domain/order/order.repository.js";
import type { MenuCatalogClient } from "../../domain/menu-catalog/menu-catalog.client.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
} from "./order.schemas.js";

export interface OrderRouterDeps {
  cartRepository: CartRepository;
  orderRepository: OrderRepository;
  menuCatalogClient: MenuCatalogClient;
  eventPublisher: OrderEventPublisher;
  tokenVerifier: TokenVerifier;
}

export const createOrderRouter = ({
  cartRepository,
  orderRepository,
  menuCatalogClient,
  eventPublisher,
  tokenVerifier,
}: OrderRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createOrderUseCase = createOrder(cartRepository, orderRepository, menuCatalogClient, eventPublisher);
  const getOrderUseCase = getOrder(orderRepository);
  const listCustomerOrdersUseCase = listCustomerOrders(orderRepository);
  const cancelOrderUseCase = cancelOrder(orderRepository, eventPublisher);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.post("/", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createOrderSchema.parse(req.body);
      const order = await createOrderUseCase((req as AuthenticatedRequest).userId, input);
      return void res.status(201).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/", requireAuthMiddleware, async (req, res) => {
    try {
      const query = listOrdersQuerySchema.parse(req.query);
      const result = await listCustomerOrdersUseCase((req as AuthenticatedRequest).userId, query);
      return void res.status(200).json({ success: true, data: result.orders, total: result.total });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await getOrderUseCase((req as AuthenticatedRequest).userId, id);
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/:id/cancel", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = orderIdParamsSchema.parse(req.params);
      const order = await cancelOrderUseCase((req as AuthenticatedRequest).userId, id);
      return void res.status(200).json({ success: true, data: order });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};
