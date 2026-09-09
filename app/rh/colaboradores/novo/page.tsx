import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, FileText, Save, UserRound } from "lucide-react";

import { ServerSubmitButton } from "@/components/forms/ServerSubmitButton";
import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";
import { cpfDuplicateCandidates, requireValidCpf } from "@/modules/hrdp/domain/cpf";

const EMPLOYMENT_TYPES = new Set(["CLT", "EXPERIENCE", "INTERN", "APPRENTICE", "CONTRACTOR", "TEMPORARY", "OTHER"]);
const WORK_MODES = new Set(["ONSITE", "HYBRID", "REMOTE"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dateValue(formData: FormData, key: string) {
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

async function createEmployee(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.colaboradores("create");

  const fullName = text(formData, "fullName");
  const cpfInput = text(formData, "cpf");
  const hireDate = dateValue(formData, "hireDate");
  const employmentType = text(formData, "employmentType");
  const workMode = text(formData, "workMode");
  const employeeNumber = text(formData, "employeeNumber");
  const requestedBranchId = text(formData, "branchId");
  const requestedDepartmentId = text(formData, "departmentId");
  const positionId = text(formData, "positionId");
  const managerId = text(formData, "managerId");

  if (!fullName) throw new Error("Nome completo é obrigatório.");
  if (!cpfInput) throw new Error("CPF é obrigatório para iniciar a admissão.");
  const cpf = requireValidCpf(cpfInput);
  if (!hireDate) throw new Error("Data de admissão é obrigatória para iniciar a admissão.");
  if (!employmentType || !EMPLOYMENT_TYPES.has(employmentType)) throw new Error("Tipo de contrato é obrigatório para iniciar a admissão.");
  if (workMode && !WORK_MODES.has(workMode)) throw new Error("Regime de trabalho inválido.");

  const employee = await prisma.$transaction(async (tx) => {
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

    if (positionId) {
      const position = await tx.hrPosition.findFirst({ where: { id: positionId, companyId: actor.companyId, active: true }, select: { id: true, departmentId: true } });
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
      const manager = await tx.hrEmployee.findFirst({ where: { id: managerId, companyId: actor.companyId, active: true, status: "ACTIVE" }, select: { id: true } });
      if (!manager) throw new Error("Gestor inválido ou fora do escopo autorizado.");
    }

    const duplicateCpf = await tx.hrEmployee.findFirst({
      where: { companyId: actor.companyId, cpf: { in: cpfDuplicateCandidates(cpf) } },
      select: { id: true },
    });
    if (duplicateCpf) throw new Error("CPF já cadastrado para outro colaborador desta empresa.");
    if (employeeNumber) {
      const duplicateNumber = await tx.hrEmployee.findFirst({ where: { companyId: actor.companyId, employeeNumber }, select: { id: true } });
      if (duplicateNumber) throw new Error("Matrícula já cadastrada para outro colaborador desta empresa.");
    }

    const created = await tx.hrEmployee.create({
      data: {
        companyId: actor.companyId,
        branchId,
        departmentId,
        positionId,
        managerId,
        employeeNumber,
        fullName,
        socialName: text(formData, "socialName"),
        cpf,
        rg: text(formData, "rg"),
        birthDate: dateValue(formData, "birthDate"),
        emailPersonal: text(formData, "emailPersonal"),
        emailCorporate: text(formData, "emailCorporate"),
        phone: text(formData, "phone"),
        hireDate,
        employmentType: employmentType as "CLT" | "EXPERIENCE" | "INTERN" | "APPRENTICE" | "CONTRACTOR" | "TEMPORARY" | "OTHER",
        workMode: workMode as "ONSITE" | "HYBRID" | "REMOTE" | null,
        weeklyHours: decimalText(formData, "weeklyHours"),
        baseSalary: decimalText(formData, "baseSalary"),
        status: "PRE_ADMISSION",
        active: true,
        notes: text(formData, "notes"),
      },
    });

    await logHrdpAudit({
      companyId: actor.companyId,
      actorUserId: actor.id,
      action: "EMPLOYEE_CREATED",
      entityType: "HrEmployee",
      entityId: created.id,
      metadata: { status: created.status, branchId: created.branchId, departmentId: created.departmentId, positionId: created.positionId },
    }, tx);

    return created;
  });

  revalidatePath("/rh/colaboradores");
  revalidatePath("/pessoas");
  revalidatePath("/rh/admissoes");
  revalidatePath(`/rh/colaboradores/${employee.id}/historico`);
  redirect(`/rh/colaboradores/${employee.id}/documentos`);
}

const Field = ({ name, label, placeholder, type = "text", required = false }: { name: string; label: string; placeholder: string; type?: string; required?: boolean }) => (
  <label className="block"><span className="text-xs font-semibold text-slate-600">{label}{required ? <span className="text-rose-500"> *</span> : null}</span><input name={name} required={required} type={type} placeholder={placeholder} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
);

const SelectField = ({ name, label, children, required = false }: { name: string; label: string; children: React.ReactNode; required?: boolean }) => (
  <label className="block"><span className="text-xs font-semibold text-slate-600">{label}{required ? <span className="text-rose-500"> *</span> : null}</span><select name={name} required={required} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50">{children}</select></label>
);

export default async function NewEmployeePage() {
  const actor = await hrdpPermission.colaboradores("create");
  const companyId = actor.companyId;
  const [branches, departments, positions, managers] = await Promise.all([
    prisma.branch.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrDepartment.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrPosition.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrEmployee.findMany({ where: { companyId, active: true, status: "ACTIVE" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);

  return <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8"><div className="mx-auto max-w-[1180px]">
    <Link href="/rh/colaboradores" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#154b7a]"><ArrowLeft className="h-4 w-4" /> Voltar para colaboradores</Link>
    <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">People Core</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Novo colaborador</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Cadastro único para RH e DP. O fluxo conduz da pré-admissão para documentos, conferência e ativação.</p></div><div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">Etapa 1 de 3 · Dados admissionais</div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold text-[#154b7a]">1. Cadastro</p><p className="mt-1 text-xs text-slate-600">Dados mínimos para iniciar a admissão.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-700">2. Documentos</p><p className="mt-1 text-xs text-slate-500">Cadastrar e conferir o dossiê.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-700">3. Ativação</p><p className="mt-1 text-xs text-slate-500">Concluir admissão e liberar RH/DP.</p></div></div>

    <form action={createEmployee} className="mt-7 space-y-5">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><UserRound className="h-5 w-5" /></div><div><h2 className="font-bold">Dados pessoais</h2><p className="text-xs text-slate-500">Identificação e contato do colaborador.</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"><div className="md:col-span-2 xl:col-span-2"><Field name="fullName" label="Nome completo" placeholder="Nome conforme documento" required /></div><Field name="cpf" label="CPF" placeholder="000.000.000-00" required /><Field name="birthDate" label="Data de nascimento" placeholder="" type="date" /><Field name="emailPersonal" label="E-mail pessoal" placeholder="nome@email.com" type="email" /><Field name="phone" label="Telefone" placeholder="(11) 99999-9999" /><Field name="rg" label="RG" placeholder="Documento de identidade" /><Field name="socialName" label="Nome social" placeholder="Opcional" /><Field name="emailCorporate" label="E-mail corporativo" placeholder="nome@empresa.com.br" type="email" /></div></section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><BriefcaseBusiness className="h-5 w-5" /></div><div><h2 className="font-bold">Vínculo e contrato</h2><p className="text-xs text-slate-500">Dados admissionais, remuneração e jornada contratada.</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Field name="hireDate" label="Data de admissão" placeholder="" type="date" required /><SelectField name="employmentType" label="Tipo de contrato" required><option value="">Selecione</option><option value="CLT">CLT</option><option value="EXPERIENCE">Experiência</option><option value="INTERN">Estágio</option><option value="APPRENTICE">Aprendiz</option><option value="CONTRACTOR">Prestador</option><option value="TEMPORARY">Temporário</option><option value="OTHER">Outro</option></SelectField><Field name="employeeNumber" label="Matrícula" placeholder="Código interno" /><Field name="baseSalary" label="Salário base" placeholder="0,00" /><Field name="weeklyHours" label="Carga horária semanal" placeholder="44" /><SelectField name="workMode" label="Regime de trabalho"><option value="">Selecione</option><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrido</option><option value="REMOTE">Remoto</option></SelectField><label className="block"><span className="text-xs font-semibold text-slate-600">Situação inicial</span><div className="mt-2 flex h-11 items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700">Pré-admissão</div></label></div></section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Building2 className="h-5 w-5" /></div><div><h2 className="font-bold">Estrutura organizacional</h2><p className="text-xs text-slate-500">Unidade, departamento, cargo e liderança.</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4"><SelectField name="branchId" label="Unidade"><option value="">Sem unidade definida</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField name="departmentId" label="Departamento"><option value="">Sem departamento definido</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField name="positionId" label="Cargo"><option value="">Sem cargo definido</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField name="managerId" label="Gestor imediato"><option value="">Sem gestor definido</option>{managers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</SelectField></div></section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><FileText className="h-5 w-5" /></div><div><h2 className="font-bold">Observações</h2><p className="text-xs text-slate-500">Contexto adicional sem substituir documentos do dossiê.</p></div></div><textarea name="notes" rows={4} placeholder="Observações admissionais" className="mt-6 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></section>

      <div className="flex flex-col justify-between gap-3 rounded-3xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 h-5 w-5 text-[#154b7a]" /><div><p className="text-sm font-bold text-[#0b2947]">Próxima etapa: documentos</p><p className="mt-1 text-xs leading-5 text-slate-600">O colaborador será criado em pré-admissão. Depois anexe e confira os documentos antes da ativação.</p></div></div><ServerSubmitButton idleLabel="Salvar e continuar para documentos" pendingLabel="Salvando colaborador..." className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-6 text-sm font-semibold text-white transition hover:bg-[#123d64] disabled:cursor-wait disabled:opacity-60"><Save className="h-4 w-4" /></ServerSubmitButton></div>
    </form>
  </div></main>;
}
