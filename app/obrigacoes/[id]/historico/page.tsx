import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireObligationActor } from "@/modules/obligations/server/obligationAuth";

const ACTION_LABELS: Record<string, string> = {
  OBLIGATION_CREATED: "Obrigação criada",
  OBLIGATION_UPDATED: "Obrigação atualizada",
  OBLIGATION_STATUS_CHANGED: "Status alterado",
  OBLIGATION_COMPLETED: "Obrigação concluída",
  OBLIGATION_CANCELED: "Obrigação cancelada",
  OBLIGATION_REOPENED: "Obrigação reaberta",
};

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(value);
}

export default async function ObligationHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireObligationActor();
  const { id } = await params;
  const obligation = await prisma.obligation.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true, title: true } });
  if (!obligation) notFound();

  const events = await prisma.hrAuditEvent.findMany({
    where: { companyId: actor.companyId, entityType: "Obligation", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1000px]">
    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Operação auditável</p>
    <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Histórico · {obligation.title}</h1>
    <p className="mt-2 text-sm text-slate-600">Criação, edição e mudanças de status persistidas no mesmo ciclo transacional da obrigação.</p>
    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">{events.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Nenhum evento auditável encontrado.</div> : <div className="divide-y divide-slate-100">{events.map((event)=><article key={event.id} className="grid gap-2 p-5 md:grid-cols-[170px_1fr] md:items-start"><time className="text-xs font-medium text-slate-400">{dateTime(event.createdAt)}</time><div><p className="text-sm font-semibold text-slate-800">{ACTION_LABELS[event.action] ?? event.action}</p><p className="mt-1 text-xs text-slate-500">Ator: {event.actorUserId ? "usuário autenticado" : "sistema"}</p></div></article>)}</div>}</section>
  </div></main>;
}
