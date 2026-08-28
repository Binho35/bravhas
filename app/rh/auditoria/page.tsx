import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";

function formatMetadata(metadata: unknown) {
  if (!metadata) return "—";
  try {
    const text = JSON.stringify(metadata);
    return text.length > 140 ? `${text.slice(0, 137)}...` : text;
  } catch {
    return "—";
  }
}

export default async function HrdpAuditPage() {
  const actor = await hrdpPermission.auditoria("view");

  const events = await prisma.hrAuditEvent.findMany({
    where: { companyId: actor.companyId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const actorIds = Array.from(
    new Set(events.map((event) => event.actorUserId).filter((id): id is string => Boolean(id))),
  );

  const users = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds }, companyId: actor.companyId },
        select: { id: true, name: true, loginId: true },
      })
    : [];

  const usersById = new Map(users.map((user) => [user.id, user]));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Governança RH/DP
            </p>
            <h1 className="mt-2 text-3xl font-bold">Auditoria operacional</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Últimos 200 eventos registrados no RH/DP, restritos à empresa do usuário autenticado.
            </p>
          </div>
          <Link
            href="/rh"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Voltar ao RH
          </Link>
        </header>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Data</th>
                  <th className="px-5 py-4">Usuário</th>
                  <th className="px-5 py-4">Ação</th>
                  <th className="px-5 py-4">Entidade</th>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((event) => {
                  const eventActor = event.actorUserId ? usersById.get(event.actorUserId) : null;
                  return (
                    <tr key={event.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {event.createdAt.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {eventActor?.name ?? "Sistema"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {eventActor?.loginId ?? event.actorUserId ?? "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{event.action}</td>
                      <td className="px-5 py-4 text-slate-700">{event.entityType}</td>
                      <td className="max-w-48 break-all px-5 py-4 text-xs text-slate-500">
                        {event.entityId ?? "—"}
                      </td>
                      <td className="max-w-md break-words px-5 py-4 font-mono text-xs text-slate-500">
                        {formatMetadata(event.metadata)}
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Nenhum evento de auditoria registrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
