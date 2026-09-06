import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function updateDepartment(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const branchId = text(formData, "branchId");
  if (!id) throw new Error("Departamento inválido.");
  if (!name) throw new Error("Nome do departamento é obrigatório.");

  await prisma.$transaction(async (tx) => {
    const current = await tx.hrDepartment.findFirst({ where: { id, companyId: actor.companyId } });
    if (!current) throw new Error("Departamento fora do escopo autorizado.");
    if (branchId) {
      const branch = await tx.branch.findFirst({ where: { id: branchId, companyId: actor.companyId, active: true }, select: { id: true } });
      if (!branch) throw new Error("Unidade fora do escopo autorizado.");
    }
    const duplicate = await tx.hrDepartment.findFirst({ where: { companyId: actor.companyId, name, id: { not: id } }, select: { id: true } });
    if (duplicate) throw new Error("Já existe um departamento com esse nome nesta empresa.");

    const next = { name, code: text(formData, "code"), description: text(formData, "description"), branchId };
    const changedFields = Object.entries(next).filter(([key, value]) => current[key as keyof typeof current] !== value).map(([key]) => key);
    const result = await tx.hrDepartment.updateMany({ where: { id, companyId: actor.companyId }, data: next });
    if (result.count !== 1) throw new Error("Departamento fora do escopo autorizado.");
    await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "DEPARTMENT_UPDATED", entityType: "HrDepartment", entityId: id, metadata: { changedFields } }, tx);
  });

  revalidatePath("/rh/organizacao");
  revalidatePath("/rh/organizacao/departamentos");
  revalidatePath("/rh/organizacao/cargos");
  revalidatePath("/rh/colaboradores/novo");
}

async function toggleDepartment(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  if (!id) throw new Error("Departamento inválido.");
  await prisma.$transaction(async (tx) => {
    const current = await tx.hrDepartment.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true, active: true } });
    if (!current) throw new Error("Departamento fora do escopo autorizado.");
    const result = await tx.hrDepartment.updateMany({ where: { id, companyId: actor.companyId }, data: { active: !current.active } });
    if (result.count !== 1) throw new Error("Departamento fora do escopo autorizado.");
    await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: current.active ? "DEPARTMENT_DISABLED" : "DEPARTMENT_ENABLED", entityType: "HrDepartment", entityId: id }, tx);
  });
  revalidatePath("/rh/organizacao");
  revalidatePath("/rh/organizacao/departamentos");
  revalidatePath("/rh/organizacao/cargos");
  revalidatePath("/rh/colaboradores/novo");
}

export default async function DepartmentsManagementPage() {
  const actor = await hrdpPermission.organizacao("view");
  const [branches, departments] = await Promise.all([
    prisma.branch.findMany({ where: { companyId: actor.companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrDepartment.findMany({ where: { companyId: actor.companyId }, orderBy: [{ active: "desc" }, { name: "asc" }], include: { _count: { select: { employees: true, positions: true } } } }),
  ]);

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1240px]">
    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Master data · Pessoas</p>
    <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Departamentos</h1>
    <p className="mt-2 text-sm text-slate-600">Edite e ative/inative cadastros que alimentam o fluxo de colaboradores. Alterações são tenant-scoped e auditadas.</p>
    <section className="mt-6 space-y-4">{departments.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Nenhum departamento cadastrado.</div> : departments.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-800">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item._count.employees} pessoas · {item._count.positions} cargos · {item.active ? "Ativo" : "Inativo"}</p></div><form action={toggleDepartment}><input type="hidden" name="id" value={item.id}/><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{item.active ? "Desativar" : "Ativar"}</button></form></div>
      <form action={updateDepartment} className="grid gap-3 md:grid-cols-4"><input type="hidden" name="id" value={item.id}/><label><span className="text-xs font-semibold text-slate-600">Nome</span><input aria-label={`Nome do departamento ${item.name}`} name="name" required defaultValue={item.name} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><label><span className="text-xs font-semibold text-slate-600">Código</span><input name="code" defaultValue={item.code ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><label><span className="text-xs font-semibold text-slate-600">Unidade</span><select name="branchId" defaultValue={item.branchId ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Corporativo</option>{branches.map((branch)=><option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label><label><span className="text-xs font-semibold text-slate-600">Descrição</span><input name="description" defaultValue={item.description ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><div className="md:col-span-4 flex justify-end"><button className="rounded-xl bg-[#154b7a] px-4 py-2.5 text-xs font-semibold text-white">Salvar departamento</button></div></form>
    </article>)}</section>
  </div></main>;
}
