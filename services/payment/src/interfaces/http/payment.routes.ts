import { Router, type Router as ExpressRouter } from "express";
import { Decimal } from "decimal.js";
import { createPayment } from "../../application/payment/create-payment.js";
import { getPayment } from "../../application/payment/get-payment.js";
import { getPaymentByOrder } from "../../application/payment/get-payment-by-order.js";
import { verifyPayment } from "../../application/payment/verify-payment.js";
import type { OrderClient } from "../../domain/order/order.client.js";
import type { PaymentProvider } from "../../domain/payment/payment.provider.js";
import type { PaymentRepository } from "../../domain/payment/payment.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  createPaymentSchema,
  orderIdParamsSchema,
  paymentIdParamsSchema,
  verifyPaymentSchema,
} from "./payment.schemas.js";

export interface PaymentRouterDeps {
  paymentRepository: PaymentRepository;
  paymentProvider: PaymentProvider | null;
  orderClient: OrderClient | null;
  tokenVerifier: TokenVerifier;
}

export const createPaymentRouter = ({
  paymentRepository,
  paymentProvider,
  orderClient,
  tokenVerifier,
}: PaymentRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createPaymentUseCase = createPayment({
    payments: paymentRepository,
    provider: paymentProvider,
    orderClient,
  });
  const getPaymentUseCase = getPayment(paymentRepository);
  const getPaymentByOrderUseCase = getPaymentByOrder(paymentRepository);
  const verifyPaymentUseCase = verifyPayment({
    payments: paymentRepository,
    provider: paymentProvider,
    orderClient,
  });
  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });

  router.post("/", requireAuthMiddleware, async (req, res) => {
    try {
      const input = createPaymentSchema.parse(req.body);
      const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
      const payment = await createPaymentUseCase(
        (req as AuthenticatedRequest).userId,
        {
          orderId: input.orderId,
          amount: new Decimal(input.amount),
          currency: input.currency,
          method: input.method,
        },
        token,
      );
      return void res.status(201).json({ success: true, data: payment });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post("/:id/verify", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = paymentIdParamsSchema.parse(req.params);
      const input = verifyPaymentSchema.parse(req.body);
      const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
      const payment = await verifyPaymentUseCase(
        (req as AuthenticatedRequest).userId,
        id,
        token,
        {
          providerReference: input.razorpay_order_id,
          providerPaymentId: input.razorpay_payment_id,
          providerPaymentSignature: input.razorpay_signature,
        },
      );
      return void res.status(200).json({ success: true, data: payment });
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