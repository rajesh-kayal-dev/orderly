import { generateKeyPairSync } from "node:crypto";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import { createMenuRouter } from "../../src/interfaces/http/menu.routes.js";
import { createRestaurantRouter } from "../../src/interfaces/http/restaurant.routes.js";
import { createTokenVerifier } from "../../src/infrastructure/security/token.js";
import {
  createFakeRepository,
  type FakeRepositoryHandle,
} from "./fake-restaurant.repository.js";

function toPem(
  keyPair: ReturnType<typeof generateKeyPairSync>,
  type: "private" | "public",
): string {
  return type === "private"
    ? keyPair.privateKey.export({ type: "pkcs1", format: "pem" }).toString()
    : keyPair.publicKey.export({ type: "pkcs1", format: "pem" }).toString();
}

export interface HttpTestApi {
  baseUrl: string;
  issueToken(subject: string, role?: string): string;
  handle: FakeRepositoryHandle;
  close: () => Promise<void>;
}

export interface ApiResponse {
  status: number;
  body: Record<string, unknown> | null;
}

export async function createHttpTestApi(): Promise<HttpTestApi> {
  const handle = createFakeRepository();
  const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const tokenVerifier = createTokenVerifier(toPem(keyPair, "public"));

  const app: Express = express();
  app.use(express.json());
  app.use(
    "/restaurants",
    createRestaurantRouter({
      restaurantRepository: handle.restaurantRepo,
      tokenVerifier,
    }),
  );
  app.use(
    "/menu",
    createMenuRouter({
      restaurantRepository: handle.restaurantRepo,
      menuRepository: handle.menuRepo,
      tokenVerifier,
    }),
  );

  const server: Server = createServer(app);
  server.listen(0);
  await once(server, "listening");

  const address = server.address();

  if (address === null || typeof address === "string") {
    throw new Error("Expected a TCP address");
  }

  function issueToken(subject: string, role = "RESTAURANT"): string {
    return jwt.sign({ role }, toPem(keyPair, "private"), {
      algorithm: "RS256",
      expiresIn: "15m",
      subject,
    });
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    issueToken,
    handle,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export async function request(
  baseUrl: string,
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  if (options.token !== undefined) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body: Record<string, unknown> | null = null;

  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = null;
  }

  return { status: response.status, body };
}