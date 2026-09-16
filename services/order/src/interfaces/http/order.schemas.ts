import { z } from "zod";

const MAX_DECIMAL_VALUE = 99999999.99;

export const deliveryAddressSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  street: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(100),
});

export const createOrderSchema = z.object({
  deliveryAddressId: z.string().min(1).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  notes: z.string().trim().min(1).max(1000).optional(),
  deliveryFee: z.coerce.number().nonnegative().finite().max(MAX_DECIMAL_VALUE).optional(),
});

export const listOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const orderIdParamsSchema = z.object({
  id: z.string().min(1),
});