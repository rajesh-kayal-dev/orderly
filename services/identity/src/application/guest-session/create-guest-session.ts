import crypto from "crypto";
import type { GuestSessionRepository } from "../../domain/guest-session/guest-session.repository.js";
import { generateGuestToken, type CreateGuestSessionResult } from "../../domain/guest-session/guest-session.types.js";

export interface CreateGuestSessionInput {
  ttlHours?: number;
}

export class CreateGuestSessionUseCase {
  constructor(private readonly guestSessionRepository: GuestSessionRepository) {}

  async execute(input?: CreateGuestSessionInput): Promise<CreateGuestSessionResult> {
    const ttlHours = input?.ttlHours ?? 24;
    const { token, tokenHash } = generateGuestToken();
    const id = `gs_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const session = await this.guestSessionRepository.create({
      id,
      tokenHash,
      expiresAt,
    });

    return {
      guestSessionId: session.id,
      token,
      expiresAt: session.expiresAt,
    };
  }
}
