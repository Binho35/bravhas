import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function updatePosition(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const departmentId = text(formData, "departmentId");
  if (!id) throw new Error("Cargo inválido.");
  if (!name) throw new Error("Nome do cargo é obrigatório.");

  await prisma.$transaction(async (tx) => {
    const current = await tx.hrPosition.findFirst({ where: { id, companyId: actor.companyId } });
    if (!current) throw new Error("Cargo fora do escopo autorizado.");
    if (departmentId) {
      const department = await tx.hrDepartment.findFirst({ where: { id: departmentId, companyId: actor.companyId, active: true }, select: { id: true } });
      if (!department) throw new Error("Departamento fora do escopo autorizado.");
    }
    const duplicate = await tx.hrPosition.findFirst({ where: { companyId: actor.companyId, name, id: { not: id } }, select: { id: true } });
    if (duplicate) throw new Error("Já existe um cargo com esse nome nesta empresa.");

    const next = { name, cbo: text(formData, "cbo"), description: text(formData, "description"), departmentId };
    const changedFields = Object.entries(next).filter(([key, value]) => current[key as keyof typeof current] !== value).map(([key]) => key);
    const result = await tx.hrPosition.updateMany({ where: { id, companyId: actor.companyId }, data: next });
    if (result.count !== 1) throw new Error("Cargo fora do escopo autorizado.");
    await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "POSITION_UPDATED", entityType: "HrPosition", entityId: id, metadata: { changedFields } }, tx);
  });

  revalidatePath("/rh/organizacao");
  revalidatePath("/rh/organizacao/cargos");
  revalidatePath("/rh/colaboradores/novo");
}

async function togglePosition(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.organizacao("edit");
  const id = text(formData, "id");
  if (!id) throw new Error("Cargo inválido.");
  await prisma.$transaction(async (tx) => {
    const current = await tx.hrPosition.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true, active: true } });
    if (!current) throw new Error("Cargo fora do escopo autorizado.");
    const result = await tx.hrPosition.updateMany({ where: { id, companyId: actor.companyId }, data: { active: !current.active } });
    if (result.count !== 1) throw new Error("Cargo fora do escopo autorizado.");
    await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: current.active ? "POSITION_DISABLED" : "POSITION_ENABLED", entityType: "HrPosition", entityId: id }, tx);
  });
  revalidatePath("/rh/organizacao");
  revalidatePath("/rh/organizacao/cargos");
  revalidatePath("/rh/colaboradores/novo");
}

export default async function PositionsManagementPage() {
  const actor = await hrdpPermission.organizacao("view");
  const [departments, positions] = await Promise.all([
    prisma.hrDepartment.findMany({ where: { companyId: actor.companyId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hrPosition.findMany({ where: { companyId: actor.companyId }, orderBy: [{ active: "desc" }, { name: "asc" }], include: { department: { select: { name: true } }, _count: { select: { employees: true } } } }),
  ]);

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1240px]">
    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Master data · Pessoas</p>
    <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Cargos</h1>
    <p className="mt-2 text-sm text-slate-600">Edite e ative/inative cargos usados no cadastro funcional. Relações com departamentos são validadas no servidor.</p>
    <section className="mt-6 space-y-4">{positions.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Nenhum cargo cadastrado.</div> : positions.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-800">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item.department?.name ?? "Sem departamento"} · {item._count.employees} pessoas · {item.active ? "Ativo" : "Inativo"}</p></div><form action={togglePosition}><input type="hidden" name="id" value={item.id}/><button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">{item.active ? "Desativar" : "Ativar"}</button></form></div>
      <form action={updatePosition} className="grid gap-3 md:grid-cols-4"><input type="hidden" name="id" value={item.id}/><label><span className="text-xs font-semibold text-slate-600">Nome</span><input aria-label={`Nome do cargo ${item.name}`} name="name" required defaultValue={item.name} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><label><span className="text-xs font-semibold text-slate-600">CBO</span><input name="cbo" defaultValue={item.cbo ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><label><span className="text-xs font-semibold text-slate-600">Departamento</span><select name="departmentId" defaultValue={item.departmentId ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"><option value="">Sem departamento</option>{departments.map((department)=><option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label><span className="text-xs font-semibold text-slate-600">Descrição</span><input name="description" defaultValue={item.description ?? ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"/></label><div className="md:col-span-4 flex justify-end"><button className="rounded-xl bg-[#154b7a] px-4 py-2.5 text-xs font-semibold text-white">Salvar cargo</button></div></form>
    </article>)}</section>
  </div></main>;
}
