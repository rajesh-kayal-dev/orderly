import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive().finite(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().finite().optional(),
  imageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export const listMenuItemsQuerySchema = z.object({
  restaurantId: z.string().min(1),
  categoryId: z.string().optional(),
});

export const menuItemIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const toggleAvailabilityBodySchema = z.object({
  isAvailable: z.boolean(),
});