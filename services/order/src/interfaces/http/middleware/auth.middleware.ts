import type { NextFunction, Request, Response } from "express";
import type { IdentityAccessToken } from "../../../infrastructure/security/token.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      guestSessionId?: string;
    }
  }
}

export interface RequireAuthDeps {
  verifyAccessToken: (token: string) => IdentityAccessToken;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  guestSessionId?: string;
}

export interface AuthenticatedActorRequest extends Request {
  userId?: string;
  guestSessionId?: string;
}

export const requireActor =
  (deps: RequireAuthDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Check if upstream gateway passed actor headers
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    const headerGuestSessionId = req.headers["x-guest-session-id"] as string | undefined;

    if (headerUserId) {
      req.userId = headerUserId;
      return next();
    }

    if (headerGuestSessionId) {
      req.guestSessionId = headerGuestSessionId;
      return next();
    }

    // 2. Check Authorization header
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const token = header.slice("Bearer ".length).trim();

    // If guest token (gst_...) passed directly
    if (token.startsWith("gst_")) {
      req.guestSessionId = token;
      return next();
    }

    // Otherwise verify standard JWT
    try {
      const payload = deps.verifyAccessToken(token);
      req.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };

export const requireAuth =
  (deps: RequireAuthDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const token = header.slice("Bearer ".length).trim();

    try {
      const payload = deps.verifyAccessToken(token);
      req.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };
