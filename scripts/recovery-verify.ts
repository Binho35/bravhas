import { prisma } from "../lib/prisma";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("Recovery verification recusada fora de TEST/HOMOLOGATION.");
}

const RECOVERY = {
  alphaCompanyId: "E2E-COMPANY-ALPHA",
  betaCompanyId: "E2E-COMPANY-BETA",
  alphaOwnerId: "E2E-USER-ALPHA-OWNER",
  alphaEmployeeId: "E2E-EMP-ALPHA-MANAGER",
  betaEmployeeId: "E2E-EMP-BETA-FOREIGN",
  alphaAccountId: "E2E-ACCOUNT-ALPHA",
  alphaDocumentId: "RECOVERY-DOC-ALPHA",
  alphaTransactionId: "RECOVERY-TXN-ALPHA",
  alphaAuditId: "RECOVERY-AUDIT-ALPHA",
  betaDocumentId: "E2E-DOC-BETA-FOREIGN",
  betaObligationId: "E2E-OBLIGATION-BETA-FOREIGN",
} as const;

function requireCondition(condition: unknown, code: string): asserts condition {
  if (!condition) throw new Error(code);
}

async function main() {
  const [alphaCompany, betaCompany, alphaEmployee, betaEmployee, alphaDocument, betaDocument, betaObligation, account, transaction, audit] =
    await Promise.all([
      prisma.company.findUnique({ where: { id: RECOVERY.alphaCompanyId }, select: { id: true, prefix: true } }),
      prisma.company.findUnique({ where: { id: RECOVERY.betaCompanyId }, select: { id: true, prefix: true } }),
      prisma.hrEmployee.findUnique({ where: { id: RECOVERY.alphaEmployeeId }, select: { id: true, companyId: true } }),
      prisma.hrEmployee.findUnique({ where: { id: RECOVERY.betaEmployeeId }, select: { id: true, companyId: true } }),
      prisma.hrEmployeeDocument.findUnique({ where: { id: RECOVERY.alphaDocumentId }, select: { id: true, companyId: true, employeeId: true, storageKey: true } }),
      prisma.hrEmployeeDocument.findUnique({ where: { id: RECOVERY.betaDocumentId }, select: { id: true, companyId: true, employeeId: true, storageKey: true } }),
      prisma.obligation.findUnique({ where: { id: RECOVERY.betaObligationId }, select: { id: true, companyId: true, responsibleUserId: true, status: true } }),
      prisma.financialAccount.findUnique({ where: { id: RECOVERY.alphaAccountId }, select: { id: true, companyId: true, status: true, paidAmount: true } }),
      prisma.financialTransaction.findUnique({ where: { id: RECOVERY.alphaTransactionId }, select: { id: true, accountId: true, performedBy: true, type: true, amount: true } }),
      prisma.hrAuditEvent.findUnique({ where: { id: RECOVERY.alphaAuditId }, select: { id: true, companyId: true, actorUserId: true, action: true, entityId: true } }),
    ]);

  requireCondition(alphaCompany?.prefix === "E2EALPHA", "RECOVERY_ALPHA_TENANT_MISSING");
  requireCondition(betaCompany?.prefix === "E2EBETA", "RECOVERY_BETA_TENANT_MISSING");

  requireCondition(alphaEmployee?.companyId === RECOVERY.alphaCompanyId, "RECOVERY_ALPHA_EMPLOYEE_SCOPE_INVALID");
  requireCondition(betaEmployee?.companyId === RECOVERY.betaCompanyId, "RECOVERY_BETA_EMPLOYEE_SCOPE_INVALID");

  requireCondition(
    alphaDocument?.companyId === RECOVERY.alphaCompanyId &&
      alphaDocument.employeeId === RECOVERY.alphaEmployeeId &&
      alphaDocument.storageKey === "external:recovery-ci-alpha-document",
    "RECOVERY_ALPHA_DOCUMENT_INVALID",
  );
  requireCondition(
    betaDocument?.companyId === RECOVERY.betaCompanyId && betaDocument.employeeId === RECOVERY.betaEmployeeId,
    "RECOVERY_BETA_DOCUMENT_INVALID",
  );

  requireCondition(
    betaObligation?.companyId === RECOVERY.betaCompanyId &&
      betaObligation.responsibleUserId === "E2E-USER-BETA-OWNER" &&
      betaObligation.status === "PENDING",
    "RECOVERY_OBLIGATION_INVALID",
  );

  requireCondition(
    account?.companyId === RECOVERY.alphaCompanyId &&
      account.status === "PARTIALLY_PAID" &&
      account.paidAmount.toString() === "25",
    "RECOVERY_FINANCIAL_ACCOUNT_INVALID",
  );
  requireCondition(
    transaction?.accountId === RECOVERY.alphaAccountId &&
      transaction.performedBy === RECOVERY.alphaOwnerId &&
      transaction.type === "PAYMENT" &&
      transaction.amount.toString() === "25",
    "RECOVERY_FINANCIAL_TRANSACTION_INVALID",
  );

  requireCondition(
    audit?.companyId === RECOVERY.alphaCompanyId &&
      audit.actorUserId === RECOVERY.alphaOwnerId &&
      audit.action === "RECOVERY_FIXTURE_CREATED" &&
      audit.entityId === RECOVERY.alphaAccountId,
    "RECOVERY_AUDIT_INVALID",
  );

  console.log("RECOVERY_TENANTS=PASS");
  console.log("RECOVERY_EMPLOYEES=PASS");
  console.log("RECOVERY_DOCUMENT_METADATA=PASS");
  console.log("RECOVERY_OBLIGATIONS=PASS");
  console.log("RECOVERY_FINANCIAL_ACCOUNT=PASS");
  console.log("RECOVERY_FINANCIAL_TRANSACTION=PASS");
  console.log("RECOVERY_AUDIT_HISTORY=PASS");
  console.log("RECOVERY_CRITICAL_RECORDS=PASS");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    console.error(`RECOVERY_CRITICAL_RECORDS=FAIL code=${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
