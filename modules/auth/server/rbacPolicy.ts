import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "./session";

async function getLinkedEmployeeId(userId: string, companyId: string) {
  const link = await prisma.userEmployeeLink.findFirst({
    where: { userId, companyId },
    select: { employeeId: true },
  });

  return link?.employeeId ?? null;
}

export async function assertEmployeeScope(employeeId: string) {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");

  const employee = await prisma.hrEmployee.findFirst({
    where: { id: employeeId, companyId: user.companyId },
    select: { id: true, managerId: true },
  });
  if (!employee) throw new Error("Colaborador fora do escopo autorizado.");

  if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "HR" || user.role === "PAYROLL") {
    return employee;
  }

  const linkedEmployeeId = await getLinkedEmployeeId(user.id, user.companyId);
  if (!linkedEmployeeId) throw new Error("Usuário operacional sem vínculo funcional configurado.");

  if (employee.id !== linkedEmployeeId && employee.managerId !== linkedEmployeeId) {
    throw new Error("Colaborador fora da equipe autorizada para este gestor.");
  }

  return employee;
}

export async function getEmployeeScopeWhere() {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");

  if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "HR" || user.role === "PAYROLL") {
    return { companyId: user.companyId };
  }

  const linkedEmployeeId = await getLinkedEmployeeId(user.id, user.companyId);
  if (!linkedEmployeeId) throw new Error("Usuário operacional sem vínculo funcional configurado.");

  return {
    companyId: user.companyId,
    OR: [{ id: linkedEmployeeId }, { managerId: linkedEmployeeId }],
  };
}
