import { z } from "zod";

const MAX_DECIMAL_VALUE = 99999999.99;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive().finite().max(MAX_DECIMAL_VALUE),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().finite().max(MAX_DECIMAL_VALUE).optional(),
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