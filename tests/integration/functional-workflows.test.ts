import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "../../lib/prisma";
import { completeEmployeeAdmission, getAdmissionBlockers } from "../../modules/hrdp/workflows/admissionLifecycle";
import { createObligationRecord, updateObligationRecord } from "../../modules/obligations/server/obligationService";

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const alpha = {
  companyId: `IT-COMP-A-${suffix}`,
  branchId: `IT-BRANCH-A-${suffix}`,
  userId: `IT-USER-A-${suffix}`,
};
const beta = {
  companyId: `IT-COMP-B-${suffix}`,
  branchId: `IT-BRANCH-B-${suffix}`,
  userId: `IT-USER-B-${suffix}`,
};

async function createTenant(input: typeof alpha, prefix: string) {
  await prisma.company.create({ data: { id: input.companyId, prefix: `${prefix}${suffix}`.slice(0, 48), name: `Integration ${prefix}` } });
  await prisma.branch.create({ data: { id: input.branchId, companyId: input.companyId, name: `${prefix} HQ` } });
  return prisma.user.create({
    data: {
      id: input.userId,
      companyId: input.companyId,
      branchId: input.branchId,
      companyPrefix: prefix.toLowerCase(),
      username: "owner",
      loginId: `it-${prefix.toLowerCase()}-${suffix}`,
      name: `Integration ${prefix} Owner`,
      email: `it-${prefix.toLowerCase()}-${suffix}@example.test`,
      role: "OWNER",
    },
  });
}

async function cleanup() {
  for (const companyId of [alpha.companyId, beta.companyId]) {
    await prisma.hrAuditEvent.deleteMany({ where: { companyId } });
    await prisma.obligation.deleteMany({ where: { companyId } });
    await prisma.hrEmployee.deleteMany({ where: { companyId } });
    await prisma.user.deleteMany({ where: { companyId } });
    await prisma.branch.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
  }
}

test("functional workflow: admission persistence, audit and obligation lifecycle stay tenant-scoped", async () => {
  await cleanup();
  const alphaUser = await createTenant(alpha, "ITA");
  const betaUser = await createTenant(beta, "ITB");

  try {
    const employee = await prisma.hrEmployee.create({
      data: {
        id: `IT-EMP-${suffix}`,
        companyId: alpha.companyId,
        branchId: alpha.branchId,
        employeeNumber: `IT-${suffix}`,
        fullName: "Integration Employee",
        cpf: `CPF-${suffix}`,
        hireDate: new Date("2026-09-10T12:00:00.000Z"),
        employmentType: "CLT",
        status: "PRE_ADMISSION",
        active: true,
      },
    });

    assert.deepEqual(getAdmissionBlockers({ ...employee, documents: [] }), ["documento"]);
    await assert.rejects(
      completeEmployeeAdmission({ companyId: alpha.companyId, employeeId: employee.id, actorUserId: alphaUser.id }),
      /Inclua ao menos um documento/,
    );
    assert.equal((await prisma.hrEmployee.findUnique({ where: { id: employee.id } }))?.status, "PRE_ADMISSION");

    await prisma.hrEmployeeDocument.create({
      data: {
        companyId: alpha.companyId,
        employeeId: employee.id,
        type: "DOCUMENTO_PESSOAL",
        title: "Documento integração",
        storageKey: `external:integration:${suffix}`,
        verifiedAt: new Date(),
        verifiedBy: "Integration",
      },
    });

    const activated = await completeEmployeeAdmission({ companyId: alpha.companyId, employeeId: employee.id, actorUserId: alphaUser.id });
    assert.equal(activated?.status, "ACTIVE");
    assert.equal((await prisma.hrEmployee.findUnique({ where: { id: employee.id } }))?.status, "ACTIVE");
    assert.ok(await prisma.hrAuditEvent.findFirst({ where: { companyId: alpha.companyId, entityType: "HrEmployee", entityId: employee.id, action: "EMPLOYEE_ADMISSION_COMPLETED" } }));

    await assert.rejects(
      completeEmployeeAdmission({ companyId: alpha.companyId, employeeId: employee.id, actorUserId: alphaUser.id }),
      /já processada/,
    );

    const foreignEmployee = await prisma.hrEmployee.create({
      data: {
        id: `IT-EMP-FOREIGN-${suffix}`,
        companyId: alpha.companyId,
        fullName: "Tenant scoped employee",
        cpf: `FOREIGN-${suffix}`,
        hireDate: new Date("2026-09-11T12:00:00.000Z"),
        employmentType: "CLT",
        status: "PRE_ADMISSION",
        active: true,
      },
    });
    await assert.rejects(
      completeEmployeeAdmission({ companyId: beta.companyId, employeeId: foreignEmployee.id, actorUserId: betaUser.id }),
      /fora do escopo/,
    );
    assert.equal((await prisma.hrEmployee.findUnique({ where: { id: foreignEmployee.id } }))?.status, "PRE_ADMISSION");

    const actorAlpha = { id: alphaUser.id, companyId: alpha.companyId, name: alphaUser.name };
    const actorBeta = { id: betaUser.id, companyId: beta.companyId, name: betaUser.name };
    const obligation = await createObligationRecord(actorAlpha, {
      title: "Integration obligation",
      description: "lifecycle",
      area: "ADMINISTRATIVE",
      priority: "HIGH",
      status: "PENDING",
      responsibleName: alphaUser.name,
      dueDate: new Date("2026-09-20T12:00:00.000Z"),
      recurrence: "NONE",
      notes: null,
    });
    assert.equal(obligation.companyId, alpha.companyId);
    assert.equal(await updateObligationRecord(actorBeta, obligation.id, {
      title: "Cross tenant mutation",
      description: null,
      area: "ADMINISTRATIVE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      responsibleName: betaUser.name,
      dueDate: new Date("2026-09-21T12:00:00.000Z"),
      recurrence: "NONE",
      notes: null,
    }), null);

    const progressed = await updateObligationRecord(actorAlpha, obligation.id, {
      title: "Integration obligation updated",
      description: "persisted",
      area: "ADMINISTRATIVE",
      priority: "CRITICAL",
      status: "IN_PROGRESS",
      responsibleName: alphaUser.name,
      dueDate: new Date("2026-09-21T12:00:00.000Z"),
      recurrence: "NONE",
      notes: "edited",
    });
    assert.equal(progressed?.status, "IN_PROGRESS");
    assert.equal(progressed?.title, "Integration obligation updated");

    const completed = await updateObligationRecord(actorAlpha, obligation.id, {
      title: progressed!.title,
      description: progressed!.description,
      area: progressed!.area as "ADMINISTRATIVE",
      priority: progressed!.priority as "CRITICAL",
      status: "COMPLETED",
      responsibleName: progressed!.responsibleName,
      dueDate: progressed!.dueDate,
      recurrence: progressed!.recurrence,
      notes: progressed!.notes,
    });
    assert.equal(completed?.status, "COMPLETED");
    assert.ok(completed?.completedAt);

    const actions = (await prisma.hrAuditEvent.findMany({
      where: { companyId: alpha.companyId, entityType: "Obligation", entityId: obligation.id },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    })).map((event) => event.action);
    assert.deepEqual(actions, ["OBLIGATION_CREATED", "OBLIGATION_STATUS_CHANGED", "OBLIGATION_COMPLETED"]);
  } finally {
    await cleanup();
  }
});
