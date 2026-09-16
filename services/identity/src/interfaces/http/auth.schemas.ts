import { z } from "zod";

export const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(100),
});

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