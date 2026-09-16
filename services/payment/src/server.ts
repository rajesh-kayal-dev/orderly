import "dotenv/config";
import express from "express";
import { createPaymentRouter } from "./interfaces/http/payment.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaPaymentRepository } from "./infrastructure/database/repositories/prisma-payment.repository.js";
import { HttpOrderClient } from "./infrastructure/http/http-order.client.js";
import { RazorpayPaymentProvider } from "./infrastructure/payment/razorpay.provider.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";

const app = express();

const paymentRepository = new PrismaPaymentRepository(prisma);
const tokenVerifier = getTokenVerifier();
const orderClient = new HttpOrderClient(requireEnv("ORDER_SERVICE_URL"));

const paymentProvider =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new RazorpayPaymentProvider(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET)
    : null;

app.use(express.json());

app.use(
  "/payments",
  createPaymentRouter({
    paymentRepository,
    paymentProvider,
    orderClient,
    tokenVerifier,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "payment", status: "ok" });
});

const port = Number(process.env.PORT ?? 3005);

app.listen(port, () => {
  console.log(`Payment service running on port ${port}`);
});

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}