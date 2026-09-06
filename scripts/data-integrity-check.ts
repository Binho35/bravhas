import { prisma } from "../lib/prisma";

type CountRow = { count: bigint };

async function count(query: Promise<unknown>) {
  const rows = (await query) as CountRow[];
  return Number(rows[0]?.count ?? 0n);
}

const checks = [
  {
    name: "USER_BRANCH_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "User" u
      JOIN "Branch" b ON b.id = u."branchId"
      WHERE u."branchId" IS NOT NULL AND u."companyId" <> b."companyId"
    `),
  },
  {
    name: "EMPLOYEE_DOCUMENT_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "HrEmployeeDocument" d
      JOIN "HrEmployee" e ON e.id = d."employeeId"
      WHERE d."companyId" <> e."companyId"
    `),
  },
  {
    name: "FINANCIAL_BRANCH_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "FinancialAccount" a
      JOIN "Branch" b ON b.id = a."branchId"
      WHERE a."companyId" <> b."companyId"
    `),
  },
  {
    name: "FINANCIAL_TRANSACTION_ACTOR_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "FinancialTransaction" t
      JOIN "FinancialAccount" a ON a.id = t."accountId"
      JOIN "User" u ON u.id = t."performedBy"
      WHERE a."companyId" <> u."companyId"
    `),
  },
  {
    name: "OBLIGATION_RESPONSIBLE_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "Obligation" o
      JOIN "User" u ON u.id = o."responsibleUserId"
      WHERE o."companyId" <> u."companyId"
    `),
  },
  {
    name: "ACCESS_PROFILE_COMPANY_MISMATCH",
    count: await count(prisma.$queryRaw`
      SELECT COUNT(*)::bigint AS count
      FROM "UserAccessProfile" a
      JOIN "User" u ON u.id = a."userId"
      JOIN "AccessProfile" p ON p.id = a."profileId"
      WHERE u."companyId" <> p."companyId"
    `),
  },
];

let failed = false;
for (const check of checks) {
  const status = check.count === 0 ? "PASS" : "FAIL";
  console.log(`${check.name}=${status} count=${check.count}`);
  if (check.count !== 0) failed = true;
}

await prisma.$disconnect();

if (failed) {
  console.error("DATA_INTEGRITY=FAIL");
  process.exit(1);
}

console.log("DATA_INTEGRITY=PASS");
