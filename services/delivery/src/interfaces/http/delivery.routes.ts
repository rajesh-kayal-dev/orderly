import { Router, type Router as ExpressRouter } from "express";
import { acceptDelivery } from "../../application/delivery/accept-delivery.js";
import { createDelivery } from "../../application/delivery/create-delivery.js";
import { getDelivery } from "../../application/delivery/get-delivery.js";
import { getDeliveryByOrder } from "../../application/delivery/get-delivery-by-order.js";
import { listMyDeliveries } from "../../application/delivery/list-my-deliveries.js";
import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { DeliveryRepository } from "../../domain/delivery/delivery.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  createDeliverySchema,
  deliveryIdParamsSchema,
  deliveryOrderParamsSchema,
} from "./delivery.schemas.js";

export interface DeliveryRouterDeps {
  deliveryRepository: DeliveryRepository;
  deliveryPartnerRepository: DeliveryPartnerRepository;
  tokenVerifier: TokenVerifier;
}

export const createDeliveryRouter = ({
  deliveryRepository,
  deliveryPartnerRepository,
  tokenVerifier,
}: DeliveryRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createDeliveryUseCase = createDelivery(deliveryRepository);
  const getDeliveryUseCase = getDelivery(deliveryRepository);
  const getDeliveryByOrderUseCase = getDeliveryByOrder(deliveryRepository);
  const listMyDeliveriesUseCase = listMyDeliveries(
    deliveryRepository,
    deliveryPartnerRepository,
  );
  const acceptDeliveryUseCase = acceptDelivery(deliveryRepository, deliveryPartnerRepository);

  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });
  const requireAdminMiddleware = requireRole("ADMIN");
  const requirePartnerMiddleware = requireRole("DELIVERY_PARTNER");
  const requireAdminOrPartnerMiddleware = requireRole("ADMIN", "DELIVERY_PARTNER");

  router.post("/", requireAuthMiddleware, requireAdminMiddleware, async (req, res) => {
    try {
      const input = createDeliverySchema.parse(req.body);
      const delivery = await createDeliveryUseCase(input.orderId);
      return void res.status(201).json({ success: true, data: delivery });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/me/accept/:id", requireAuthMiddleware, requirePartnerMiddleware, async (req, res) => {
    try {
      const { id } = deliveryIdParamsSchema.parse(req.params);
      const delivery = await acceptDeliveryUseCase((req as AuthenticatedRequest).userId, id);
      return void res.status(200).json({ success: true, data: delivery });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/me", requireAuthMiddleware, requirePartnerMiddleware, async (req, res) => {
    try {
      const deliveries = await listMyDeliveriesUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: deliveries });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get(
    "/order/:orderId",
    requireAuthMiddleware,
    requireAdminMiddleware,
    async (req, res) => {
      try {
        const { orderId } = deliveryOrderParamsSchema.parse(req.params);
        const delivery = await getDeliveryByOrderUseCase(orderId);
        return void res.status(200).json({ success: true, data: delivery });
      } catch (error) {
        return void mapErrorToResponse(res, error);
      }
    },
  );

  router.get(
    "/:id",
    requireAuthMiddleware,
    requireAdminOrPartnerMiddleware,
    async (req, res) => {
      try {
        const { id } = deliveryIdParamsSchema.parse(req.params);
        const delivery = await getDeliveryUseCase(id);
        return void res.status(200).json({ success: true, data: delivery });
      } catch (error) {
        return void mapErrorToResponse(res, error);
      }
    },
  );

  return router;
};