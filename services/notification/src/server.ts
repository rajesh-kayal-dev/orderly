import "dotenv/config";
import express from "express";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaNotificationRepository } from "./infrastructure/database/repositories/prisma-notification.repository.js";
import { createNotificationRouter } from "./interfaces/http/notification.routes.js";
import { ConsoleNotificationProvider } from "./infrastructure/providers/console-notification.provider.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";

const app = express();

const notificationRepository = new PrismaNotificationRepository(prisma);
const notificationProvider = new ConsoleNotificationProvider();
const tokenVerifier = getTokenVerifier();

app.use(express.json());

app.use(
  "/notifications",
  createNotificationRouter({ notificationRepository, notificationProvider, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "notification", status: "ok" });
});

const port = Number(process.env.PORT ?? 3007);

app.listen(port, () => {
  console.log(`Notification service running on port ${port}`);
});
