import { z } from "zod";

export const createMyPartnerSchema = z.object({
  vehicleType: z.string().trim().min(1).max(100).optional(),
  vehicleNumber: z.string().trim().min(1).max(100).optional(),
});

export const updateMyPartnerSchema = z.object({
  vehicleType: z.string().trim().min(1).max(100).nullable().optional(),
  vehicleNumber: z.string().trim().min(1).max(100).nullable().optional(),
});

export const setAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});