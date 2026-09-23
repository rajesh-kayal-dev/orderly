import jwt from "jsonwebtoken";
import { USER_ROLES, type UserRole } from "../../domain/user/user.types.js";

export interface JwtConfig {
  privateKey: string;
  publicKey: string;
  expiresIn: string | number;
}

export interface AccessToken {
  sub: string;
  role: UserRole;
}

export interface JwtService {
  issueAccessToken(subject: string, role: UserRole): string;
  verifyAccessToken(token: string): AccessToken;
}

export const DEFAULT_EXPIRES_IN = "15m";

const USER_ROLE_VALUES = Object.values(USER_ROLES);

function normalizeKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

export function createJwtService(config: JwtConfig): JwtService {
  const privateKey = normalizeKey(config.privateKey);
  const publicKey = normalizeKey(config.publicKey);

  return {
    issueAccessToken(subject: string, role: UserRole): string {
      return jwt.sign({ role }, privateKey, {
        algorithm: "RS256",
        expiresIn: config.expiresIn as jwt.SignOptions["expiresIn"],
        subject,
      });
    },

    verifyAccessToken(token: string): AccessToken {
      const payload = jwt.verify(token, publicKey, {
        algorithms: ["RS256"],
      });

      if (
        typeof payload === "string" ||
        typeof payload.sub !== "string" ||
        payload.sub.length === 0 ||
        typeof payload.role !== "string"
      ) {
        throw new Error("Invalid access token payload");
      }

      const role = USER_ROLE_VALUES.find((candidate) => candidate === payload.role);

      if (!role) {
        throw new Error("Invalid access token payload");
      }

      return {
        sub: payload.sub,
        role,
      };
    },
  };
}

import { DEV_DEFAULT_PRIVATE_KEY, DEV_DEFAULT_PUBLIC_KEY } from "@orderly/utils";

let defaultJwtService: JwtService | undefined;

export function getJwtService(): JwtService {
  if (!defaultJwtService) {
    defaultJwtService = createJwtService({
      privateKey: process.env.JWT_PRIVATE_KEY || DEV_DEFAULT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY || DEV_DEFAULT_PUBLIC_KEY,
      expiresIn: process.env.JWT_EXPIRES_IN ?? DEFAULT_EXPIRES_IN,
    });
  }

  return defaultJwtService;
}