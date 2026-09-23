import { hashGuestToken, type GuestSession } from "../../domain/guest-session/guest-session.types.js";
import type { GuestSessionRepository } from "../../domain/guest-session/guest-session.repository.js";

export class VerifyGuestSessionUseCase {
  constructor(private readonly guestSessionRepository: GuestSessionRepository) {}

  async execute(token: string): Promise<GuestSession | null> {
    if (!token || typeof token !== "string" || !token.startsWith("gst_")) {
      return null;
    }

    const tokenHash = hashGuestToken(token);
    const session = await this.guestSessionRepository.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    // Check if session is revoked or expired
    if (session.revokedAt !== null) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session;
  }
}
