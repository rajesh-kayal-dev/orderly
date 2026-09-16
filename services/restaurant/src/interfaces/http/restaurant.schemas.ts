import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createRestaurantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().optional(),
  imageUrl: z.string().optional(),
  opensAt: z.string().regex(timePattern, "Time must be HH:mm").optional(),
  closesAt: z.string().regex(timePattern, "Time must be HH:mm").optional(),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  opensAt: z.string().regex(timePattern, "Time must be HH:mm").nullable().optional(),
  closesAt: z.string().regex(timePattern, "Time must be HH:mm").nullable().optional(),
});

export const listRestaurantsQuerySchema = z.object({
  search: z.string().optional(),
  activeOnly: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const restaurantIdParamsSchema = z.object({
  id: z.string().min(1),
});