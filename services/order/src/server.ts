import "dotenv/config";
import express from "express";
import { createCartRouter } from "./interfaces/http/cart.routes.js";
import { createOrderRouter } from "./interfaces/http/order.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaCartRepository } from "./infrastructure/database/repositories/prisma-cart.repository.js";
import { PrismaOrderRepository } from "./infrastructure/database/repositories/prisma-order.repository.js";
import { HttpMenuCatalogClient } from "./infrastructure/http/http-menu-catalog.client.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";

const app = express();

const cartRepository = new PrismaCartRepository(prisma);
const orderRepository = new PrismaOrderRepository(prisma);
const menuCatalogClient = new HttpMenuCatalogClient(
  process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3003",
);
const tokenVerifier = getTokenVerifier();

app.use(express.json());

app.use(
  "/cart",
  createCartRouter({ cartRepository, menuCatalogClient, tokenVerifier }),
);

app.use(
  "/orders",
  createOrderRouter({ cartRepository, orderRepository, menuCatalogClient, tokenVerifier }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "order", status: "ok" });
});

const port = Number(process.env.PORT ?? 3004);

app.listen(port, () => {
  console.log(`Order service running on port ${port}`);
});
