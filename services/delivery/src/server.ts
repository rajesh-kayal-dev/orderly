import "dotenv/config";
import express from "express";
import { ServiceName } from "@orderly/contracts";
import { createKafka, createProducer, defineEventsConfig, ensureTopics } from "@orderly/events";
import { createDeliveryRouter } from "./interfaces/http/delivery.routes.js";
import { createDeliveryPartnerRouter } from "./interfaces/http/delivery-partner.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaDeliveryRepository } from "./infrastructure/database/repositories/prisma-delivery.repository.js";
import { PrismaDeliveryPartnerRepository } from "./infrastructure/database/repositories/prisma-delivery-partner.repository.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";
import { KafkaDeliveryEventPublisher } from "./infrastructure/events/kafka-delivery-event.publisher.js";

const app = express();

const deliveryRepository = new PrismaDeliveryRepository(prisma);
const deliveryPartnerRepository = new PrismaDeliveryPartnerRepository(prisma);
const tokenVerifier = getTokenVerifier();

const kafka = createKafka(
  defineEventsConfig({ clientId: process.env.KAFKA_CLIENT_ID ?? "delivery-service" }),
);
const kafkaProducer = createProducer(kafka, ServiceName.Delivery);
const eventPublisher = new KafkaDeliveryEventPublisher(kafkaProducer);

app.use(express.json());

app.use(
  "/deliveries",
  createDeliveryRouter({ deliveryRepository, deliveryPartnerRepository, tokenVerifier, eventPublisher }),
);

app.use(
  "/delivery-partners",
  createDeliveryPartnerRouter({ deliveryPartnerRepository, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "delivery", status: "ok" });
});

const port = Number(process.env.PORT ?? 3006);

async function start(): Promise<void> {
  try {
    await ensureTopics(kafka);
    await kafkaProducer.connect();
    console.log(`[Delivery] Kafka producer connected`);
  } catch {
    console.log(`[Delivery] Event broker offline (${process.env.KAFKA_BROKERS ?? "localhost:9092"}). Running in standalone mode.`);
  }

  app.listen(port, () => {
    console.log(`Delivery service running on port ${port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Delivery service received ${signal}; disconnecting Kafka producer`);
  await kafkaProducer.disconnect().catch(() => {});
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start();