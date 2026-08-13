export interface UserSessionRepository {
  create(session: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
    lastSeenAt: Date | null;
  }): Promise<void>;

  findByTokenHash(
    tokenHash: string,
  ): Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    lastSeenAt: Date | null;
  } | null>;

  revoke(
    id: string,
  ): Promise<void>;

  updateLastSeen(
    id: string,
    lastSeenAt: Date,
  ): Promise<void>;
}