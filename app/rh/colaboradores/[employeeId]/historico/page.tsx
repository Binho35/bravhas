import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { assertEmployeeScope } from "@/modules/auth/server/rbacPolicy";

const ACTION_LABELS: Record<string, string> = {
  EMPLOYEE_CREATED: "Cadastro criado",
  EMPLOYEE_UPDATED: "Cadastro atualizado",
  EMPLOYEE_ADMISSION_COMPLETED: "Admissão concluída",
  EMPLOYEE_DOCUMENT_CREATED: "Documento adicionado",
  EMPLOYEE_DOCUMENT_UPDATED: "Documento atualizado",
  EMPLOYEE_DOCUMENT_VERIFIED: "Documento conferido",
};

function dateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function EmployeeHistoryPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const actor = await hrdpPermission.colaboradores("view");
  const { employeeId } = await params;
  await assertEmployeeScope(employeeId);

  const employee = await prisma.hrEmployee.findFirst({
    where: { id: employeeId, companyId: actor.companyId },
    select: { id: true, fullName: true, documents: { select: { id: true } } },
  });
  if (!employee) notFound();

  const documentIds = employee.documents.map((document) => document.id);
  const events = await prisma.hrAuditEvent.findMany({
    where: {
      companyId: actor.companyId,
      OR: [
        { entityType: "HrEmployee", entityId: employeeId },
        ...(documentIds.length > 0 ? [{ entityType: "HrEmployeeDocument", entityId: { in: documentIds } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1000px]">
    <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Auditoria do dossiê</p>
    <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Histórico de {employee.fullName}</h1>
    <p className="mt-2 text-sm text-slate-600">Eventos funcionais persistidos para criação, alteração, admissão e conferência documental. Metadados sensíveis não são reproduzidos nesta tela.</p>

    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {events.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">Nenhum evento auditável encontrado para este colaborador.</div> : <div className="divide-y divide-slate-100">{events.map((event) => <article key={event.id} className="grid gap-2 p-5 md:grid-cols-[170px_180px_1fr] md:items-start">
        <time className="text-xs font-medium text-slate-400">{dateTime(event.createdAt)}</time>
        <span className="w-fit rounded-full bg-[#eaf3fb] px-2.5 py-1 text-[11px] font-semibold text-[#154b7a]">{event.entityType}</span>
        <div><p className="text-sm font-semibold text-slate-800">{ACTION_LABELS[event.action] ?? event.action}</p><p className="mt-1 text-xs text-slate-500">Ator: {event.actorUserId ? "usuário autenticado" : "sistema"}</p></div>
      </article>)}</div>}
    </section>
  </div></main>;
}
