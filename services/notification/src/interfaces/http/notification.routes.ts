import { Router, type Router as ExpressRouter } from "express";
import { createNotification } from "../../application/notification/create-notification.js";
import { getMyNotification, getNotification } from "../../application/notification/get-notification.js";
import { listMyNotifications } from "../../application/notification/list-my-notifications.js";
import { readAllNotifications } from "../../application/notification/read-all-notifications.js";
import { readNotification } from "../../application/notification/read-notification.js";
import { sendNotification } from "../../application/notification/send-notification.js";
import type { NotificationProvider } from "../../domain/notification/notification.provider.js";
import type { NotificationRepository } from "../../domain/notification/notification.repository.js";
import type { TokenVerifier } from "../../infrastructure/security/token.js";
import { mapErrorToResponse } from "./error-handler.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./middleware/auth.middleware.js";
import {
  createNotificationSchema,
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "./notification.schemas.js";

export interface NotificationRouterDeps {
  notificationRepository: NotificationRepository;
  notificationProvider: NotificationProvider;
  tokenVerifier: TokenVerifier;
}

export const createNotificationRouter = ({
  notificationRepository,
  notificationProvider,
  tokenVerifier,
}: NotificationRouterDeps): ExpressRouter => {
  const router: ExpressRouter = Router();

  const createNotificationUseCase = createNotification(notificationRepository);
  const getNotificationUseCase = getNotification(notificationRepository);
  const getMyNotificationUseCase = getMyNotification(notificationRepository);
  const listMyNotificationsUseCase = listMyNotifications(notificationRepository);
  const readNotificationUseCase = readNotification(notificationRepository);
  const readAllNotificationsUseCase = readAllNotifications(notificationRepository);
  const sendNotificationUseCase = sendNotification(notificationRepository, notificationProvider);

  const requireAuthMiddleware = requireAuth({ verifyAccessToken: tokenVerifier.verify });
  const requireAdminMiddleware = requireRole("ADMIN");

  router.post("/", requireAuthMiddleware, requireAdminMiddleware, async (req, res) => {
    try {
      const input = createNotificationSchema.parse(req.body);
      const notification = await createNotificationUseCase({
        userId: input.userId,
        channel: input.channel,
        recipient: input.recipient ?? null,
        title: input.title,
        body: input.body,
        metadata: input.metadata ?? null,
      });
      return void res.status(201).json({ success: true, data: notification });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.get("/me", requireAuthMiddleware, async (req, res) => {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const notifications = await listMyNotificationsUseCase(
        (req as AuthenticatedRequest).userId,
        query.status,
      );
      return void res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/me/read-all", requireAuthMiddleware, async (req, res) => {
    try {
      const result = await readAllNotificationsUseCase((req as AuthenticatedRequest).userId);
      return void res.status(200).json({ success: true, data: result });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.put("/me/:id/read", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = notificationIdParamsSchema.parse(req.params);
      const notification = await readNotificationUseCase((req as AuthenticatedRequest).userId, id);
      return void res.status(200).json({ success: true, data: notification });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  router.post(
    "/:id/send",
    requireAuthMiddleware,
    requireAdminMiddleware,
    async (req, res) => {
      try {
        const { id } = notificationIdParamsSchema.parse(req.params);
        const notification = await sendNotificationUseCase(id);
        return void res.status(200).json({ success: true, data: notification });
      } catch (error) {
        return void mapErrorToResponse(res, error);
      }
    },
  );

  router.get("/:id", requireAuthMiddleware, async (req, res) => {
    try {
      const { id } = notificationIdParamsSchema.parse(req.params);
      const { userId, userRole } = req as AuthenticatedRequest;
      const notification =
        userRole === "ADMIN"
          ? await getNotificationUseCase(id)
          : await getMyNotificationUseCase(userId, id);
      return void res.status(200).json({ success: true, data: notification });
    } catch (error) {
      return void mapErrorToResponse(res, error);
    }
  });

  return router;
};