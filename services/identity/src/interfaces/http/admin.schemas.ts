import { z } from "zod";
import { ACCOUNT_STATUSES, type AccountStatus } from "../../domain/user/user.types.js";

const ACCOUNT_STATUS_VALUES = Object.values(ACCOUNT_STATUSES) as [AccountStatus, ...AccountStatus[]];

export const listUsersQuerySchema = z.object({
  status: z.enum(ACCOUNT_STATUS_VALUES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const statusParamsSchema = z.object({
  id: z.string().min(1),
});

export const statusBodySchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const approvalParamsSchema = z.object({
  id: z.string().min(1),
});