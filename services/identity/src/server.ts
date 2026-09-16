import "dotenv/config";
import express from "express";
import { createAdminRouter } from "./interfaces/http/admin.routes.js";
import { createAuthRouter } from "./interfaces/http/auth.routes.js";
import { PrismaUserRepository } from "./infrastructure/database/repositories/prisma-user.repository.js";
import { prisma } from "./infrastructure/database/prisma.js";
import { getJwtService } from "./infrastructure/security/jwt.js";

const app = express();

const userRepository = new PrismaUserRepository(prisma);
const jwtService = getJwtService();

app.use(express.json());

app.use("/auth", createAuthRouter({ userRepository, jwtService }));
app.use("/admin", createAdminRouter({ userRepository, jwtService }));

app.get("/health", (_req, res) => {
  res.json({
    service: "identity",
    status: "ok",
  });
});

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Identity service running on port ${port}`);
});
