import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { ObligationArea, ObligationPriority, ObligationStatus } from "@/modules/obligations/domain/entities/Obligation";

export type ObligationActor = {
  id: string;
  companyId: string;
  name: string;
};

export type ObligationMutationInput = {
  title: string;
  description: string | null;
  area: ObligationArea;
  priority: ObligationPriority;
  status: ObligationStatus;
  responsibleName: string;
  dueDate: Date;
  recurrence: string;
  notes: string | null;
};

function auditAction(previousStatus: string | null, nextStatus: string) {
  if (previousStatus === null) return "OBLIGATION_CREATED";
  if (previousStatus !== "COMPLETED" && nextStatus === "COMPLETED") return "OBLIGATION_COMPLETED";
  if (previousStatus !== "CANCELED" && nextStatus === "CANCELED") return "OBLIGATION_CANCELED";
  if ((previousStatus === "COMPLETED" || previousStatus === "CANCELED") && !["COMPLETED", "CANCELED"].includes(nextStatus)) return "OBLIGATION_REOPENED";
  if (previousStatus !== nextStatus) return "OBLIGATION_STATUS_CHANGED";
  return "OBLIGATION_UPDATED";
}

export async function createObligationRecord(actor: ObligationActor, input: ObligationMutationInput) {
  return prisma.$transaction(async (tx) => {
    const obligation = await tx.obligation.create({
      data: {
        id: randomUUID(),
        companyId: actor.companyId,
        title: input.title,
        description: input.description,
        area: input.area,
        priority: input.priority,
        status: input.status,
        responsibleUserId: actor.id,
        responsibleName: input.responsibleName,
        dueDate: input.dueDate,
        completedAt: input.status === "COMPLETED" ? new Date() : null,
        recurrence: input.recurrence,
        notes: input.notes,
        createdBy: actor.id,
        updatedBy: actor.id,
      },
    });

    await tx.hrAuditEvent.create({
      data: {
        companyId: actor.companyId,
        actorUserId: actor.id,
        action: "OBLIGATION_CREATED",
        entityType: "Obligation",
        entityId: obligation.id,
        metadata: { status: obligation.status, area: obligation.area, priority: obligation.priority },
      },
    });
    return obligation;
  });
}

export async function updateObligationRecord(actor: ObligationActor, id: string, input: ObligationMutationInput) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.obligation.findFirst({ where: { id, companyId: actor.companyId } });
    if (!current) return null;

    const result = await tx.obligation.updateMany({
      where: { id, companyId: actor.companyId },
      data: {
        title: input.title,
        description: input.description,
        area: input.area,
        priority: input.priority,
        status: input.status,
        responsibleName: input.responsibleName,
        dueDate: input.dueDate,
        completedAt: input.status === "COMPLETED" ? current.completedAt ?? new Date() : null,
        recurrence: input.recurrence,
        notes: input.notes,
        updatedBy: actor.id,
      },
    });
    if (result.count !== 1) return null;

    const obligation = await tx.obligation.findFirst({ where: { id, companyId: actor.companyId } });
    if (!obligation) return null;

    const action = auditAction(current.status, obligation.status);
    const changedFields = [
      ["title", current.title, obligation.title],
      ["description", current.description, obligation.description],
      ["area", current.area, obligation.area],
      ["priority", current.priority, obligation.priority],
      ["status", current.status, obligation.status],
      ["responsibleName", current.responsibleName, obligation.responsibleName],
      ["dueDate", current.dueDate.toISOString(), obligation.dueDate.toISOString()],
      ["recurrence", current.recurrence, obligation.recurrence],
      ["notes", current.notes, obligation.notes],
    ].filter(([, before, after]) => before !== after).map(([field]) => field as string);

    await tx.hrAuditEvent.create({
      data: {
        companyId: actor.companyId,
        actorUserId: actor.id,
        action,
        entityType: "Obligation",
        entityId: id,
        metadata: {
          changedFields,
          previousStatus: current.status,
          nextStatus: obligation.status,
        },
      },
    });

    return obligation;
  });
}
