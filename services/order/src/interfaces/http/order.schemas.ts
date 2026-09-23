import { z } from "zod";

export const deliveryAddressSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  street: z.string().trim().min(1).max(500),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const contactInfoSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phoneNumber: z.string().trim().min(5).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export const createOrderSchema = z.object({
  deliveryAddressId: z.string().min(1).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  contactInfo: contactInfoSchema.optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["cod", "online", "vnpay", "razorpay"]).optional(),
  idempotencyKey: z.string().trim().min(1).max(128).optional(),
});

export const listOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const orderIdParamsSchema = z.object({
  id: z.string().min(1),
});
