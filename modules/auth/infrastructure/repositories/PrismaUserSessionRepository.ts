import { prisma } from "@/lib/prisma";

import type { UserSessionRepository } from "../../application/repositories/UserSessionRepository";

export class PrismaUserSessionRepository
  implements UserSessionRepository
{
  async create(session: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
    lastSeenAt: Date | null;
  }): Promise<void> {
    await prisma.userSession.create({
      data: {
        id: session.id,
        userId: session.userId,
        tokenHash: session.tokenHash,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt ?? null,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
      },
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    lastSeenAt: Date | null;
  } | null> {
    const session =
      await prisma.userSession.findUnique({
        where: {
          tokenHash,
        },
      });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
    };
  }

  async revoke(
    id: string,
  ): Promise<void> {
    await prisma.userSession.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async updateLastSeen(
    id: string,
    lastSeenAt: Date,
  ): Promise<void> {
    await prisma.userSession.update({
      where: {
        id,
      },
      data: {
        lastSeenAt,
      },
    });
  }
}