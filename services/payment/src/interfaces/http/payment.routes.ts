import { Router, type Router as ExpressRouter } from "express";
import { Decimal } from "decimal.js";
import { createPayment } from "../../application/payment/create-payment.js";
import { getPayment } from "../../application/payment/get-payment.js";
import { getPaymentByOrder } from "../../application/payment/get-payment-by-order.js";
import type { PaymentProvider } from "../../domain/payment/payment.provider.js";
import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import { createPaymentSchema, orderIdParamsSchema, paymentIdParamsSchema } from "./payment.schemas.js";

export interface PaymentRouterDeps {
  paymentRepository: PaymentRepository;
  paymentProvider: PaymentProvider | null;
  tokenVerifier: TokenVerifier;
}

export const createPaymentRouter = ({
  paymentRepository,
  paymentProvider,
  tokenVerifier,
}: PaymentRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createPaymentUseCase = createPayment({ payments: paymentRepository, provider: paymentProvider });
  const getPaymentUseCase = getPayment(paymentRepository);
  const getPaymentByOrderUseCase = getPaymentByOrder(paymentRepository);
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.post("/", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createPaymentSchema.parse(req.body);
      const payment = await createPaymentUseCase((req as AuthenticatedRequest).userId, {
        orderId: input.orderId,
        amount: new Decimal(input.amount),
        currency: input.currency,
        method: input.method,
      });
      return void res.status(201).json({ success: true, data: payment });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = paymentIdParamsSchema.parse(req.params);
      const payment = await getPaymentUseCase((req as AuthenticatedRequest).userId, id);
      return void res.status(200).json({ success: true, data: payment });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/order/:orderId", requireAuthMiddleware, async (req, res) => {
    try {
      const { orderId } = orderIdParamsSchema.parse(req.params);
      const payment = await getPaymentByOrderUseCase((req as AuthenticatedRequest).userId, orderId);
      return void res.status(200).json({ success: true, data: payment });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};