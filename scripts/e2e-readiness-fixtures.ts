import { prisma } from "../lib/prisma";

const environment = process.env.BRAVHAS_ENV?.toUpperCase();
if (environment !== "TEST" && environment !== "HOMOLOGATION") {
  throw new Error("Readiness E2E fixtures recusadas fora de TEST/HOMOLOGATION.");
}

const betaDocumentId = "E2E-DOC-BETA-FOREIGN";
const betaObligationId = "E2E-OBLIGATION-BETA-FOREIGN";

await prisma.hrEmployeeDocument.upsert({
  where: { id: betaDocumentId },
  update: {
    companyId: "E2E-COMPANY-BETA",
    employeeId: "E2E-EMP-BETA-FOREIGN",
    type: "DOCUMENTO_PESSOAL",
    title: "E2E Beta Documento Estrangeiro",
    storageKey: "external:e2e-beta-document",
  },
  create: {
    id: betaDocumentId,
    companyId: "E2E-COMPANY-BETA",
    employeeId: "E2E-EMP-BETA-FOREIGN",
    type: "DOCUMENTO_PESSOAL",
    title: "E2E Beta Documento Estrangeiro",
    storageKey: "external:e2e-beta-document",
  },
});

await prisma.obligation.upsert({
  where: { id: betaObligationId },
  update: {
    companyId: "E2E-COMPANY-BETA",
    title: "E2E Beta Obrigação Estrangeira",
    area: "ADMINISTRATIVE",
    priority: "MEDIUM",
    status: "PENDING",
    responsibleUserId: "E2E-USER-BETA-OWNER",
    responsibleName: "E2E Beta Owner",
    dueDate: new Date("2026-10-15T12:00:00.000Z"),
    recurrence: "NONE",
    createdBy: "E2E-USER-BETA-OWNER",
  },
  create: {
    id: betaObligationId,
    companyId: "E2E-COMPANY-BETA",
    title: "E2E Beta Obrigação Estrangeira",
    area: "ADMINISTRATIVE",
    priority: "MEDIUM",
    status: "PENDING",
    responsibleUserId: "E2E-USER-BETA-OWNER",
    responsibleName: "E2E Beta Owner",
    dueDate: new Date("2026-10-15T12:00:00.000Z"),
    recurrence: "NONE",
    createdBy: "E2E-USER-BETA-OWNER",
  },
});

await prisma.$disconnect();
console.log("Readiness E2E fixtures seeded.");
