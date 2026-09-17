import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().trim().min(1).max(100),
  channel: z.enum(["in_app", "email", "sms", "push"]).default("in_app"),
  recipient: z.string().trim().min(1).max(320).nullable().optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const listNotificationsQuerySchema = z.object({
  status: z.enum(["pending", "sent", "failed"]).optional(),
});