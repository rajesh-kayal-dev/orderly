import "dotenv/config";
import express from "express";
import { ServiceName } from "@orderly/contracts";
import { createKafka, createProducer, defineEventsConfig, ensureTopics } from "@orderly/events";
import { createCartRouter } from "./interfaces/http/cart.routes.js";
import { createOrderRouter } from "./interfaces/http/order.routes.js";
import { createRestaurantOrderRouter } from "./interfaces/http/restaurant-order.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaCartRepository } from "./infrastructure/database/repositories/prisma-cart.repository.js";
import { PrismaOrderRepository } from "./infrastructure/database/repositories/prisma-order.repository.js";
import { HttpMenuCatalogClient } from "./infrastructure/http/http-menu-catalog.client.js";
import { HttpRestaurantOwnershipClient } from "./infrastructure/http/http-restaurant-ownership.client.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";
import { KafkaOrderEventPublisher } from "./infrastructure/events/kafka-order-event.publisher.js";

const app = express();

const cartRepository = new PrismaCartRepository(prisma);
const orderRepository = new PrismaOrderRepository(prisma);
const menuCatalogClient = new HttpMenuCatalogClient(
  process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3003",
);
const restaurantOwnershipClient = new HttpRestaurantOwnershipClient(
  process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3003",
);
const tokenVerifier = getTokenVerifier();
const kafka = createKafka(defineEventsConfig({ clientId: process.env.KAFKA_CLIENT_ID ?? "order-service" }));
const kafkaProducer = createProducer(kafka, ServiceName.Order);
const eventPublisher = new KafkaOrderEventPublisher(kafkaProducer);

app.use(express.json());

app.use(
  "/cart",
  createCartRouter({ cartRepository, menuCatalogClient, tokenVerifier }),
);

app.use(
  "/orders",
  createOrderRouter({ cartRepository, orderRepository, menuCatalogClient, eventPublisher, tokenVerifier }),
);

app.use(
  "/restaurant/orders",
  createRestaurantOrderRouter({ orderRepository, restaurantOwnershipClient, eventPublisher, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "order", status: "ok" });
});

const port = Number(process.env.PORT ?? 3004);

async function start(): Promise<void> {
  try {
    await ensureTopics(kafka);
    await kafkaProducer.connect();
    console.log(`[Order] Kafka producer connected`);
  } catch {
    console.log(`[Order] Event broker offline (${process.env.KAFKA_BROKERS ?? "localhost:9092"}). Running in standalone mode.`);
  }

  app.listen(port, () => {
    console.log(`Order service running on port ${port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Order service received ${signal}; disconnecting Kafka producer`);
  await kafkaProducer.disconnect().catch(() => {});
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start();
