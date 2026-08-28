import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BarChart3, CheckCircle2, MessageSquareText, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function protocol() {
  return `DES-${Date.now().toString(36).toUpperCase()}`;
}

async function createReview(formData: FormData) {
  "use server";

  const actor = await hrdpPermission.desempenho("create");
  const employeeId = text(formData, "employeeId");
  const subject = text(formData, "subject");
  const description = text(formData, "description");
  if (!employeeId || !subject || !description) throw new Error("Colaborador, ciclo e registro são obrigatórios.");

  const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId }, select: { id: true } });
  if (!employee) throw new Error("Colaborador fora do escopo autorizado.");

  const review = await prisma.hrTicket.create({
    data: {
      companyId: actor.companyId,
      employeeId,
      protocol: protocol(),
      category: "DESEMPENHO",
      subject,
      description,
      priority: text(formData, "priority") ?? "NORMAL",
      assignedTo: text(formData, "assignedTo"),
      status: "OPEN",
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "PERFORMANCE_REVIEW_CREATED", entityType: "HrTicket", entityId: review.id, metadata: { employeeId, subject } });
  revalidatePath("/rh/desempenho");
}

async function updateReview(formData: FormData) {
  "use server";

  const actor = await hrdpPermission.desempenho("edit");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || !status) throw new Error("Avaliação inválida.");
  if (!["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE", "RESOLVED", "CLOSED"].includes(status)) throw new Error("Status inválido.");

  const review = await prisma.hrTicket.findFirst({ where: { id, companyId: actor.companyId, category: "DESEMPENHO" }, select: { id: true, status: true } });
  if (!review) throw new Error("Avaliação não encontrada no escopo autorizado.");

  await prisma.hrTicket.update({
    where: { id: review.id },
    data: {
      status: status as "OPEN" | "IN_PROGRESS" | "WAITING_EMPLOYEE" | "RESOLVED" | "CLOSED",
      resolvedAt: ["RESOLVED", "CLOSED"].includes(status) ? new Date() : null,
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "PERFORMANCE_REVIEW_STATUS_CHANGED", entityType: "HrTicket", entityId: review.id, metadata: { from: review.status, to: status } });
  revalidatePath("/rh/desempenho");
}

const statusLabel: Record<string, string> = { OPEN: "Aberta", IN_PROGRESS: "Em acompanhamento", WAITING_EMPLOYEE: "Aguardando colaborador", RESOLVED: "Concluída", CLOSED: "Arquivada" };
const priorityLabel: Record<string, string> = { NORMAL: "Regular", ATENCAO: "Ponto de atenção", DESTAQUE: "Destaque" };

export default async function PerformancePage() {
  const actor = await hrdpPermission.desempenho("view");
  const [employees, reviews] = await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId: actor.companyId, active: true, status: { in: ["ACTIVE", "ON_LEAVE"] } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, position: { select: { name: true } }, department: { select: { name: true } } } }),
    prisma.hrTicket.findMany({ where: { companyId: actor.companyId, category: "DESEMPENHO" }, orderBy: { createdAt: "desc" }, take: 100, include: { employee: { select: { id: true, fullName: true } } } }),
  ]);

  const open = reviews.filter((item) => ["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE"].includes(item.status)).length;
  const completed = reviews.filter((item) => item.status === "RESOLVED").length;
  const attention = reviews.filter((item) => item.priority === "ATENCAO" && !["RESOLVED", "CLOSED"].includes(item.status)).length;

  return (
    <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
      <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">RH · Desempenho</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Desempenho e Desenvolvimento</h1><p className="mt-2 text-sm text-slate-600">Ciclos de avaliação, feedbacks, pontos de atenção, destaques e acompanhamento do desenvolvimento individual.</p></div>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Avaliações abertas",open],["Pontos de atenção",attention],["Concluídas",completed],["Colaboradores ativos",employees.length]].map(([label,value])=><article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
        <form action={createReview} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Novo acompanhamento</h2><p className="text-xs text-slate-500">Registre avaliação, feedback, 1:1 ou PDI.</p></div></div><div className="mt-5 space-y-4"><select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{employees.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select><input name="subject" required placeholder="Ciclo / assunto do acompanhamento" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /><select name="priority" defaultValue="NORMAL" className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="NORMAL">Regular</option><option value="ATENCAO">Ponto de atenção</option><option value="DESTAQUE">Destaque</option></select><input name="assignedTo" placeholder="Responsável pelo acompanhamento" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /><textarea name="description" required rows={6} placeholder="Feedback, evidências, metas, combinados e próximos passos" className="w-full rounded-2xl border border-slate-200 p-4 text-sm" /><button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] text-sm font-semibold text-white"><MessageSquareText className="h-4 w-4" />Registrar acompanhamento</button></div></form>
        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><BarChart3 className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Acompanhamentos</h2><p className="text-xs text-slate-500">Histórico recente de desempenho e desenvolvimento.</p></div></div>{reviews.length===0?<div className="p-14 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600"/><p className="mt-3 text-sm text-slate-500">Nenhum acompanhamento registrado.</p></div>:<div className="divide-y divide-slate-100">{reviews.map((item)=><div key={item.id} className="grid gap-3 p-5 lg:grid-cols-[1.4fr_1fr_150px_190px] lg:items-center"><div>{item.employee?<Link href={`/rh/colaboradores/${item.employee.id}`} className="font-semibold text-[#0b2947] hover:underline">{item.employee.fullName}</Link>:<p className="font-semibold text-slate-700">Colaborador não vinculado</p>}<p className="mt-1 text-sm text-slate-700">{item.subject}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p></div><div className="text-sm text-slate-600"><p className="text-xs text-slate-400">Responsável</p><p>{item.assignedTo??"Não definido"}</p><p className="mt-1 text-xs font-semibold text-[#154b7a]">{priorityLabel[item.priority]??item.priority}</p></div><span className="w-fit rounded-full bg-[#eaf3fb] px-2.5 py-1 text-[11px] font-semibold text-[#154b7a]">{statusLabel[item.status]??item.status}</span><form action={updateReview} className="flex gap-2"><input type="hidden" name="id" value={item.id}/><select name="status" defaultValue={item.status} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-2 text-xs"><option value="OPEN">Aberta</option><option value="IN_PROGRESS">Em acompanhamento</option><option value="WAITING_EMPLOYEE">Aguardando colaborador</option><option value="RESOLVED">Concluída</option><option value="CLOSED">Arquivada</option></select><button className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700">Salvar</button></form></div>)}</div>}</article>
      </section>
    </div></main>
  );
}
