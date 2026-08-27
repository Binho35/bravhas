import "dotenv/config";
import { createRequire } from "node:module";
import { PrismaPg } from "@prisma/adapter-pg";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../lib/generated/prisma/client");

const connectionString = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_DIRECT_URL ou DATABASE_URL precisa estar configurada.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.upsert({
    where: { prefix: "STOCCO" },
    update: { name: "Grupo Stocco Advogados", active: true },
    create: { name: "Grupo Stocco Advogados", prefix: "STOCCO", active: true },
  });

  let branch = await prisma.branch.findFirst({
    where: { companyId: company.id, name: "Matriz" },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: { companyId: company.id, name: "Matriz", active: true },
    });
  } else if (!branch.active) {
    branch = await prisma.branch.update({ where: { id: branch.id }, data: { active: true } });
  }

  const departments = ["Administrativo", "Financeiro", "RH / DP", "Operações", "Planejamento"];
  for (const name of departments) {
    await prisma.hrDepartment.upsert({
      where: { companyId_name: { companyId: company.id, name } },
      update: { branchId: branch.id, active: true },
      create: { companyId: company.id, branchId: branch.id, name, active: true },
    });
  }

  console.log("Bootstrap concluído.");
  console.log(`Empresa: ${company.name}`);
  console.log(`Unidade: ${branch.name}`);
  console.log(`Departamentos base: ${departments.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
