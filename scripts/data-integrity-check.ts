import { prisma } from "../lib/prisma";

type CountRow = { count: bigint };
type IntegrityCheck = { name: string; run: () => Promise<number> };

async function count(query: Promise<unknown>) {
  const rows = (await query) as CountRow[];
  return Number(rows[0]?.count ?? 0n);
}

const checks: IntegrityCheck[] = [
  {
    name: "USER_BRANCH_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "User" u
      JOIN "Branch" b ON b.id = u."branchId"
      WHERE u."branchId" IS NOT NULL AND u."companyId" <> b."companyId"
    `),
  },
  {
    name: "EMPLOYEE_DOCUMENT_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "HrEmployeeDocument" d
      JOIN "HrEmployee" e ON e.id = d."employeeId"
      WHERE d."companyId" <> e."companyId"
    `),
  },
  {
    name: "FINANCIAL_BRANCH_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "FinancialAccount" a
      JOIN "Branch" b ON b.id = a."branchId"
      WHERE a."companyId" <> b."companyId"
    `),
  },
  {
    name: "FINANCIAL_TRANSACTION_ACTOR_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "FinancialTransaction" t
      JOIN "FinancialAccount" a ON a.id = t."accountId"
      JOIN "User" u ON u.id = t."performedBy"
      WHERE a."companyId" <> u."companyId"
    `),
  },
  {
    name: "OBLIGATION_RESPONSIBLE_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "Obligation" o
      JOIN "User" u ON u.id = o."responsibleUserId"
      WHERE o."companyId" <> u."companyId"
    `),
  },
  {
    name: "ACCESS_PROFILE_COMPANY_MISMATCH",
    run: () => count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "UserAccessProfile" a
      JOIN "User" u ON u.id = a."userId"
      JOIN "AccessProfile" p ON p.id = a."profileId"
      WHERE u."companyId" <> p."companyId"
    `),
  },
];

async function main() {
  let failed = false;

  for (const check of checks) {
    const mismatchCount = await check.run();
    const status = mismatchCount === 0 ? "PASS" : "FAIL";
    console.log(`${check.name}=${status} count=${mismatchCount}`);
    if (mismatchCount !== 0) failed = true;
  }

  if (failed) {
    console.error("DATA_INTEGRITY=FAIL");
    process.exitCode = 1;
    return;
  }

  console.log("DATA_INTEGRITY=PASS");
}

main()
  .catch((error: unknown) => {
    const errorType = error instanceof Error ? error.name : "UnknownError";
    const errorCode =
      typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : "UNKNOWN";

    console.error(`DATA_INTEGRITY_RUNTIME_ERROR errorType=${errorType} errorCode=${errorCode}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
