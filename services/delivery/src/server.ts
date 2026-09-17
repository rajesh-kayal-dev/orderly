import "dotenv/config";
import express from "express";
import { createDeliveryPartnerRouter } from "./interfaces/http/delivery-partner.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaDeliveryPartnerRepository } from "./infrastructure/database/repositories/prisma-delivery-partner.repository.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";

const app = express();

const deliveryPartnerRepository = new PrismaDeliveryPartnerRepository(prisma);
const tokenVerifier = getTokenVerifier();

app.use(express.json());

app.use(
  "/delivery-partners",
  createDeliveryPartnerRouter({ deliveryPartnerRepository, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "delivery", status: "ok" });
});

const port = Number(process.env.PORT ?? 3006);

app.listen(port, () => {
  console.log(`Delivery service running on port ${port}`);
});