import type { GuestSession } from "./guest-session.types.js";

export interface GuestSessionRepository {
  create(session: { id: string; tokenHash: string; expiresAt: Date }): Promise<GuestSession>;
  findByTokenHash(tokenHash: string): Promise<GuestSession | null>;
  findById(id: string): Promise<GuestSession | null>;
  revoke(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
