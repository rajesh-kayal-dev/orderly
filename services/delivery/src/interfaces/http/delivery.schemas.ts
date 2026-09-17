import { z } from "zod";

export const createDeliverySchema = z.object({
  orderId: z.string().trim().min(1).max(100),
});

export const deliveryIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const deliveryOrderParamsSchema = z.object({
  orderId: z.string().min(1),
});