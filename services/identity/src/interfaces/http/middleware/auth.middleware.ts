import type { NextFunction, Request, Response } from "express";
import type { UserRepository } from "../../../domain/user/user.repository.js";
import type { User, UserRole } from "../../../domain/user/user.types.js";
import type { AccessToken } from "../../../infrastructure/security/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface RequireAuthDeps {
  verifyAccessToken: (token: string) => AccessToken;
  findUserById: UserRepository["findById"];
}

export interface AuthenticatedRequest extends Request {
  user: User;
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

    let payload: AccessToken;

    try {
      payload = deps.verifyAccessToken(token);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return;
    }

    try {
      const user = await deps.findUserById(payload.sub);

      if (!user) {
        res.status(401).json({ success: false, message: "User not found" });
        return;
      }

      if (user.status !== "ACTIVE") {
        res.status(403).json({ success: false, message: "Account is not active" });
        return;
      }

      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "Not authorized for this action",
      });
      return;
    }

    next();
  };