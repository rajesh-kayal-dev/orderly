import type { NextFunction, Request, Response } from "express";
import type { IdentityAccessToken } from "../../../infrastructure/security/token.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export interface RequireAuthDeps {
  verifyAccessToken: (token: string) => IdentityAccessToken;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export const requireAuth =
  (deps: RequireAuthDeps) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const token = header.slice("Bearer ".length).trim();

    let payload: IdentityAccessToken;

    try {
      payload = deps.verifyAccessToken(token);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return;
    }

    (req as AuthenticatedRequest).userId = payload.sub;
    next();
  };