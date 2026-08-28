import { revalidatePath } from "next/cache";
import { Building2, BriefcaseBusiness, Network, Plus, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function createDepartment(formData: FormData) {
  "use server";

  const actor = await hrdpPermission.organizacao("create");
  const name = text(formData, "name");
  if (!name) throw new Error("Nome do departamento é obrigatório.");

  const branchId = text(formData, "branchId");
  if (branchId) {
    const branch = await prisma.branch.findFirst({ where: { id: branchId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!branch) throw new Error("Unidade fora do escopo autorizado.");
  }

  const department = await prisma.hrDepartment.create({
    data: {
      companyId: actor.companyId,
      branchId,
      name,
      code: text(formData, "code"),
      description: text(formData, "description"),
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "DEPARTMENT_CREATED", entityType: "HrDepartment", entityId: department.id, metadata: { name } });
  revalidatePath("/rh/organizacao");
}

async function createPosition(formData: FormData) {
  "use server";

  const actor = await hrdpPermission.organizacao("create");
  const name = text(formData, "name");
  if (!name) throw new Error("Nome do cargo é obrigatório.");

  const departmentId = text(formData, "departmentId");
  if (departmentId) {
    const department = await prisma.hrDepartment.findFirst({ where: { id: departmentId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!department) throw new Error("Departamento fora do escopo autorizado.");
  }

  const position = await prisma.hrPosition.create({
    data: {
      companyId: actor.companyId,
      departmentId,
      name,
      cbo: text(formData, "cbo"),
      description: text(formData, "description"),
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "POSITION_CREATED", entityType: "HrPosition", entityId: position.id, metadata: { name } });
  revalidatePath("/rh/organizacao");
}

async function toggleDepartment(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  const active = text(formData, "active") === "true";
  if (!id) throw new Error("Departamento inválido.");
  const department = await prisma.hrDepartment.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true, name: true } });
  if (!department) throw new Error("Departamento fora do escopo autorizado.");
  await prisma.hrDepartment.update({ where: { id }, data: { active: !active } });
  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: active ? "DEPARTMENT_DISABLED" : "DEPARTMENT_ENABLED", entityType: "HrDepartment", entityId: id, metadata: { name: department.name } });
  revalidatePath("/rh/organizacao");
}

async function togglePosition(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  const active = text(formData, "active") === "true";
  if (!id) throw new Error("Cargo inválido.");
  const position = await prisma.hrPosition.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true, name: true } });
  if (!position) throw new Error("Cargo fora do escopo autorizado.");
  await prisma.hrPosition.update({ where: { id }, data: { active: !active } });
  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: active ? "POSITION_DISABLED" : "POSITION_ENABLED", entityType: "HrPosition", entityId: id, metadata: { name: position.name } });
  revalidatePath("/rh/organizacao");
}

export default async function OrganizationPage() {
  const actor = await hrdpPermission.organizacao("view");
  const company = await prisma.company.findUnique({ where: { id: actor.companyId }, select: { id: true, name: true } });
  if (!company) throw new Error("Empresa da sessão não encontrada.");

  const [branches, departments, positions, activeEmployees] = await Promise.all([
    prisma.branch.findMany({ where: { companyId: company.id }, orderBy: { name: "asc" }, select: { id: true, name: true, active: true } }),
    prisma.hrDepartment.findMany({ where: { companyId: company.id }, orderBy: [{ active: "desc" }, { name: "asc" }], include: { _count: { select: { employees: true, positions: true } } } }),
    prisma.hrPosition.findMany({ where: { companyId: company.id }, orderBy: [{ active: "desc" }, { name: "asc" }], include: { department: { select: { name: true } }, _count: { select: { employees: true } } } }),
    prisma.hrEmployee.count({ where: { companyId: company.id, active: true, status: "ACTIVE" } }),
  ]);

  const metrics = [
    { label: "Unidades", value: String(branches.filter((item) => item.active).length), icon: Building2 },
    { label: "Departamentos", value: String(departments.filter((item) => item.active).length), icon: Network },
    { label: "Cargos", value: String(positions.filter((item) => item.active).length), icon: BriefcaseBusiness },
    { label: "Colaboradores ativos", value: String(activeEmployees), icon: UsersRound },
  ];

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">RH · Organização</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Estrutura Organizacional</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Departamentos, cargos, unidades e capacidade instalada da estrutura de pessoas de {company.name}.</p></div>
          <div className="rounded-2xl border border-blue-100 bg-[#eef6fc] px-4 py-3 text-xs font-semibold text-[#154b7a]">People Core · estrutura persistente</div>
        </div>
        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3fb] text-[#154b7a]"><Icon className="h-4 w-4" /></div></div><p className="mt-4 text-3xl font-bold tracking-tight text-[#0b2947]">{value}</p></article>)}</section>
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Novo departamento</h2><p className="text-xs text-slate-500">Crie setores e vincule-os a uma unidade quando aplicável.</p></div></div><form action={createDepartment} className="mt-5 grid gap-4 md:grid-cols-2"><label className="block"><span className="text-xs font-semibold text-slate-600">Nome *</span><input required name="name" placeholder="Ex.: Recursos Humanos" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><label className="block"><span className="text-xs font-semibold text-slate-600">Código</span><input name="code" placeholder="RH" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><label className="block"><span className="text-xs font-semibold text-slate-600">Unidade</span><select name="branchId" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Todas / corporativo</option>{branches.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block"><span className="text-xs font-semibold text-slate-600">Descrição</span><input name="description" placeholder="Escopo do departamento" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><button className="md:col-span-2 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white">Cadastrar departamento</button></form></article>
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><BriefcaseBusiness className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Novo cargo</h2><p className="text-xs text-slate-500">Cadastre cargos e associe-os à estrutura organizacional.</p></div></div><form action={createPosition} className="mt-5 grid gap-4 md:grid-cols-2"><label className="block"><span className="text-xs font-semibold text-slate-600">Cargo *</span><input required name="name" placeholder="Ex.: Analista de RH" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><label className="block"><span className="text-xs font-semibold text-slate-600">CBO</span><input name="cbo" placeholder="Código CBO" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><label className="block"><span className="text-xs font-semibold text-slate-600">Departamento</span><select name="departmentId" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Sem departamento</option>{departments.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block"><span className="text-xs font-semibold text-slate-600">Descrição</span><input name="description" placeholder="Responsabilidades principais" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label><button className="md:col-span-2 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white">Cadastrar cargo</button></form></article>
        </section>
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="border-b border-slate-100 p-6"><h2 className="font-bold text-[#0b2947]">Departamentos</h2><p className="mt-1 text-xs text-slate-500">Estrutura atual e quantidade de pessoas/cargos vinculados.</p></div><div className="divide-y divide-slate-100">{departments.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum departamento cadastrado.</p> : departments.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-5"><div><div className="flex items-center gap-2"><p className="font-semibold text-slate-800">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "ATIVO" : "INATIVO"}</span></div><p className="mt-1 text-xs text-slate-500">{item._count.employees} pessoas · {item._count.positions} cargos</p></div><form action={toggleDepartment}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(item.active)} /><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{item.active ? "Desativar" : "Ativar"}</button></form></div>)}</div></article>
          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="border-b border-slate-100 p-6"><h2 className="font-bold text-[#0b2947]">Cargos</h2><p className="mt-1 text-xs text-slate-500">Catálogo de funções e alocação atual.</p></div><div className="divide-y divide-slate-100">{positions.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum cargo cadastrado.</p> : positions.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-5"><div><div className="flex items-center gap-2"><p className="font-semibold text-slate-800">{item.name}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "ATIVO" : "INATIVO"}</span></div><p className="mt-1 text-xs text-slate-500">{item.department?.name ?? "Sem departamento"} · {item._count.employees} pessoas{item.cbo ? ` · CBO ${item.cbo}` : ""}</p></div><form action={togglePosition}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(item.active)} /><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{item.active ? "Desativar" : "Ativar"}</button></form></div>)}</div></article>
        </section>
      </div>
    </main>
  );
}
