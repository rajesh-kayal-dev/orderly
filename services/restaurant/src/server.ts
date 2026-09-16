import "dotenv/config";
import express from "express";
import { createMenuRouter } from "./interfaces/http/menu.routes.js";
import { createRestaurantRouter } from "./interfaces/http/restaurant.routes.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { PrismaMenuRepository } from "./infrastructure/database/repositories/prisma-menu.repository.js";
import { PrismaRestaurantRepository } from "./infrastructure/database/repositories/prisma-restaurant.repository.js";
import { getTokenVerifier } from "./infrastructure/security/token.js";

const app = express();

const restaurantRepository = new PrismaRestaurantRepository(prisma);
const menuRepository = new PrismaMenuRepository(prisma);
const tokenVerifier = getTokenVerifier();

app.use(express.json());

app.use(
  "/restaurants",
  createRestaurantRouter({ restaurantRepository, tokenVerifier }),
);

app.use(
  "/menu",
  createMenuRouter({
    restaurantRepository,
    menuRepository,
    tokenVerifier,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ service: "restaurant", status: "ok" });
});

const port = Number(process.env.PORT ?? 3003);

app.listen(port, () => {
  console.log(`Restaurant service running on port ${port}`);
});