import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireObligationActor } from "@/modules/obligations/server/obligationAuth";

export default async function ObligationLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const actor = await requireObligationActor();
  const { id } = await params;
  const exists = await prisma.obligation.findFirst({ where: { id, companyId: actor.companyId }, select: { id: true } });
  if (!exists) notFound();

  return <>
    <nav aria-label="Navegação da obrigação" className="border-b border-slate-200 bg-white px-5 py-3">
      <div className="mx-auto flex max-w-[1360px] flex-wrap gap-2 text-xs font-semibold">
        <Link href={`/obrigacoes/${id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Detalhes</Link>
        <Link href={`/obrigacoes/${id}/historico`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Histórico auditável</Link>
        <Link href="/agenda" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Ver na Agenda</Link>
      </div>
    </nav>
    {children}
  </>;
}
