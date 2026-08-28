import { revalidatePath } from "next/cache";
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  Clock3,
  Palmtree,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function createVacation(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.ferias("create");
  if (!actor) throw new Error("Autenticação necessária para programar férias.");

  const employeeId = text(formData, "employeeId");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  if (!employeeId || !startDate || !endDate) throw new Error("Colaborador, início e fim são obrigatórios.");

  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  if (end < start) throw new Error("A data final não pode ser anterior à data inicial.");

  const employee = await prisma.hrEmployee.findFirst({
    where: { id: employeeId, companyId: actor.companyId },
    select: { id: true, companyId: true },
  });
  if (!employee) throw new Error("Colaborador fora do escopo autorizado.");

  const sellDaysText = text(formData, "sellDays");
  const sellDays = sellDaysText ? Math.max(0, Math.min(10, Number.parseInt(sellDaysText, 10) || 0)) : 0;

  const request = await prisma.hrVacationRequest.create({
    data: {
      companyId: actor.companyId,
      employeeId,
      startDate: start,
      endDate: end,
      sellDays,
      advance13th: formData.get("advance13th") === "on",
      status: "PENDING",
      notes: text(formData, "notes"),
    },
  });

  await logHrdpAudit({
    companyId: actor.companyId,
    actorUserId: actor.id,
    action: "VACATION_REQUEST_CREATED",
    entityType: "HrVacationRequest",
    entityId: request.id,
    metadata: { employeeId, startDate, endDate, sellDays },
  });

  revalidatePath("/dp/ferias");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

async function reviewVacation(formData: FormData) {
  "use server";
  const decision = text(formData, "decision");
  if (!decision) throw new Error("Decisão inválida.");

  const permissionAction = decision === "COMPLETED" ? "edit" : "approve";
  const actor = await hrdpPermission.ferias(permissionAction);
  if (!actor) throw new Error("Autenticação necessária para revisar férias.");

  const id = text(formData, "id");
  const employeeId = text(formData, "employeeId");
  if (!id || !employeeId) throw new Error("Solicitação inválida.");
  if (!["APPROVED", "REJECTED", "CANCELED", "COMPLETED"].includes(decision)) throw new Error("Decisão inválida.");

  const current = await prisma.hrVacationRequest.findFirst({
    where: { id, companyId: actor.companyId, employeeId },
    select: { id: true, status: true },
  });
  if (!current) throw new Error("Solicitação fora do escopo autorizado.");

  await prisma.hrVacationRequest.update({
    where: { id },
    data: {
      status: decision as "APPROVED" | "REJECTED" | "CANCELED" | "COMPLETED",
      approvedAt: decision === "APPROVED" ? new Date() : undefined,
      approvedBy: decision === "APPROVED" ? actor.name : undefined,
    },
  });

  await logHrdpAudit({
    companyId: actor.companyId,
    actorUserId: actor.id,
    action: "VACATION_STATUS_CHANGED",
    entityType: "HrVacationRequest",
    entityId: id,
    metadata: { employeeId, from: current.status, to: decision },
  });

  revalidatePath("/dp/ferias");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING: "Em aprovação",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELED: "Cancelada",
  COMPLETED: "Concluída",
};

const statusClass: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100",
  CANCELED: "bg-slate-100 text-slate-600 ring-slate-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export default async function VacationsPage() {
  const actor = await hrdpPermission.ferias("view");
  if (!actor) return <main className="p-8">Autenticação necessária.</main>;
  const companyId = actor.companyId;
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const [employees, requests, pending, approved, upcoming] = await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, status: "ACTIVE", active: true }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, employeeNumber: true } }),
    prisma.hrVacationRequest.findMany({ where: { companyId }, orderBy: [{ startDate: "asc" }, { createdAt: "desc" }], take: 80, include: { employee: { select: { id: true, fullName: true, employeeNumber: true } } } }),
    prisma.hrVacationRequest.count({ where: { companyId, status: "PENDING" } }),
    prisma.hrVacationRequest.count({ where: { companyId, status: "APPROVED" } }),
    prisma.hrVacationRequest.count({ where: { companyId, status: "APPROVED", startDate: { gte: now, lte: in30Days } } }),
  ]);

  const metrics = [
    { label: "Em aprovação", value: pending, icon: Clock3 },
    { label: "Aprovadas", value: approved, icon: BadgeCheck },
    { label: "Próximos 30 dias", value: upcoming, icon: CalendarClock },
    { label: "Base ativa", value: employees.length, icon: Palmtree },
  ];

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">DP · Férias</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Férias</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Programação, aprovação, abono, adiantamento de 13º e histórico de férias vinculados ao dossiê funcional.</p></div><div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-[#154b7a]">Gestão centralizada · aprovação rastreável</div></div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{value}</strong></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Icon className="h-[18px] w-[18px]" /></div></div></article>)}</section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[430px_1fr]">
          <form action={createVacation} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Programar férias</h2><p className="text-xs text-slate-500">Crie uma solicitação para análise do DP.</p></div></div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="text-xs font-semibold text-slate-600">Colaborador *</span><select name="employeeId" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"><option value="">Selecione</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}{item.employeeNumber ? ` · ${item.employeeNumber}` : ""}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="text-xs font-semibold text-slate-600">Início *</span><input name="startDate" type="date" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label><label className="block"><span className="text-xs font-semibold text-slate-600">Fim *</span><input name="endDate" type="date" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label></div>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Dias de abono</span><input name="sellDays" type="number" min="0" max="10" defaultValue="0" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"><input name="advance13th" type="checkbox" className="h-4 w-4 rounded" />Solicitar adiantamento do 13º</label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Observações</span><textarea name="notes" rows={3} placeholder="Informações relevantes para análise." className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm" /></label>
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-4 text-sm font-semibold text-white"><CalendarDays className="h-4 w-4" />Registrar programação</button>
            </div>
          </form>

          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Agenda</p><h2 className="mt-1 text-lg font-bold text-[#0b2947]">Programações e solicitações</h2></div><CalendarDays className="h-5 w-5 text-[#154b7a]" /></div>
            {requests.length === 0 ? <div className="px-6 py-14 text-center"><Palmtree className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 font-semibold text-slate-700">Nenhuma programação registrada</p></div> : <div className="divide-y divide-slate-100">{requests.map((item) => <div key={item.id} className="p-5"><div className="grid gap-3 md:grid-cols-[minmax(180px,1fr)_180px_120px_130px] md:items-center"><div><p className="text-sm font-semibold text-slate-800">{item.employee.fullName}</p><p className="mt-1 text-xs text-slate-400">{item.employee.employeeNumber ?? "Sem matrícula"}</p></div><div><p className="text-xs font-medium text-slate-500">{new Intl.DateTimeFormat("pt-BR").format(item.startDate)} → {new Intl.DateTimeFormat("pt-BR").format(item.endDate)}</p><p className="mt-1 text-xs text-slate-400">Abono: {item.sellDays} dia(s)</p></div><span className="text-xs text-slate-500">13º: {item.advance13th ? "Sim" : "Não"}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClass[item.status] ?? statusClass.PENDING}`}>{statusLabel[item.status] ?? item.status}</span></div>{item.status === "PENDING" ? <form action={reviewVacation} className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="employeeId" value={item.employee.id} /><button name="decision" value="APPROVED" className="h-9 rounded-xl bg-emerald-600 text-xs font-semibold text-white">Aprovar</button><button name="decision" value="REJECTED" className="h-9 rounded-xl bg-rose-600 text-xs font-semibold text-white">Rejeitar</button></form> : <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-400"><span>Aprovado por: {item.approvedBy ?? "—"}</span><span>Em: {item.approvedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.approvedAt) : "—"}</span>{item.status === "APPROVED" ? <form action={reviewVacation}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="employeeId" value={item.employee.id} /><button name="decision" value="COMPLETED" className="text-xs font-semibold text-emerald-700 hover:underline">Marcar concluída</button></form> : null}</div>}</div>)}</div>}
          </article>
        </section>
      </div>
    </main>
  );
}
