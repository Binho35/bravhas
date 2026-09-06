import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface HrdpAuditInput {
  companyId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

type HrdpAuditDbClient = Pick<typeof prisma, "hrAuditEvent">;

export async function logHrdpAudit(
  input: HrdpAuditInput,
  db: HrdpAuditDbClient = prisma,
) {
  return db.hrAuditEvent.create({
    data: {
      companyId: input.companyId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
    },
  });
}
