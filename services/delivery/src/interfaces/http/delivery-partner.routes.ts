import { Router, type Router as ExpressRouter } from "express";
import { createMyDeliveryPartner } from "../../application/delivery-partner/create-my-delivery-partner.js";
import { getMyDeliveryPartner } from "../../application/delivery-partner/get-my-delivery-partner.js";
import { updateMyDeliveryPartner } from "../../application/delivery-partner/update-my-delivery-partner.js";
import { setMyAvailability } from "../../application/delivery-partner/set-my-availability.js";
import type { DeliveryPartnerRepository } from "../../domain/delivery-partner/delivery-partner.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import {
  createMyPartnerSchema,
  setAvailabilitySchema,
  updateMyPartnerSchema,
} from "./delivery-partner.schemas.js";
import { mapErrorToResponse } from "./error-handler.js";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "./middleware/auth.middleware.js";

export interface DeliveryPartnerRouterDeps {
  deliveryPartnerRepository: DeliveryPartnerRepository;
  tokenVerifier: TokenVerifier;
}

export const createDeliveryPartnerRouter = ({
  deliveryPartnerRepository,
  tokenVerifier,
}: DeliveryPartnerRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createMyDeliveryPartnerUseCase = createMyDeliveryPartner(deliveryPartnerRepository);
  const getMyDeliveryPartnerUseCase = getMyDeliveryPartner(deliveryPartnerRepository);
  const updateMyDeliveryPartnerUseCase = updateMyDeliveryPartner(deliveryPartnerRepository);
  const setMyAvailabilityUseCase = setMyAvailability(deliveryPartnerRepository);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });
  const requirePartnerMiddleware = requireRole("DELIVERY_PARTNER");

  router.get("/", async (_req, res) => {
    try {
      const partners = await deliveryPartnerRepository.findAll();
      return void res.status(200).json({ success: true, data: partners });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/me", requireAuthMiddleware, requirePartnerMiddleware, async (req, res) => {
    try {
      const input = createMyPartnerSchema.parse(req.body ?? {});
      const { profile, created } = await createMyDeliveryPartnerUseCase(
        (req as AuthenticatedRequest).userId,
        input,
      );
      return void res.status(created ? 201 : 200).json({ success: true, data: profile });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/me", requireAuthMiddleware, requirePartnerMiddleware, async (req, res) => {
    try {
      const { profile } = await getMyDeliveryPartnerUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: profile });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/me", requireAuthMiddleware, requirePartnerMiddleware, async (req, res) => {
    try {
      const input = updateMyPartnerSchema.parse(req.body);
      const profile = await updateMyDeliveryPartnerUseCase(
        (req as AuthenticatedRequest).userId,
        input,
      );
      return void res.status(200).json({ success: true, data: profile });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put(
    "/me/availability",
    requireAuthMiddleware,
    requirePartnerMiddleware,
    async (req, res) => {
      try {
        const input = setAvailabilitySchema.parse(req.body);
        const profile = await setMyAvailabilityUseCase(
          (req as AuthenticatedRequest).userId,
          input.isAvailable,
        );
        return void res.status(200).json({ success: true, data: profile });
      } catch (error) {
        return void mapErrorToResponse(res, error);
      }
    },
  );

  return router;
};