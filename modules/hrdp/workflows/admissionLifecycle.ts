import { prisma } from "@/lib/prisma";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

export type AdmissionCandidate = {
  cpf: string | null;
  hireDate: Date | null;
  employmentType: string | null;
  documents: Array<{ verifiedAt: Date | null }>;
};

export function getAdmissionBlockers(employee: AdmissionCandidate) {
  const blockers: string[] = [];
  if (!employee.cpf) blockers.push("CPF");
  if (!employee.hireDate) blockers.push("data de admissão");
  if (!employee.employmentType) blockers.push("tipo de contrato");
  if (employee.documents.length === 0) blockers.push("documento");
  else {
    const pending = employee.documents.filter((document) => !document.verifiedAt).length;
    if (pending > 0) blockers.push(`${pending} documento(s) sem conferência`);
  }
  return blockers;
}

export async function completeEmployeeAdmission(input: {
  companyId: string;
  employeeId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const employee = await tx.hrEmployee.findFirst({
      where: {
        id: input.employeeId,
        companyId: input.companyId,
        status: "PRE_ADMISSION",
      },
      include: { documents: true },
    });

    if (!employee) {
      throw new Error("Pré-admissão fora do escopo autorizado ou já processada.");
    }

    if (!employee.cpf || !employee.hireDate || !employee.employmentType) {
      throw new Error("Cadastro funcional incompleto para concluir a admissão.");
    }
    if (employee.documents.length === 0) {
      throw new Error("Inclua ao menos um documento no dossiê antes de concluir a admissão.");
    }
    if (employee.documents.some((document) => !document.verifiedAt)) {
      throw new Error("Existem documentos pendentes de verificação.");
    }

    const updated = await tx.hrEmployee.updateMany({
      where: {
        id: input.employeeId,
        companyId: input.companyId,
        status: "PRE_ADMISSION",
      },
      data: { status: "ACTIVE", active: true },
    });

    if (updated.count !== 1) {
      throw new Error("Pré-admissão fora do escopo autorizado ou já processada.");
    }

    await logHrdpAudit(
      {
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        action: "EMPLOYEE_ADMISSION_COMPLETED",
        entityType: "HrEmployee",
        entityId: input.employeeId,
        metadata: { previousStatus: "PRE_ADMISSION", nextStatus: "ACTIVE" },
      },
      tx,
    );

    return tx.hrEmployee.findFirst({
      where: { id: input.employeeId, companyId: input.companyId },
    });
  });
}
