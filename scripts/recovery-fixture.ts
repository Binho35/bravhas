import { prisma } from "../lib/prisma";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("Recovery fixture recusada fora de TEST/HOMOLOGATION.");
}

const RECOVERY = {
  alphaCompanyId: "E2E-COMPANY-ALPHA",
  betaCompanyId: "E2E-COMPANY-BETA",
  alphaOwnerId: "E2E-USER-ALPHA-OWNER",
  alphaEmployeeId: "E2E-EMP-ALPHA-MANAGER",
  alphaAccountId: "E2E-ACCOUNT-ALPHA",
  alphaDocumentId: "RECOVERY-DOC-ALPHA",
  alphaTransactionId: "RECOVERY-TXN-ALPHA",
  alphaAuditId: "RECOVERY-AUDIT-ALPHA",
  betaObligationId: "E2E-OBLIGATION-BETA-FOREIGN",
} as const;

async function assertBaseline() {
  const [alphaCompany, betaCompany, alphaOwner, alphaEmployee, alphaAccount, betaObligation] = await Promise.all([
    prisma.company.findUnique({ where: { id: RECOVERY.alphaCompanyId }, select: { id: true } }),
    prisma.company.findUnique({ where: { id: RECOVERY.betaCompanyId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: RECOVERY.alphaOwnerId }, select: { id: true, companyId: true } }),
    prisma.hrEmployee.findUnique({ where: { id: RECOVERY.alphaEmployeeId }, select: { id: true, companyId: true } }),
    prisma.financialAccount.findUnique({ where: { id: RECOVERY.alphaAccountId }, select: { id: true, companyId: true } }),
    prisma.obligation.findUnique({ where: { id: RECOVERY.betaObligationId }, select: { id: true, companyId: true } }),
  ]);

  if (!alphaCompany || !betaCompany || !alphaOwner || !alphaEmployee || !alphaAccount || !betaObligation) {
    throw new Error("RECOVERY_BASELINE_FIXTURES_MISSING");
  }
  if (alphaOwner.companyId !== RECOVERY.alphaCompanyId || alphaEmployee.companyId !== RECOVERY.alphaCompanyId) {
    throw new Error("RECOVERY_ALPHA_SCOPE_INVALID");
  }
  if (alphaAccount.companyId !== RECOVERY.alphaCompanyId || betaObligation.companyId !== RECOVERY.betaCompanyId) {
    throw new Error("RECOVERY_TENANT_BASELINE_INVALID");
  }
}

async function main() {
  await assertBaseline();

  await prisma.$transaction(async (tx) => {
    const accountUpdate = await tx.financialAccount.updateMany({
      where: { id: RECOVERY.alphaAccountId, companyId: RECOVERY.alphaCompanyId },
      data: {
        status: "PARTIALLY_PAID",
        paidAmount: 25,
        updatedBy: RECOVERY.alphaOwnerId,
      },
    });
    if (accountUpdate.count !== 1) throw new Error("RECOVERY_FINANCIAL_ACCOUNT_NOT_UPDATED");

    await tx.financialTransaction.upsert({
      where: { id: RECOVERY.alphaTransactionId },
      update: {
        accountId: RECOVERY.alphaAccountId,
        performedBy: RECOVERY.alphaOwnerId,
        type: "PAYMENT",
        amount: 25,
        performedAt: new Date("2026-09-06T12:00:00.000Z"),
        notes: "Recovery CI representative payment",
      },
      create: {
        id: RECOVERY.alphaTransactionId,
        accountId: RECOVERY.alphaAccountId,
        performedBy: RECOVERY.alphaOwnerId,
        type: "PAYMENT",
        amount: 25,
        performedAt: new Date("2026-09-06T12:00:00.000Z"),
        notes: "Recovery CI representative payment",
      },
    });

    await tx.hrEmployeeDocument.upsert({
      where: { id: RECOVERY.alphaDocumentId },
      update: {
        companyId: RECOVERY.alphaCompanyId,
        employeeId: RECOVERY.alphaEmployeeId,
        type: "OUTRO",
        title: "Recovery CI Documento Alpha",
        storageKey: "external:recovery-ci-alpha-document",
        notes: "Metadata representativa para prova de restore",
      },
      create: {
        id: RECOVERY.alphaDocumentId,
        companyId: RECOVERY.alphaCompanyId,
        employeeId: RECOVERY.alphaEmployeeId,
        type: "OUTRO",
        title: "Recovery CI Documento Alpha",
        storageKey: "external:recovery-ci-alpha-document",
        notes: "Metadata representativa para prova de restore",
      },
    });

    await tx.hrAuditEvent.upsert({
      where: { id: RECOVERY.alphaAuditId },
      update: {
        companyId: RECOVERY.alphaCompanyId,
        actorUserId: RECOVERY.alphaOwnerId,
        action: "RECOVERY_FIXTURE_CREATED",
        entityType: "RecoveryFixture",
        entityId: RECOVERY.alphaAccountId,
        metadata: {
          accountId: RECOVERY.alphaAccountId,
          transactionId: RECOVERY.alphaTransactionId,
          documentId: RECOVERY.alphaDocumentId,
        },
      },
      create: {
        id: RECOVERY.alphaAuditId,
        companyId: RECOVERY.alphaCompanyId,
        actorUserId: RECOVERY.alphaOwnerId,
        action: "RECOVERY_FIXTURE_CREATED",
        entityType: "RecoveryFixture",
        entityId: RECOVERY.alphaAccountId,
        metadata: {
          accountId: RECOVERY.alphaAccountId,
          transactionId: RECOVERY.alphaTransactionId,
          documentId: RECOVERY.alphaDocumentId,
        },
      },
    });
  });

  console.log("RECOVERY_FIXTURE=PASS");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error(`RECOVERY_FIXTURE=FAIL code=${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
