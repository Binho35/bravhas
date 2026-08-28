import { revalidatePath } from "next/cache";
import { FileHeart, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function date(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? new Date(`${value}T12:00:00`) : null;
}

async function createLeave(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.afastamentos("create");
  if (!actor) throw new Error("Autenticação necessária para registrar afastamentos.");

  const employeeId = text(formData, "employeeId");
  const type = text(formData, "type");
  const startDate = date(formData, "startDate");
  if (!employeeId || !type || !startDate) throw new Error("Colaborador, tipo e início são obrigatórios.");

  const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId }, select: { id: true } });
  if (!employee) throw new Error("Colaborador fora do escopo autorizado.");

  const endDate = date(formData, "endDate");
  if (endDate && endDate < startDate) throw new Error("A data final não pode ser anterior ao início.");

  const result = await prisma.$transaction(async (tx) => {
    const leave = await tx.hrLeaveRequest.create({
      data: {
        companyId: actor.companyId,
        employeeId,
        type,
        startDate,
        endDate,
        cid: text(formData, "cid"),
        benefitNumber: text(formData, "benefitNumber"),
        notes: text(formData, "notes"),
      },
    });
    await tx.hrEmployee.update({ where: { id: employeeId }, data: { status: "ON_LEAVE" } });
    return leave;
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "LEAVE_REQUEST_CREATED", entityType: "HrLeaveRequest", entityId: result.id, metadata: { employeeId, type } });

  revalidatePath("/dp/afastamentos");
  revalidatePath("/pessoas");
  revalidatePath("/rh/colaboradores");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

async function reviewLeave(formData: FormData) {
  "use server";
  const decision = text(formData, "decision");
  if (!decision) throw new Error("Status inválido.");
  const actor = await hrdpPermission.afastamentos(decision === "COMPLETED" ? "edit" : "approve");
  if (!actor) throw new Error("Autenticação necessária para revisar afastamentos.");

  const id = text(formData, "id");
  const employeeId = text(formData, "employeeId");
  if (!id || !employeeId) throw new Error("Afastamento inválido.");
  if (!["APPROVED", "REJECTED", "COMPLETED", "CANCELED"].includes(decision)) throw new Error("Status inválido.");

  const leave = await prisma.hrLeaveRequest.findFirst({ where: { id, employeeId, companyId: actor.companyId }, select: { endDate: true, status: true } });
  if (!leave) throw new Error("Afastamento fora do escopo autorizado.");

  const shouldReturn = ["REJECTED", "COMPLETED", "CANCELED"].includes(decision);
  await prisma.$transaction([
    prisma.hrLeaveRequest.update({
      where: { id },
      data: {
        status: decision as "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELED",
        endDate: decision === "COMPLETED" && !leave.endDate ? new Date() : undefined,
      },
    }),
    prisma.hrEmployee.update({ where: { id: employeeId }, data: { status: shouldReturn ? "ACTIVE" : "ON_LEAVE" } }),
  ]);

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "LEAVE_STATUS_CHANGED", entityType: "HrLeaveRequest", entityId: id, metadata: { employeeId, from: leave.status, to: decision } });

  revalidatePath("/dp/afastamentos");
  revalidatePath("/pessoas");
  revalidatePath("/rh/colaboradores");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  CANCELED: "Cancelado",
  COMPLETED: "Retorno concluído",
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-rose-50 text-rose-700",
  CANCELED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};

export default async function LeavesPage() {
  const actor = await hrdpPermission.afastamentos("view");
  if (!actor) return <main className="p-8">Autenticação necessária.</main>;
  const companyId = actor.companyId;
  const [employees, leaves] = await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, active: true, status: { in: ["ACTIVE", "ON_LEAVE"] } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.hrLeaveRequest.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 80, include: { employee: { select: { id: true, fullName: true } } } }),
  ]);

  const today = new Date();
  const active = leaves.filter((item) => ["PENDING", "APPROVED"].includes(item.status) && item.startDate <= today && (!item.endDate || item.endDate >= today)).length;

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Afastamentos</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Afastamentos</h1><p className="mt-2 text-sm text-slate-600">Atestados, licenças, previdenciário, retorno e histórico funcional com atualização automática do status do colaborador.</p></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Afastamentos ativos",active],["Registros",leaves.length],["Colaboradores",employees.length],["Pendentes",leaves.filter((i)=>i.status==="PENDING").length]].map(([label,value])=><article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
      <form action={createLeave} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5"/></div><div><h2 className="font-bold text-[#0b2947]">Registrar afastamento</h2><p className="text-xs text-slate-500">Atualiza o dossiê e o status funcional.</p></div></div><div className="mt-5 space-y-4">
        <select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{employees.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
        <select name="type" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Tipo</option><option>Atestado médico</option><option>Auxílio-doença</option><option>Acidente de trabalho</option><option>Licença maternidade</option><option>Licença paternidade</option><option>Licença não remunerada</option><option>Outro</option></select>
        <div className="grid grid-cols-2 gap-3"><input name="startDate" type="date" required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm"/><input name="endDate" type="date" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm"/></div>
        <div className="grid grid-cols-2 gap-3"><input name="cid" placeholder="CID (quando aplicável)" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm"/><input name="benefitNumber" placeholder="Benefício INSS" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm"/></div>
        <textarea name="notes" rows={3} placeholder="Observações" className="w-full rounded-2xl border border-slate-200 p-4 text-sm"/>
        <button className="h-11 w-full rounded-2xl bg-[#0b2947] text-sm font-semibold text-white">Salvar afastamento</button>
      </div></form>
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><FileHeart className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Histórico de afastamentos</h2><p className="text-xs text-slate-500">Análise, aprovação e retorno.</p></div></div>{leaves.length===0?<div className="p-12 text-center text-sm text-slate-500">Nenhum afastamento registrado.</div>:<div className="divide-y divide-slate-100">{leaves.map((item)=><div key={item.id} className="p-5"><div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1fr_130px] md:items-center"><div><p className="font-semibold text-slate-800">{item.employee.fullName}</p><p className="text-xs text-slate-400">{item.type}</p></div><span className="text-sm text-slate-600">{new Intl.DateTimeFormat("pt-BR").format(item.startDate)}</span><span className="text-sm text-slate-600">{item.endDate?new Intl.DateTimeFormat("pt-BR").format(item.endDate):"Em aberto"}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[item.status]??statusClass.PENDING}`}>{statusLabel[item.status]??item.status}</span></div>{item.status==="PENDING"?<form action={reviewLeave} className="mt-4 flex justify-end gap-2"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="employeeId" value={item.employee.id}/><button name="decision" value="APPROVED" className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white">Aprovar</button><button name="decision" value="REJECTED" className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white">Rejeitar</button></form>:item.status==="APPROVED"?<form action={reviewLeave} className="mt-4 flex justify-end"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="employeeId" value={item.employee.id}/><button name="decision" value="COMPLETED" className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white">Registrar retorno</button></form>:null}</div>)}</div>}</article>
    </section>
  </div></main>;
}
