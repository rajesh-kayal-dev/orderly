import jwt from "jsonwebtoken";

export interface IdentityAccessToken {
  sub: string;
  role: string;
}

export interface TokenVerifier {
  verify(token: string): IdentityAccessToken;
}

function normalizeKey(key: string): string {
  return key.replace(/\\n/g, "\n");
}

export function createTokenVerifier(publicKey: string): TokenVerifier {
  const key = normalizeKey(publicKey);

  return {
    verify(token: string): IdentityAccessToken {
      const payload = jwt.verify(token, key, { algorithms: ["RS256"] });

      if (
        typeof payload === "string" ||
        typeof payload.sub !== "string" ||
        payload.sub.length === 0 ||
        typeof payload.role !== "string"
      ) {
        throw new Error("Invalid access token payload");
      }

      return { sub: payload.sub, role: payload.role };
    },
  };
}

import { DEV_DEFAULT_PUBLIC_KEY } from "@orderly/utils";

let defaultVerifier: TokenVerifier | undefined;

export function getTokenVerifier(): TokenVerifier {
  if (!defaultVerifier) {
    defaultVerifier = createTokenVerifier(process.env.JWT_PUBLIC_KEY || DEV_DEFAULT_PUBLIC_KEY);
  }

  return defaultVerifier;
}