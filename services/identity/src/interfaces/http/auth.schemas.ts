import { z } from "zod";

export const registerUserSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
    fullName: z.string().trim().min(2).max(100).optional(),
    full_name: z.string().trim().min(2).max(100).optional(),
    phoneNumber: z.string().trim().max(20).nullish(),
    phone_number: z.string().trim().max(20).nullish(),
    role: z.enum(["CUSTOMER", "RESTAURANT", "DELIVERY_PARTNER", "ADMIN", "CUSTOMER_SUPPORT", "customer", "restaurant", "delivery_partner", "admin", "customer_support"]).optional(),
  })
  .refine((data) => data.fullName !== undefined || data.full_name !== undefined, {
    message: "Full name is required",
  })
  .transform((data) => ({
    email: data.email,
    password: data.password,
    fullName: (data.fullName || data.full_name)!.trim(),
    phoneNumber: data.phoneNumber || data.phone_number || null,
    role: data.role ? (data.role.toUpperCase() as any) : undefined,
  }));

export const loginUserSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phoneNumber: z.string().trim().max(20).nullish(),
  })
  .refine((data) => data.fullName !== undefined || data.phoneNumber !== undefined, {
    message: "At least one field must be provided",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});