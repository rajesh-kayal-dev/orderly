import { z } from "zod";

const MAX_DECIMAL_VALUE = 99999999.99;

export const addCartItemSchema = z.object({
  restaurantId: z.string().min(1),
  menuItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

export const updateCartItemQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1),
});

export const cartItemIdParamsSchema = z.object({
  itemId: z.string().min(1),
});