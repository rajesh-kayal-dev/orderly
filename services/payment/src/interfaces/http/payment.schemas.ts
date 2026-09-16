import { z } from "zod";

const MAX_DECIMAL_VALUE = 99999999.99;

export const createPaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().positive().finite().max(MAX_DECIMAL_VALUE),
  currency: z.string().trim().min(1).max(10).default("INR"),
  method: z.enum(["cod", "online"]).default("cod"),
});

export const paymentIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const orderIdParamsSchema = z.object({
  orderId: z.string().min(1),
});