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
    ownerLogin: "e2eAlphaOwner",
    financialLogin: "e2eAlphaFinancial",
    hrLogin: "e2eAlphaHr",
    password: "E2E-Alpha-2026!Secure",
    accountId: "E2E-ACCOUNT-ALPHA",
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
  role: "OWNER" | "FINANCIAL" | "HR";
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
