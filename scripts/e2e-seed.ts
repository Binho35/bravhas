import { prisma } from "../lib/prisma";
import { hashPassword } from "../modules/auth/server/password";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("E2E seed recusado fora de TEST/HOMOLOGATION.");
}

export const E2E = {
  alpha: {
    companyId: "E2E-COMPANY-ALPHA",
    branchId: "E2E-BRANCH-ALPHA",
    ownerId: "E2E-USER-ALPHA-OWNER",
    financialId: "E2E-USER-ALPHA-FINANCIAL",
    hrId: "E2E-USER-ALPHA-HR",
    managerId: "E2E-USER-ALPHA-MANAGER",
    ownerLogin: "e2eAlphaOwner",
    financialLogin: "e2eAlphaFinancial",
    hrLogin: "e2eAlphaHr",
    managerLogin: "e2eAlphaManager",
    password: "E2E-Alpha-2026!Secure",
    accountId: "E2E-ACCOUNT-ALPHA",
    managerEmployeeId: "E2E-EMP-ALPHA-MANAGER",
    reportEmployeeId: "E2E-EMP-ALPHA-REPORT",
    outsideEmployeeId: "E2E-EMP-ALPHA-OUTSIDE",
  },
  beta: {
    companyId: "E2E-COMPANY-BETA",
    branchId: "E2E-BRANCH-BETA",
    ownerId: "E2E-USER-BETA-OWNER",
    financialId: "E2E-USER-BETA-FINANCIAL",
    ownerLogin: "e2eBetaOwner",
    financialLogin: "e2eBetaFinancial",
    password: "E2E-Beta-2026!Secure",
    accountId: "E2E-ACCOUNT-BETA",
    employeeId: "E2E-EMP-BETA-FOREIGN",
  },
} as const;

async function upsertUser(input: {
  id: string;
  companyId: string;
  branchId: string;
  companyPrefix: string;
  username: string;
  loginId: string;
  name: string;
  email: string;
  role: "OWNER" | "FINANCIAL" | "HR" | "OPERATIONAL";
  password: string;
}) {
  const user = await prisma.user.upsert({
    where: { loginId: input.loginId },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      companyPrefix: input.companyPrefix,
      username: input.username,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
    },
    create: {
      id: input.id,
      companyId: input.companyId,
      branchId: input.branchId,
      companyPrefix: input.companyPrefix,
      username: input.username,
      loginId: input.loginId,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
    },
  });

  const passwordHash = hashPassword(input.password);
  await prisma.$executeRaw`
    UPDATE "User"
    SET "passwordHash" = ${passwordHash}
    WHERE "id" = ${user.id}
  `;

  await prisma.userSession.deleteMany({ where: { userId: user.id } });
  return user;
}

async function configureManagerScope(input: {
  companyId: string;
  branchId: string;
  managerUserId: string;
}) {
  await prisma.hrEmployee.upsert({
    where: { id: E2E.alpha.managerEmployeeId },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      fullName: "E2E Alpha Gestor",
      status: "ACTIVE",
      active: true,
      managerId: null,
    },
    create: {
      id: E2E.alpha.managerEmployeeId,
      companyId: input.companyId,
      branchId: input.branchId,
      employeeNumber: "E2E-ALPHA-MGR",
      fullName: "E2E Alpha Gestor",
      status: "ACTIVE",
      active: true,
    },
  });

  await prisma.hrEmployee.upsert({
    where: { id: E2E.alpha.reportEmployeeId },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      fullName: "E2E Alpha Subordinado",
      status: "ACTIVE",
      active: true,
      managerId: E2E.alpha.managerEmployeeId,
    },
    create: {
      id: E2E.alpha.reportEmployeeId,
      companyId: input.companyId,
      branchId: input.branchId,
      employeeNumber: "E2E-ALPHA-REPORT",
      fullName: "E2E Alpha Subordinado",
      status: "ACTIVE",
      active: true,
      managerId: E2E.alpha.managerEmployeeId,
    },
  });

  await prisma.hrEmployee.upsert({
    where: { id: E2E.alpha.outsideEmployeeId },
    update: {
      companyId: input.companyId,
      branchId: input.branchId,
      fullName: "E2E Alpha Fora da Equipe",
      status: "ACTIVE",
      active: true,
      managerId: null,
    },
    create: {
      id: E2E.alpha.outsideEmployeeId,
      companyId: input.companyId,
      branchId: input.branchId,
      employeeNumber: "E2E-ALPHA-OUTSIDE",
      fullName: "E2E Alpha Fora da Equipe",
      status: "ACTIVE",
      active: true,
    },
  });

  await prisma.$executeRaw`
    INSERT INTO "UserEmployeeLink" ("userId", "employeeId", "companyId")
    VALUES (${input.managerUserId}, ${E2E.alpha.managerEmployeeId}, ${input.companyId})
    ON CONFLICT ("userId") DO UPDATE
      SET "employeeId" = EXCLUDED."employeeId", "companyId" = EXCLUDED."companyId"
  `;

  const profileId = "E2E-PROFILE-ALPHA-MANAGER";
  const permissionId = "E2E-PERM-ALPHA-MANAGER-COLLABORADORES";

  await prisma.$executeRaw`
    INSERT INTO "AccessProfile" ("id", "companyId", "name", "description", "master", "system", "active", "updatedAt")
    VALUES (${profileId}, ${input.companyId}, 'Gestor de Setor', 'E2E gestor com escopo restrito', false, true, true, NOW())
    ON CONFLICT ("companyId", "name") DO UPDATE
      SET "description" = EXCLUDED."description", "active" = true, "updatedAt" = NOW()
  `;

  await prisma.$executeRaw`
    INSERT INTO "AccessPermission" ("id", "profileId", "resource", "canView", "canCreate", "canEdit", "canApprove", "canDelete", "canExport", "updatedAt")
    VALUES (${permissionId}, ${profileId}, 'colaboradores', true, false, false, false, false, false, NOW())
    ON CONFLICT ("profileId", "resource") DO UPDATE
      SET "canView" = true, "canCreate" = false, "canEdit" = false, "canApprove" = false, "canDelete" = false, "canExport" = false, "updatedAt" = NOW()
  `;

  await prisma.$executeRaw`
    INSERT INTO "UserAccessProfile" ("userId", "profileId")
    VALUES (${input.managerUserId}, ${profileId})
    ON CONFLICT ("userId") DO UPDATE SET "profileId" = EXCLUDED."profileId"
  `;
}

async function main() {
  const alphaCompany = await prisma.company.upsert({
    where: { prefix: "E2EALPHA" },
    update: { name: "E2E Tenant Alpha", active: true },
    create: {
      id: E2E.alpha.companyId,
      prefix: "E2EALPHA",
      name: "E2E Tenant Alpha",
      active: true,
    },
  });

  const betaCompany = await prisma.company.upsert({
    where: { prefix: "E2EBETA" },
    update: { name: "E2E Tenant Beta", active: true },
    create: {
      id: E2E.beta.companyId,
      prefix: "E2EBETA",
      name: "E2E Tenant Beta",
      active: true,
    },
  });

  const alphaBranch = await prisma.branch.upsert({
    where: { id: E2E.alpha.branchId },
    update: { companyId: alphaCompany.id, name: "Alpha HQ", active: true },
    create: {
      id: E2E.alpha.branchId,
      companyId: alphaCompany.id,
      name: "Alpha HQ",
      active: true,
    },
  });

  const betaBranch = await prisma.branch.upsert({
    where: { id: E2E.beta.branchId },
    update: { companyId: betaCompany.id, name: "Beta HQ", active: true },
    create: {
      id: E2E.beta.branchId,
      companyId: betaCompany.id,
      name: "Beta HQ",
      active: true,
    },
  });

  const alphaOwner = await upsertUser({
    id: E2E.alpha.ownerId,
    companyId: alphaCompany.id,
    branchId: alphaBranch.id,
    companyPrefix: "e2ealpha",
    username: "Owner",
    loginId: E2E.alpha.ownerLogin,
    name: "E2E Alpha Owner",
    email: "owner.alpha@example.test",
    role: "OWNER",
    password: E2E.alpha.password,
  });

  await upsertUser({
    id: E2E.alpha.financialId,
    companyId: alphaCompany.id,
    branchId: alphaBranch.id,
    companyPrefix: "e2ealpha",
    username: "Financial",
    loginId: E2E.alpha.financialLogin,
    name: "E2E Alpha Financial",
    email: "financial.alpha@example.test",
    role: "FINANCIAL",
    password: E2E.alpha.password,
  });

  await upsertUser({
    id: E2E.alpha.hrId,
    companyId: alphaCompany.id,
    branchId: alphaBranch.id,
    companyPrefix: "e2ealpha",
    username: "HR",
    loginId: E2E.alpha.hrLogin,
    name: "E2E Alpha HR",
    email: "hr.alpha@example.test",
    role: "HR",
    password: E2E.alpha.password,
  });

  const alphaManager = await upsertUser({
    id: E2E.alpha.managerId,
    companyId: alphaCompany.id,
    branchId: alphaBranch.id,
    companyPrefix: "e2ealpha",
    username: "Manager",
    loginId: E2E.alpha.managerLogin,
    name: "E2E Alpha Manager",
    email: "manager.alpha@example.test",
    role: "OPERATIONAL",
    password: E2E.alpha.password,
  });

  const betaOwner = await upsertUser({
    id: E2E.beta.ownerId,
    companyId: betaCompany.id,
    branchId: betaBranch.id,
    companyPrefix: "e2ebeta",
    username: "Owner",
    loginId: E2E.beta.ownerLogin,
    name: "E2E Beta Owner",
    email: "owner.beta@example.test",
    role: "OWNER",
    password: E2E.beta.password,
  });

  await upsertUser({
    id: E2E.beta.financialId,
    companyId: betaCompany.id,
    branchId: betaBranch.id,
    companyPrefix: "e2ebeta",
    username: "Financial",
    loginId: E2E.beta.financialLogin,
    name: "E2E Beta Financial",
    email: "financial.beta@example.test",
    role: "FINANCIAL",
    password: E2E.beta.password,
  });

  await configureManagerScope({
    companyId: alphaCompany.id,
    branchId: alphaBranch.id,
    managerUserId: alphaManager.id,
  });

  await prisma.hrEmployee.upsert({
    where: { id: E2E.beta.employeeId },
    update: {
      companyId: betaCompany.id,
      branchId: betaBranch.id,
      fullName: "E2E Beta Funcionário Estrangeiro",
      status: "ACTIVE",
      active: true,
      managerId: null,
    },
    create: {
      id: E2E.beta.employeeId,
      companyId: betaCompany.id,
      branchId: betaBranch.id,
      employeeNumber: "E2E-BETA-FOREIGN",
      fullName: "E2E Beta Funcionário Estrangeiro",
      status: "ACTIVE",
      active: true,
    },
  });

  await prisma.financialAccount.upsert({
    where: { id: E2E.alpha.accountId },
    update: {
      companyId: alphaCompany.id,
      branchId: alphaBranch.id,
      description: "E2E Alpha Account",
      amount: 100,
      createdBy: alphaOwner.id,
      updatedBy: alphaOwner.id,
    },
    create: {
      id: E2E.alpha.accountId,
      companyId: alphaCompany.id,
      branchId: alphaBranch.id,
      type: "PAYABLE",
      status: "OPEN",
      description: "E2E Alpha Account",
      issueDate: new Date("2026-09-01T12:00:00.000Z"),
      dueDate: new Date("2026-09-30T12:00:00.000Z"),
      amount: 100,
      paidAmount: 0,
      discount: 0,
      interest: 0,
      fine: 0,
      createdBy: alphaOwner.id,
      updatedBy: alphaOwner.id,
    },
  });

  await prisma.financialAccount.upsert({
    where: { id: E2E.beta.accountId },
    update: {
      companyId: betaCompany.id,
      branchId: betaBranch.id,
      description: "E2E Beta Account",
      amount: 200,
      createdBy: betaOwner.id,
      updatedBy: betaOwner.id,
    },
    create: {
      id: E2E.beta.accountId,
      companyId: betaCompany.id,
      branchId: betaBranch.id,
      type: "PAYABLE",
      status: "OPEN",
      description: "E2E Beta Account",
      issueDate: new Date("2026-09-01T12:00:00.000Z"),
      dueDate: new Date("2026-09-30T12:00:00.000Z"),
      amount: 200,
      paidAmount: 0,
      discount: 0,
      interest: 0,
      fine: 0,
      createdBy: betaOwner.id,
      updatedBy: betaOwner.id,
    },
  });

  console.log("E2E synthetic fixtures ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
