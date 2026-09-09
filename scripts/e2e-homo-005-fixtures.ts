import { prisma } from "../lib/prisma";
import { hashPassword } from "../modules/auth/server/password";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("HOMO-005 E2E fixtures recusadas fora de TEST/HOMOLOGATION.");
}

const COMPANY_ID = "E2E-COMPANY-ALPHA";
const BRANCH_ID = "E2E-BRANCH-ALPHA";
const PASSWORD = "E2E-Alpha-2026!Secure";

const RH_RESOURCES = [
  "colaboradores",
  "admissoes",
  "recrutamento",
  "desempenho",
  "canal-rh",
  "organizacao",
  "relatorios",
  "auditoria",
  "configuracoes",
] as const;

const DP_RESOURCES = [
  "ponto",
  "ferias",
  "beneficios",
  "afastamentos",
  "medidas-disciplinares",
  "desligamentos",
  "folha",
] as const;

async function upsertDepartmentUser(input: {
  id: string;
  loginId: string;
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "PAYROLL";
}) {
  const user = await prisma.user.upsert({
    where: { loginId: input.loginId },
    update: {
      companyId: COMPANY_ID,
      branchId: BRANCH_ID,
      companyPrefix: "e2ealpha",
      username: input.username,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
    },
    create: {
      id: input.id,
      companyId: COMPANY_ID,
      branchId: BRANCH_ID,
      companyPrefix: "e2ealpha",
      username: input.username,
      loginId: input.loginId,
      name: input.name,
      email: input.email,
      role: input.role,
      active: true,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(PASSWORD) },
  });
  await prisma.userSession.deleteMany({ where: { userId: user.id } });
  return user;
}

async function configureDepartmentProfile(input: {
  userId: string;
  id: string;
  name: string;
  resources: readonly string[];
}) {
  const profile = await prisma.accessProfile.upsert({
    where: { companyId_name: { companyId: COMPANY_ID, name: input.name } },
    update: { description: `E2E HOMO-005 ${input.name}`, master: false, system: true, active: true },
    create: {
      id: input.id,
      companyId: COMPANY_ID,
      name: input.name,
      description: `E2E HOMO-005 ${input.name}`,
      master: false,
      system: true,
      active: true,
    },
  });

  await prisma.accessPermission.deleteMany({ where: { profileId: profile.id } });
  for (const resource of input.resources) {
    await prisma.accessPermission.create({
      data: {
        id: `${profile.id}-${resource}`,
        profileId: profile.id,
        resource,
        canView: true,
        canCreate: true,
        canEdit: true,
        canApprove: true,
        canDelete: true,
        canExport: true,
      },
    });
  }

  await prisma.userAccessProfile.upsert({
    where: { userId: input.userId },
    update: { profileId: profile.id },
    create: { userId: input.userId, profileId: profile.id },
  });
}

async function main() {
  const company = await prisma.company.findUnique({ where: { id: COMPANY_ID }, select: { id: true } });
  const branch = await prisma.branch.findFirst({ where: { id: BRANCH_ID, companyId: COMPANY_ID }, select: { id: true } });
  if (!company || !branch) throw new Error("Execute o e2e-seed base antes das fixtures HOMO-005.");

  const admin = await upsertDepartmentUser({
    id: "E2E-USER-ALPHA-ADMIN",
    loginId: "e2eAlphaAdmin",
    username: "Admin",
    name: "E2E Alpha Admin",
    email: "admin.alpha@example.test",
    role: "ADMIN",
  });

  const payroll = await upsertDepartmentUser({
    id: "E2E-USER-ALPHA-PAYROLL",
    loginId: "e2eAlphaPayroll",
    username: "Payroll",
    name: "E2E Alpha Payroll",
    email: "payroll.alpha@example.test",
    role: "PAYROLL",
  });

  const hr = await prisma.user.findUnique({ where: { loginId: "e2eAlphaHr" }, select: { id: true } });
  if (!hr) throw new Error("Usuário E2E Alpha HR não encontrado.");

  await prisma.user.update({ where: { id: hr.id }, data: { passwordHash: hashPassword(PASSWORD), active: true, role: "HR" } });
  await prisma.userSession.deleteMany({ where: { userId: hr.id } });

  await configureDepartmentProfile({
    userId: hr.id,
    id: "E2E-PROFILE-ALPHA-HR-HOMO005",
    name: "E2E Analista RH HOMO005",
    resources: RH_RESOURCES,
  });
  await configureDepartmentProfile({
    userId: payroll.id,
    id: "E2E-PROFILE-ALPHA-DP-HOMO005",
    name: "E2E Analista DP HOMO005",
    resources: DP_RESOURCES,
  });

  await prisma.userSession.deleteMany({ where: { userId: admin.id } });
  console.log("HOMO-005 departmental E2E fixtures ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
