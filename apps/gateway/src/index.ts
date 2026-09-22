import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

const SERVICES = {
  identity: process.env.IDENTITY_SERVICE_URL ?? "http://localhost:3001",
  restaurant: process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:3003",
  order: process.env.ORDER_SERVICE_URL ?? "http://localhost:3004",
  payment: process.env.PAYMENT_SERVICE_URL ?? "http://localhost:3005",
  delivery: process.env.DELIVERY_SERVICE_URL ?? "http://localhost:3006",
  notification: process.env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3007",
};

app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// We parse json and urlencoded bodies for proxying, or forward raw bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Proxy helper function to forward requests to target microservice
 */
const proxyTo = (targetBaseUrl: string, targetPathPrefix: string) => {
  return async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const remainingPath = req.params[0] ? `/${req.params[0]}` : "";
      const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
      const targetUrl = `${targetBaseUrl}${targetPathPrefix}${remainingPath}${queryString}`;

      const headers: Record<string, string> = {};
      if (req.headers.authorization) {
        headers["authorization"] = req.headers.authorization;
      }
      if (req.headers["content-type"]) {
        headers["content-type"] = req.headers["content-type"] as string;
      } else if (req.method !== "GET" && req.method !== "HEAD") {
        headers["content-type"] = "application/json";
      }
      headers["accept"] = (req.headers["accept"] as string) || "application/json";

      const init: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        if (req.body && Object.keys(req.body).length > 0) {
          init.body = JSON.stringify(req.body);
        }
      }

      const response = await fetch(targetUrl, init);

      res.status(response.status);

      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      const responseText = await response.text();
      try {
        const json = JSON.parse(responseText);
        res.json(json);
      } catch {
        res.send(responseText);
      }
    } catch (error: unknown) {
      console.error(`Gateway proxy error:`, error);
      res.status(502).json({
        success: false,
        error: {
          code: "BAD_GATEWAY",
          message: "Unable to communicate with downstream service",
        },
      });
    }
  };
};

// Route mappings: support both /api/* and root paths
const routes: Array<{ path: string; targetBaseUrl: string; targetPrefix: string }> = [
  // Identity Service
  { path: "/api/auth*", targetBaseUrl: SERVICES.identity, targetPrefix: "/auth" },
  { path: "/auth*", targetBaseUrl: SERVICES.identity, targetPrefix: "/auth" },
  { path: "/api/admin*", targetBaseUrl: SERVICES.identity, targetPrefix: "/admin" },
  { path: "/admin*", targetBaseUrl: SERVICES.identity, targetPrefix: "/admin" },

  // Restaurant Service
  { path: "/api/restaurants*", targetBaseUrl: SERVICES.restaurant, targetPrefix: "/restaurants" },
  { path: "/restaurants*", targetBaseUrl: SERVICES.restaurant, targetPrefix: "/restaurants" },
  { path: "/api/menu*", targetBaseUrl: SERVICES.restaurant, targetPrefix: "/menu" },
  { path: "/menu*", targetBaseUrl: SERVICES.restaurant, targetPrefix: "/menu" },

  // Order Service (note order of matching: restaurant/orders first)
  { path: "/api/restaurant/orders*", targetBaseUrl: SERVICES.order, targetPrefix: "/restaurant/orders" },
  { path: "/restaurant/orders*", targetBaseUrl: SERVICES.order, targetPrefix: "/restaurant/orders" },
  { path: "/api/cart*", targetBaseUrl: SERVICES.order, targetPrefix: "/cart" },
  { path: "/cart*", targetBaseUrl: SERVICES.order, targetPrefix: "/cart" },
  { path: "/api/orders*", targetBaseUrl: SERVICES.order, targetPrefix: "/orders" },
  { path: "/orders*", targetBaseUrl: SERVICES.order, targetPrefix: "/orders" },

  // Payment Service
  { path: "/api/payments*", targetBaseUrl: SERVICES.payment, targetPrefix: "/payments" },
  { path: "/payments*", targetBaseUrl: SERVICES.payment, targetPrefix: "/payments" },

  // Delivery Service
  { path: "/api/deliveries*", targetBaseUrl: SERVICES.delivery, targetPrefix: "/deliveries" },
  { path: "/deliveries*", targetBaseUrl: SERVICES.delivery, targetPrefix: "/deliveries" },
  { path: "/api/delivery-partners*", targetBaseUrl: SERVICES.delivery, targetPrefix: "/delivery-partners" },
  { path: "/delivery-partners*", targetBaseUrl: SERVICES.delivery, targetPrefix: "/delivery-partners" },

  // Notification Service
  { path: "/api/notifications*", targetBaseUrl: SERVICES.notification, targetPrefix: "/notifications" },
  { path: "/notifications*", targetBaseUrl: SERVICES.notification, targetPrefix: "/notifications" },
];

for (const route of routes) {
  app.all(route.path, proxyTo(route.targetBaseUrl, route.targetPrefix));
}

app.get("/health", (_req, res) => {
  res.json({
    service: "gateway",
    status: "ok",
    services: SERVICES,
  });
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
});