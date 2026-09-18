import "dotenv/config";
import express from "express";
import { ServiceName } from "@orderly/contracts";
import { createKafka, createProducer, defineEventsConfig, ensureTopics } from "@orderly/events";
import { createPaymentRouter } from "./interfaces/http/payment.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaPaymentRepository } from "./infrastructure/database/repositories/prisma-payment.repository.js";
import { HttpOrderClient } from "./infrastructure/http/http-order.client.js";
import { RazorpayPaymentProvider } from "./infrastructure/payment/razorpay.provider.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";
import { KafkaPaymentEventPublisher } from "./infrastructure/events/kafka-payment-event.publisher.js";

const app = express();

const paymentRepository = new PrismaPaymentRepository(prisma);
const tokenVerifier = getTokenVerifier();
const orderClient = new HttpOrderClient(requireEnv("ORDER_SERVICE_URL"));

const paymentProvider =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new RazorpayPaymentProvider(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)
    : null;

const kafka = createKafka(
  defineEventsConfig({ clientId: process.env.KAFKA_CLIENT_ID ?? "payment-service" }),
);
const kafkaProducer = createProducer(kafka, ServiceName.Payment);
const eventPublisher = new KafkaPaymentEventPublisher(kafkaProducer);

app.use(express.json());

app.use(
  "/payments",
  createPaymentRouter({
    paymentRepository,
    paymentProvider,
    orderClient,
    tokenVerifier,
    eventPublisher,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "payment", status: "ok" });
});

const port = Number(process.env.PORT ?? 3005);

async function start(): Promise<void> {
  await ensureTopics(kafka);
  await kafkaProducer.connect();
  app.listen(port, () => {
    console.log(`Payment service running on port ${port}`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.log(`Payment service received ${signal}; disconnecting Kafka producer`);
  await kafkaProducer.disconnect().catch((error: unknown) => {
    console.error("Payment service failed to disconnect Kafka producer", error);
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void start().catch((error: unknown) => {
  console.error("Payment service failed to start Kafka publishing", error);
  process.exitCode = 1;
});

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}