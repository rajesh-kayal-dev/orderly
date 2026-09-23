import crypto from "crypto";

export interface GuestSession {
  id: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGuestSessionResult {
  guestSessionId: string;
  token: string;
  expiresAt: Date;
}

export interface GuestSessionRepository {
  create(session: { id: string; tokenHash: string; expiresAt: Date }): Promise<GuestSession>;
  findByTokenHash(tokenHash: string): Promise<GuestSession | null>;
  revoke(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

export function generateGuestToken(): { token: string; tokenHash: string } {
  // Generate 32 bytes of cryptographically secure random data
  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = `gst_${rawToken}`;
  const tokenHash = hashGuestToken(token);
  return { token, tokenHash };
}

export function hashGuestToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}
