import "dotenv/config";
import express from "express";
import { adminRouter } from "./interfaces/http/admin.routes.js";
import { authRouter } from "./interfaces/http/auth.routes.js";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/admin", adminRouter);

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
