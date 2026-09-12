import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "../../lib/prisma";
import { createObligationRecord, OBLIGATION_INVALID_TRANSITION, updateObligationRecord } from "../../modules/obligations/server/obligationService";

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const companyId = `OIT-COMP-${suffix}`;
const branchId = `OIT-BRANCH-${suffix}`;
const userId = `OIT-USER-${suffix}`;

async function cleanup() {
  await prisma.hrAuditEvent.deleteMany({ where: { companyId } });
  await prisma.obligation.deleteMany({ where: { companyId } });
  await prisma.user.deleteMany({ where: { companyId } });
  await prisma.branch.deleteMany({ where: { companyId } });
  await prisma.company.deleteMany({ where: { id: companyId } });
}

test("obligation transitions: terminal states require explicit reopen and invalid moves leave no false history", async () => {
  await cleanup();
  await prisma.company.create({ data: { id: companyId, prefix: `OIT-${suffix}`.slice(0, 48), name: "Obligation Transition Tenant" } });
  await prisma.branch.create({ data: { id: branchId, companyId, name: "Obligation Transition HQ" } });
  const user = await prisma.user.create({
    data: {
      id: userId,
      companyId,
      branchId,
      companyPrefix: "oit",
      username: "owner",
      loginId: `oit-${suffix}`,
      name: "Obligation Transition Owner",
      email: `oit-${suffix}@example.test`,
      role: "OWNER",
    },
  });
  const actor = { id: user.id, companyId, name: user.name };

  try {
    const obligation = await createObligationRecord(actor, {
      title: "Transition integration",
      description: null,
      area: "ADMINISTRATIVE",
      priority: "HIGH",
      status: "PENDING",
      responsibleName: user.name,
      dueDate: new Date("2026-09-20T12:00:00.000Z"),
      recurrence: "NONE",
      notes: null,
    });

    const inProgress = await updateObligationRecord(actor, obligation.id, {
      title: obligation.title,
      description: obligation.description,
      area: obligation.area as "ADMINISTRATIVE",
      priority: obligation.priority as "HIGH",
      status: "IN_PROGRESS",
      responsibleName: obligation.responsibleName,
      dueDate: obligation.dueDate,
      recurrence: obligation.recurrence,
      notes: obligation.notes,
    });
    assert.equal(inProgress?.status, "IN_PROGRESS");

    const completed = await updateObligationRecord(actor, obligation.id, {
      title: inProgress!.title,
      description: inProgress!.description,
      area: inProgress!.area as "ADMINISTRATIVE",
      priority: inProgress!.priority as "HIGH",
      status: "COMPLETED",
      responsibleName: inProgress!.responsibleName,
      dueDate: inProgress!.dueDate,
      recurrence: inProgress!.recurrence,
      notes: inProgress!.notes,
    });
    assert.equal(completed?.status, "COMPLETED");
    const auditBeforeInvalid = await prisma.hrAuditEvent.count({ where: { companyId, entityType: "Obligation", entityId: obligation.id } });

    await assert.rejects(
      updateObligationRecord(actor, obligation.id, {
        title: completed!.title,
        description: completed!.description,
        area: completed!.area as "ADMINISTRATIVE",
        priority: completed!.priority as "HIGH",
        status: "OVERDUE",
        responsibleName: completed!.responsibleName,
        dueDate: completed!.dueDate,
        recurrence: completed!.recurrence,
        notes: completed!.notes,
      }),
      new RegExp(OBLIGATION_INVALID_TRANSITION),
    );
    assert.equal((await prisma.obligation.findUniqueOrThrow({ where: { id: obligation.id } })).status, "COMPLETED");
    assert.equal(await prisma.hrAuditEvent.count({ where: { companyId, entityType: "Obligation", entityId: obligation.id } }), auditBeforeInvalid);

    const reopened = await updateObligationRecord(actor, obligation.id, {
      title: completed!.title,
      description: completed!.description,
      area: completed!.area as "ADMINISTRATIVE",
      priority: completed!.priority as "HIGH",
      status: "IN_PROGRESS",
      responsibleName: completed!.responsibleName,
      dueDate: completed!.dueDate,
      recurrence: completed!.recurrence,
      notes: completed!.notes,
    });
    assert.equal(reopened?.status, "IN_PROGRESS");
    assert.ok(await prisma.hrAuditEvent.findFirst({ where: { companyId, entityType: "Obligation", entityId: obligation.id, action: "OBLIGATION_REOPENED" } }));

    const canceled = await updateObligationRecord(actor, obligation.id, {
      title: reopened!.title,
      description: reopened!.description,
      area: reopened!.area as "ADMINISTRATIVE",
      priority: reopened!.priority as "HIGH",
      status: "CANCELED",
      responsibleName: reopened!.responsibleName,
      dueDate: reopened!.dueDate,
      recurrence: reopened!.recurrence,
      notes: reopened!.notes,
    });
    assert.equal(canceled?.status, "CANCELED");
    const auditBeforeCanceledInvalid = await prisma.hrAuditEvent.count({ where: { companyId, entityType: "Obligation", entityId: obligation.id } });

    await assert.rejects(
      updateObligationRecord(actor, obligation.id, {
        title: canceled!.title,
        description: canceled!.description,
        area: canceled!.area as "ADMINISTRATIVE",
        priority: canceled!.priority as "HIGH",
        status: "COMPLETED",
        responsibleName: canceled!.responsibleName,
        dueDate: canceled!.dueDate,
        recurrence: canceled!.recurrence,
        notes: canceled!.notes,
      }),
      new RegExp(OBLIGATION_INVALID_TRANSITION),
    );
    assert.equal((await prisma.obligation.findUniqueOrThrow({ where: { id: obligation.id } })).status, "CANCELED");
    assert.equal(await prisma.hrAuditEvent.count({ where: { companyId, entityType: "Obligation", entityId: obligation.id } }), auditBeforeCanceledInvalid);
  } finally {
    await cleanup();
  }
});
