import { revalidatePath } from "next/cache";
import { MessageSquareText, Plus, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function createTicket(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.canalRh("create");
  const category = text(formData, "category");
  const subject = text(formData, "subject");
  const description = text(formData, "description");
  if (!category || !subject || !description) throw new Error("Categoria, assunto e descrição são obrigatórios.");

  const employeeId = text(formData, "employeeId");
  if (employeeId) {
    const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId, active: true }, select: { id: true } });
    if (!employee) throw new Error("Colaborador fora do escopo autorizado.");
  }

  const protocol = `RH-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
  const ticket = await prisma.hrTicket.create({
    data: {
      companyId: actor.companyId,
      employeeId,
      protocol,
      category,
      subject,
      description,
      priority: text(formData, "priority") ?? "NORMAL",
      assignedTo: text(formData, "assignedTo") ?? actor.name,
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "HR_TICKET_CREATED", entityType: "HrTicket", entityId: ticket.id, metadata: { protocol, category } });
  revalidatePath("/rh/canal-rh");
  revalidatePath("/pessoas");
}

async function updateTicket(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.canalRh("edit");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!id || !status) throw new Error("Protocolo inválido.");
  if (!["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE", "RESOLVED", "CLOSED"].includes(status)) throw new Error("Status inválido.");

  const ticket = await prisma.hrTicket.findFirst({ where: { id, companyId: actor.companyId, category: { notIn: ["RECRUTAMENTO", "DESEMPENHO"] } }, select: { id: true, protocol: true } });
  if (!ticket) throw new Error("Protocolo fora do escopo autorizado.");

  await prisma.hrTicket.update({
    where: { id },
    data: {
      status: status as "OPEN" | "IN_PROGRESS" | "WAITING_EMPLOYEE" | "RESOLVED" | "CLOSED",
      assignedTo: text(formData, "assignedTo") ?? actor.name,
      resolvedAt: ["RESOLVED", "CLOSED"].includes(status) ? new Date() : null,
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "HR_TICKET_STATUS_CHANGED", entityType: "HrTicket", entityId: id, metadata: { protocol: ticket.protocol, status } });
  revalidatePath("/rh/canal-rh");
  revalidatePath("/pessoas");
}

const statusLabel: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_EMPLOYEE: "Aguardando colaborador",
  RESOLVED: "Resolvido",
  CLOSED: "Encerrado",
};

const statusClass: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  WAITING_EMPLOYEE: "bg-violet-50 text-violet-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export default async function HrChannelPage() {
  const actor = await hrdpPermission.canalRh("view");
  const companyId = actor.companyId;

  const [employees, tickets] = await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, active: true }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.hrTicket.findMany({
      where: { companyId, category: { notIn: ["RECRUTAMENTO", "DESEMPENHO"] } },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { employee: { select: { fullName: true } } },
    }),
  ]);

  const open = tickets.filter((item) => item.status === "OPEN" || item.status === "IN_PROGRESS").length;
  const waiting = tickets.filter((item) => item.status === "WAITING_EMPLOYEE").length;

  return (
    <main className="px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">RH · Atendimento</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Canal RH</h1><p className="mt-2 text-sm text-slate-600">Atendimento humano, privado e rastreável ao colaborador, com protocolo, responsável e ciclo de resolução.</p></div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Em atendimento", open], ["Aguardando colaborador", waiting], ["Resolvidos", tickets.filter((item) => item.status === "RESOLVED").length], ["Protocolos", tickets.length]].map(([label, value]) => <article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
          <form action={createTicket} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Abrir protocolo</h2><p className="text-xs text-slate-500">Atendimento realizado por pessoas do RH.</p></div></div>
            <div className="mt-5 space-y-4">
              <select name="employeeId" className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Solicitação administrativa/sem vínculo</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
              <select name="category" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Categoria</option><option>Holerite e remuneração</option><option>Ponto e jornada</option><option>Benefícios</option><option>Férias</option><option>Documentos</option><option>Relações de trabalho</option><option>Outros</option></select>
              <input name="subject" required placeholder="Assunto" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
              <div className="grid grid-cols-2 gap-3"><select name="priority" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm"><option value="NORMAL">Prioridade normal</option><option value="HIGH">Alta</option><option value="URGENT">Urgente</option></select><input name="assignedTo" placeholder="Responsável RH" className="h-11 rounded-2xl border border-slate-200 px-3 text-sm" /></div>
              <textarea name="description" required rows={5} placeholder="Descreva a solicitação" className="w-full rounded-2xl border border-slate-200 p-4 text-sm" />
              <button className="h-11 w-full rounded-2xl bg-[#0b2947] text-sm font-semibold text-white">Gerar protocolo</button>
            </div>
          </form>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-6"><MessageSquareText className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Fila de atendimento</h2><p className="text-xs text-slate-500">Protocolos com responsável e status atual.</p></div></div>
            {tickets.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Nenhum protocolo aberto.</div> : <div className="divide-y divide-slate-100">{tickets.map((item) => <div key={item.id} className="p-5"><div className="grid gap-2 md:grid-cols-[150px_1.2fr_1fr_150px] md:items-center"><div><p className="font-semibold text-[#0b2947]">{item.protocol}</p><p className="text-xs text-slate-400">{item.category}</p></div><div><p className="font-semibold text-slate-800">{item.subject}</p><p className="text-xs text-slate-400">{item.employee?.fullName ?? "Administrativo"}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p></div><div className="text-sm text-slate-600"><p>{new Intl.DateTimeFormat("pt-BR").format(item.createdAt)}</p><p className="mt-1 text-xs text-slate-400">Responsável: {item.assignedTo ?? "Não atribuído"}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[item.status] ?? statusClass.OPEN}`}>{statusLabel[item.status] ?? item.status}</span></div><form action={updateTicket} className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_190px_110px]"><input type="hidden" name="id" value={item.id} /><input name="assignedTo" defaultValue={item.assignedTo ?? ""} placeholder="Responsável RH" className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs" /><select name="status" defaultValue={item.status} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs"><option value="OPEN">Aberto</option><option value="IN_PROGRESS">Em atendimento</option><option value="WAITING_EMPLOYEE">Aguardando colaborador</option><option value="RESOLVED">Resolvido</option><option value="CLOSED">Encerrado</option></select><button className="h-9 rounded-xl bg-[#154b7a] text-xs font-semibold text-white">Atualizar</button></form></div>)}</div>}
          </article>
        </section>

        <div className="mt-5 flex gap-3 rounded-3xl border border-blue-100 bg-[#eef6fc] p-5 text-sm text-[#0b2947]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Privacidade por padrão: o Canal RH é humano, restrito ao time autorizado e mantém histórico de atendimento para governança.</p></div>
      </div>
    </main>
  );
}
