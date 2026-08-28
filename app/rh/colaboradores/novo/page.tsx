import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  Save,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function dateValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? new Date(`${value}T12:00:00`) : null;
}

function decimalText(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  return normalized || null;
}

async function createEmployee(formData: FormData) {
  "use server";

  const actor = await hrdpPermission.colaboradores("create");

  const fullName = text(formData, "fullName");
  if (!fullName) throw new Error("Nome completo é obrigatório.");

  const branchId = text(formData, "branchId");
  const departmentId = text(formData, "departmentId");
  const positionId = text(formData, "positionId");
  const managerId = text(formData, "managerId");

  if (branchId) {
    const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!branch) throw new Error("Unidade inválida ou fora do escopo autorizado.");
  }
  if (departmentId) {
    const department = await prisma.hrDepartment.findFirst({ where: { id: departmentId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!department) throw new Error("Departamento inválido ou fora do escopo autorizado.");
  }
  if (positionId) {
    const position = await prisma.hrPosition.findFirst({ where: { id: positionId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!position) throw new Error("Cargo inválido ou fora do escopo autorizado.");
  }
  if (managerId) {
    const manager = await prisma.hrEmployee.findFirst({ where: { id: managerId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!manager) throw new Error("Gestor inválido ou fora do escopo autorizado.");
  }

  const employmentType = text(formData, "employmentType") as "CLT" | "EXPERIENCE" | "INTERN" | "APPRENTICE" | "CONTRACTOR" | "TEMPORARY" | "OTHER" | null;
  const workMode = text(formData, "workMode") as "ONSITE" | "HYBRID" | "REMOTE" | null;

  const employee = await prisma.hrEmployee.create({
    data: {
      companyId: actor.companyId,
      branchId,
      departmentId,
      positionId,
      managerId,
      employeeNumber: text(formData, "employeeNumber"),
      fullName,
      socialName: text(formData, "socialName"),
      cpf: text(formData, "cpf"),
      rg: text(formData, "rg"),
      birthDate: dateValue(formData, "birthDate"),
      emailPersonal: text(formData, "emailPersonal"),
      emailCorporate: text(formData, "emailCorporate"),
      phone: text(formData, "phone"),
      hireDate: dateValue(formData, "hireDate"),
      employmentType,
      workMode,
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
    entityId: employee.id,
    metadata: {
      status: employee.status,
      branchId: employee.branchId,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
    },
  });

  revalidatePath("/rh/colaboradores");
  revalidatePath("/pessoas");
  revalidatePath("/rh/admissoes");
  redirect(`/rh/colaboradores/${employee.id}`);
}

const Field = ({ name, label, placeholder, type = "text", required = false }: { name: string; label: string; placeholder: string; type?: string; required?: boolean }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-600">{label}{required ? <span className="text-rose-500"> *</span> : null}</span>
    <input name={name} required={required} type={type} placeholder={placeholder} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
  </label>
);

const SelectField = ({ name, label, children }: { name: string; label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    <select name={name} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50">{children}</select>
  </label>
);

export default async function NewEmployeePage() {
  const actor = await hrdpPermission.colaboradores("view");
  const companyId = actor.companyId;

  const [branches, departments, positions, managers] = await Promise.all([
    prisma.branch.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrDepartment.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrPosition.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrEmployee.findMany({ where: { companyId, active: true, status: "ACTIVE" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
  ]);

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/rh/colaboradores" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#154b7a]"><ArrowLeft className="h-4 w-4" /> Voltar para colaboradores</Link>

        <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">People Core</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Novo colaborador</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Cadastro único para RH e DP. Novos registros entram obrigatoriamente em pré-admissão e só ficam ativos após conferência documental.</p></div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">Persistência protegida pelo People Core</div>
        </div>

        <form action={createEmployee} className="mt-7 space-y-5">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><UserRound className="h-5 w-5" /></div><div><h2 className="font-bold">Dados pessoais</h2><p className="text-xs text-slate-500">Identificação e contato do colaborador.</p></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-2"><Field name="fullName" label="Nome completo" placeholder="Nome conforme documento" required /></div>
              <Field name="cpf" label="CPF" placeholder="000.000.000-00" />
              <Field name="birthDate" label="Data de nascimento" placeholder="" type="date" />
              <Field name="emailPersonal" label="E-mail pessoal" placeholder="nome@email.com" type="email" />
              <Field name="phone" label="Telefone" placeholder="(11) 99999-9999" />
              <Field name="rg" label="RG" placeholder="Documento de identidade" />
              <Field name="socialName" label="Nome social" placeholder="Opcional" />
              <Field name="emailCorporate" label="E-mail corporativo" placeholder="nome@empresa.com.br" type="email" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><BriefcaseBusiness className="h-5 w-5" /></div><div><h2 className="font-bold">Vínculo e contrato</h2><p className="text-xs text-slate-500">Dados admissionais, remuneração e jornada contratada.</p></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field name="hireDate" label="Data de admissão" placeholder="" type="date" />
              <SelectField name="employmentType" label="Tipo de contrato"><option value="">Selecione</option><option value="CLT">CLT</option><option value="EXPERIENCE">Experiência</option><option value="INTERN">Estágio</option><option value="APPRENTICE">Aprendiz</option><option value="CONTRACTOR">Prestador</option><option value="TEMPORARY">Temporário</option><option value="OTHER">Outro</option></SelectField>
              <Field name="employeeNumber" label="Matrícula" placeholder="Código interno" />
              <Field name="baseSalary" label="Salário base" placeholder="0,00" />
              <Field name="weeklyHours" label="Carga horária semanal" placeholder="44" />
              <SelectField name="workMode" label="Regime de trabalho"><option value="">Selecione</option><option value="ONSITE">Presencial</option><option value="HYBRID">Híbrido</option><option value="REMOTE">Remoto</option></SelectField>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Situação inicial</span><div className="mt-2 flex h-11 items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700">Pré-admissão</div></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Building2 className="h-5 w-5" /></div><div><h2 className="font-bold">Estrutura organizacional</h2><p className="text-xs text-slate-500">Posição do colaborador na empresa e cadeia de liderança.</p></div></div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <SelectField name="branchId" label="Unidade"><option value="">Sem unidade definida</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
              <SelectField name="departmentId" label="Departamento"><option value="">Sem departamento definido</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
              <SelectField name="positionId" label="Cargo"><option value="">Sem cargo definido</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
              <SelectField name="managerId" label="Gestor imediato"><option value="">Sem gestor definido</option>{managers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</SelectField>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold">Observações e documentos</h2><p className="text-xs text-slate-500">Informações complementares para conferência do RH/DP.</p></div></div><label className="mt-5 block"><span className="text-xs font-semibold text-slate-600">Observações internas</span><textarea name="notes" rows={5} placeholder="Registre apenas informações necessárias ao processo de RH/DP." className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label></article>
            <aside className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154b7a] shadow-sm"><BadgeCheck className="h-5 w-5" /></div><h3 className="mt-4 font-bold text-[#0b2947]">Cadastro mestre</h3><p className="mt-2 text-sm leading-6 text-slate-600">Após salvar, o colaborador entra em pré-admissão. A ativação exige a conferência dos dados e documentos no fluxo de admissões.</p></aside>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 pb-8 sm:flex-row"><Link href="/rh/colaboradores" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600">Cancelar</Link><button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#154b7a]"><Save className="h-4 w-4" />Salvar colaborador</button></div>
        </form>
      </div>
    </main>
  );
}
