import type { GuestSessionRepository } from "../../domain/guest-session/guest-session.repository.js";

export class RevokeGuestSessionUseCase {
  constructor(private readonly guestSessionRepository: GuestSessionRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) return;
    await this.guestSessionRepository.revoke(id);
  }
}
