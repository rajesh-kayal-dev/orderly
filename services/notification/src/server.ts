import "dotenv/config";
import express from "express";
import { ServiceName, consumerGroupId } from "@orderly/contracts";
import { createKafka, createEventConsumer, defineEventsConfig } from "@orderly/events";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaNotificationRepository } from "./infrastructure/database/repositories/prisma-notification.repository.js";
import { createNotificationRouter } from "./interfaces/http/notification.routes.js";
import { ConsoleNotificationProvider } from "./infrastructure/providers/console-notification.provider.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";
import { NotificationEventHandler } from "./application/events/notification-event.handler.js";
import { KafkaNotificationConsumer } from "./infrastructure/events/kafka-notification.consumer.js";

const app = express();

const notificationRepository = new PrismaNotificationRepository(prisma);
const notificationProvider = new ConsoleNotificationProvider();
const tokenVerifier = getTokenVerifier();

const kafka = createKafka(
  defineEventsConfig({ clientId: process.env.KAFKA_CLIENT_ID ?? "notification-service" }),
);
const orderlyConsumer = createEventConsumer(kafka);
const eventHandler = new NotificationEventHandler(notificationRepository, notificationProvider);
const kafkaNotificationConsumer = new KafkaNotificationConsumer(
  orderlyConsumer,
  eventHandler,
  consumerGroupId(ServiceName.Notification, "events"),
);

app.use(express.json());

app.use(
  "/notifications",
  createNotificationRouter({ notificationRepository, notificationProvider, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "notification", status: "ok" });
});

const port = Number(process.env.PORT ?? 3007);

async function start(): Promise<void> {
  await kafkaNotificationConsumer.start();
  app.listen(port, () => {
    console.log(`Notification service running on port ${port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Notification service received ${signal}; disconnecting Kafka consumer`);
  await kafkaNotificationConsumer.stop().catch((error: unknown) => {
    console.error("Notification service failed to disconnect Kafka consumer", error);
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start().catch((error: unknown) => {
  console.error("Notification service failed to start Kafka consumer", error);
  process.exitCode = 1;
});
