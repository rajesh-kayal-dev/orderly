import { generateKeyPairSync } from "node:crypto";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import express, { type Express } from "express";
import jwt from "jsonwebtoken";
import { createCartRouter } from "../../src/interfaces/http/cart.routes.js";
import { createOrderRouter } from "../../src/interfaces/http/order.routes.js";
import { createRestaurantOrderRouter } from "../../src/interfaces/http/restaurant-order.routes.js";
import { createTokenVerifier } from "../../src/infrastructure/security/token.js";
import type { OrderEventPublisher } from "../../src/application/order/order-event.publisher.js";
import { createFakeRepositories, type FakeRepositoryHandle } from "./fake-repositories.js";

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
  const handle = createFakeRepositories();
  const keyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const tokenVerifier = createTokenVerifier(toPem(keyPair, "public"));
  const eventPublisher: OrderEventPublisher = {
    async publishOrderPlaced() {},
    async publishOrderStatusChanged() {},
  };

  const app: Express = express();
  app.use(express.json());
  app.use(
    "/cart",
    createCartRouter({
      cartRepository: handle.cartRepo,
      menuCatalogClient: handle.catalogClient,
      tokenVerifier,
    }),
  );
  app.use(
    "/orders",
    createOrderRouter({
      cartRepository: handle.cartRepo,
      orderRepository: handle.orderRepo,
      menuCatalogClient: handle.catalogClient,
      eventPublisher,
      tokenVerifier,
    }),
  );
  app.use(
    "/restaurant/orders",
    createRestaurantOrderRouter({
      orderRepository: handle.orderRepo,
      restaurantOwnershipClient: handle.restaurantOwnershipClient,
      eventPublisher,
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

  function issueToken(subject: string, role = "CUSTOMER"): string {
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
