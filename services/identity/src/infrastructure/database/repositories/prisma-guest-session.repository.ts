import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { GuestSessionRepository } from "../../../domain/guest-session/guest-session.repository.js";
import type { GuestSession } from "../../../domain/guest-session/guest-session.types.js";

export class PrismaGuestSessionRepository implements GuestSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(session: { id: string; tokenHash: string; expiresAt: Date }): Promise<GuestSession> {
    const created = await this.prisma.guestSession.create({
      data: {
        id: session.id,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
      },
    });

    return {
      id: created.id,
      tokenHash: created.tokenHash,
      expiresAt: created.expiresAt,
      revokedAt: created.revokedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async findByTokenHash(tokenHash: string): Promise<GuestSession | null> {
    const found = await this.prisma.guestSession.findUnique({
      where: { tokenHash },
    });

    if (!found) return null;

    return {
      id: found.id,
      tokenHash: found.tokenHash,
      expiresAt: found.expiresAt,
      revokedAt: found.revokedAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }

  async findById(id: string): Promise<GuestSession | null> {
    const found = await this.prisma.guestSession.findUnique({
      where: { id },
    });

    if (!found) return null;

    return {
      id: found.id,
      tokenHash: found.tokenHash,
      expiresAt: found.expiresAt,
      revokedAt: found.revokedAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    };
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.guestSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const res = await this.prisma.guestSession.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
    return res.count;
  }
}
