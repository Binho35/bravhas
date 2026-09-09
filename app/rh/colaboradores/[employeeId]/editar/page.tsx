import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { assertEmployeeScope } from "@/modules/auth/server/rbacPolicy";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";
import { cpfDuplicateCandidates, requireValidCpf } from "@/modules/hrdp/domain/cpf";

const EMPLOYMENT_TYPES = new Set(["CLT", "EXPERIENCE", "INTERN", "APPRENTICE", "CONTRACTOR", "TEMPORARY", "OTHER"]);
const WORK_MODES = new Set(["ONSITE", "HYBRID", "REMOTE"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredDate(formData: FormData, key: string, message: string) {
  const value = text(formData, key);
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(message);
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error(message);
  return parsed;
}

function optionalDate(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data inválida.");
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Data inválida.");
  return parsed;
}

function decimalText(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  if (!normalized || Number.isNaN(Number(normalized))) throw new Error("Valor numérico inválido.");
  return normalized;
}

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

async function updateEmployee(employeeId: string, formData: FormData) {
  "use server";
  const actor = await hrdpPermission.colaboradores("edit");
  await assertEmployeeScope(employeeId);

  const fullName = text(formData, "fullName");
  const cpfInput = text(formData, "cpf");
  const hireDate = requiredDate(formData, "hireDate", "Data de admissão é obrigatória.");
  const employmentType = text(formData, "employmentType");
  const workMode = text(formData, "workMode");
  if (!fullName) throw new Error("Nome completo é obrigatório.");
  if (!cpfInput) throw new Error("CPF é obrigatório.");
  const cpf = requireValidCpf(cpfInput);
  if (!employmentType || !EMPLOYMENT_TYPES.has(employmentType)) throw new Error("Tipo de contrato inválido.");
  if (workMode && !WORK_MODES.has(workMode)) throw new Error("Regime de trabalho inválido.");

  const requestedBranchId = text(formData, "branchId");
  const requestedDepartmentId = text(formData, "departmentId");
  const requestedPositionId = text(formData, "positionId");
  const managerId = text(formData, "managerId");
  const employeeNumber = text(formData, "employeeNumber");

  await prisma.$transaction(async (tx) => {
    const current = await tx.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId } });
    if (!current) throw new Error("Colaborador não encontrado ou fora do escopo autorizado.");

    let branchId = requestedBranchId;
    let departmentId = requestedDepartmentId;

    if (branchId) {
      const branch = await tx.branch.findFirst({ where: { id: branchId, companyId: actor.companyId, active: true }, select: { id: true } });
      if (!branch) throw new Error("Unidade inválida ou fora do escopo autorizado.");
    }

    let department: { id: string; branchId: string | null } | null = null;
    if (departmentId) {
      department = await tx.hrDepartment.findFirst({ where: { id: departmentId, companyId: actor.companyId, active: true }, select: { id: true, branchId: true } });
      if (!department) throw new Error("Departamento inválido ou fora do escopo autorizado.");
      if (department.branchId && branchId && department.branchId !== branchId) throw new Error("Departamento não pertence à unidade selecionada.");
      if (department.branchId && !branchId) branchId = department.branchId;
    }

    if (requestedPositionId) {
      const position = await tx.hrPosition.findFirst({ where: { id: requestedPositionId, companyId: actor.companyId, active: true }, select: { id: true, departmentId: true } });
      if (!position) throw new Error("Cargo inválido ou fora do escopo autorizado.");
      if (position.departmentId && departmentId && position.departmentId !== departmentId) throw new Error("Cargo não pertence ao departamento selecionado.");
      if (position.departmentId && !departmentId) {
        department = await tx.hrDepartment.findFirst({ where: { id: position.departmentId, companyId: actor.companyId, active: true }, select: { id: true, branchId: true } });
        if (!department) throw new Error("Departamento do cargo está indisponível.");
        departmentId = department.id;
        if (department.branchId && branchId && department.branchId !== branchId) throw new Error("Cargo e departamento não pertencem à unidade selecionada.");
        if (department.branchId && !branchId) branchId = department.branchId;
      }
    }

    if (managerId) {
      if (managerId === employeeId) throw new Error("O colaborador não pode ser gestor de si mesmo.");
      const manager = await tx.hrEmployee.findFirst({ where: { id: managerId, companyId: actor.companyId, active: true, status: "ACTIVE" }, select: { id: true } });
      if (!manager) throw new Error("Gestor inválido ou fora do escopo autorizado.");
    }

    const duplicateCpf = await tx.hrEmployee.findFirst({
      where: { companyId: actor.companyId, cpf: { in: cpfDuplicateCandidates(cpf) }, id: { not: employeeId } },
      select: { id: true },
    });
    if (duplicateCpf) throw new Error("CPF já cadastrado para outro colaborador desta empresa.");
    if (employeeNumber) {
      const duplicateNumber = await tx.hrEmployee.findFirst({ where: { companyId: actor.companyId, employeeNumber, id: { not: employeeId } }, select: { id: true } });
      if (duplicateNumber) throw new Error("Matrícula já cadastrada para outro colaborador desta empresa.");
    }

    const nextData = {
      branchId,
      departmentId,
      positionId: requestedPositionId,
      managerId,
      employeeNumber,
      fullName,
      socialName: text(formData, "socialName"),
      cpf,
      rg: text(formData, "rg"),
      birthDate: optionalDate(formData, "birthDate"),
      emailPersonal: text(formData, "emailPersonal"),
      emailCorporate: text(formData, "emailCorporate"),
      phone: text(formData, "phone"),
      hireDate,
      employmentType: employmentType as "CLT" | "EXPERIENCE" | "INTERN" | "APPRENTICE" | "CONTRACTOR" | "TEMPORARY" | "OTHER",
      workMode: workMode as "ONSITE" | "HYBRID" | "REMOTE" | null,
      weeklyHours: decimalText(formData, "weeklyHours"),
      baseSalary: decimalText(formData, "baseSalary"),
      notes: text(formData, "notes"),
    };

    const changedFields = Object.entries(nextData)
      .filter(([key, value]) => {
        const previous = current[key as keyof typeof current];
        const previousValue = previous instanceof Date ? previous.toISOString() : previous?.toString?.() ?? previous;
        const nextValue = value instanceof Date ? value.toISOString() : value?.toString?.() ?? value;
        return previousValue !== nextValue;
      })
      .map(([key]) => key);

    const result = await tx.hrEmployee.updateMany({
      where: { id: employeeId, companyId: actor.companyId },
      data: nextData,
    });
    if (result.count !== 1) throw new Error("Colaborador não encontrado ou fora do escopo autorizado.");

    await logHrdpAudit(
      {
        companyId: actor.companyId,
        actorUserId: actor.id,
        action: "EMPLOYEE_UPDATED",
        entityType: "HrEmployee",
        entityId: employeeId,
        metadata: { changedFields },
      },
      tx,
    );
  });

  revalidatePath(`/rh/colaboradores/${employeeId}`);
  revalidatePath(`/rh/colaboradores/${employeeId}/editar`);
  revalidatePath(`/rh/colaboradores/${employeeId}/historico`);
  revalidatePath("/rh/colaboradores");
  revalidatePath("/pessoas");
  revalidatePath("/rh/admissoes");
  redirect(`/rh/colaboradores/${employeeId}`);
}

export default async function EditEmployeePage({ params }: { params: Promise<{ employeeId: string }> }) {
  const actor = await hrdpPermission.colaboradores("edit");
  const { employeeId } = await params;
  const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId } });
  if (!employee) notFound();

  const [branches, departments, positions, managers] = await Promise.all([
    prisma.branch.findMany({ where: { companyId: actor.companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrDepartment.findMany({ where: { companyId: actor.companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrPosition.findMany({ where: { companyId: actor.companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrEmployee.findMany({ where: { companyId: actor.companyId, active: true, status: "ACTIVE", id: { not: employeeId } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1100px]">
    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Dossiê funcional</p>
    <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Editar {employee.fullName}</h1>
    <p className="mt-2 text-sm text-slate-600">Alterações persistem no cadastro funcional e geram evento auditável sem registrar valores sensíveis no histórico.</p>

    <form action={updateEmployee.bind(null, employeeId)} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-3">
      <label className="md:col-span-2"><span className="text-xs font-semibold text-slate-600">Nome completo *</span><input aria-label="Nome completo" name="fullName" required defaultValue={employee.fullName} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">CPF *</span><input aria-label="CPF" name="cpf" required defaultValue={employee.cpf ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Matrícula</span><input aria-label="Matrícula" name="employeeNumber" defaultValue={employee.employeeNumber ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Data de admissão *</span><input aria-label="Data de admissão" name="hireDate" type="date" required defaultValue={dateInput(employee.hireDate)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Tipo de contrato *</span><select aria-label="Tipo de contrato" name="employmentType" required defaultValue={employee.employmentType ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione</option><option value="CLT">CLT</option><option value="EXPERIENCE">Experiência</option><option value="INTERN">Estágio</option><option value="APPRENTICE">Aprendiz</option><option value="CONTRACTOR">Prestador</option><option value="TEMPORARY">Temporário</option><option value="OTHER">Outro</option></select></label>
      <label><span className="text-xs font-semibold text-slate-600">Unidade</span><select aria-label="Unidade" name="branchId" defaultValue={employee.branchId ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Sem unidade</option>{branches.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className="text-xs font-semibold text-slate-600">Departamento</span><select aria-label="Departamento" name="departmentId" defaultValue={employee.departmentId ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Sem departamento</option>{departments.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className="text-xs font-semibold text-slate-600">Cargo</span><select aria-label="Cargo" name="positionId" defaultValue={employee.positionId ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Sem cargo</option>{positions.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className="text-xs font-semibold text-slate-600">Gestor imediato</span><select aria-label="Gestor imediato" name="managerId" defaultValue={employee.managerId ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Sem gestor</option>{managers.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
      <label><span className="text-xs font-semibold text-slate-600">Regime</span><select aria-label="Regime" name="workMode" defaultValue={employee.workMode ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione</option><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrido</option><option value="REMOTE">Remoto</option></select></label>
      <label><span className="text-xs font-semibold text-slate-600">Salário base</span><input aria-label="Salário base" name="baseSalary" defaultValue={employee.baseSalary?.toString() ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Carga semanal</span><input aria-label="Carga semanal" name="weeklyHours" defaultValue={employee.weeklyHours?.toString() ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Data de nascimento</span><input aria-label="Data de nascimento" name="birthDate" type="date" defaultValue={dateInput(employee.birthDate)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">RG</span><input aria-label="RG" name="rg" defaultValue={employee.rg ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Nome social</span><input aria-label="Nome social" name="socialName" defaultValue={employee.socialName ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">E-mail pessoal</span><input aria-label="E-mail pessoal" name="emailPersonal" type="email" defaultValue={employee.emailPersonal ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">E-mail corporativo</span><input aria-label="E-mail corporativo" name="emailCorporate" type="email" defaultValue={employee.emailCorporate ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Telefone</span><input aria-label="Telefone" name="phone" defaultValue={employee.phone ?? ""} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label className="md:col-span-2 xl:col-span-3"><span className="text-xs font-semibold text-slate-600">Observações</span><textarea aria-label="Observações" name="notes" rows={3} defaultValue={employee.notes ?? ""} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm" /></label>
      <div className="md:col-span-2 xl:col-span-3 flex justify-end"><button className="h-11 rounded-2xl bg-[#0b2947] px-6 text-sm font-semibold text-white">Salvar alterações</button></div>
    </form>
  </div></main>;
}
