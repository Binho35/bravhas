import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  FileWarning,
  HeartHandshake,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { PeopleShell } from "@/components/hrdp/PeopleShell";
import { prisma } from "@/lib/prisma";
import { getServerAuthUser, HRDP_ALLOWED_ROLES } from "@/modules/auth/server/session";
import type { AuthUserRole } from "@/modules/auth/types/AuthUser";

const priorities = [
  { title: "Ponto diário", description: "Trate ocorrências antes do fechamento da competência.", href: "/dp/ponto", tag: "DP" },
  { title: "Admissões", description: "Acompanhe documentos, benefícios e liberações de início.", href: "/rh/admissoes", tag: "RH" },
  { title: "Canal RH", description: "Centralize solicitações privadas e acompanhe protocolos.", href: "/rh/canal-rh", tag: "RH" },
];

async function loadDashboardMetrics(companyId: string) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [active, admissions, point, vacations, tickets] = await Promise.all([
    prisma.hrEmployee.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.hrEmployee.count({ where: { companyId, status: "PRE_ADMISSION" } }),
    prisma.hrTimeOccurrence.count({ where: { companyId, status: "PENDING" } }),
    prisma.hrVacationRequest.count({ where: { companyId, startDate: { gte: now, lte: in30Days }, status: { in: ["PENDING", "APPROVED"] } } }),
    prisma.hrTicket.count({ where: { companyId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE"] } } }),
  ]);
  return { active, admissions, point, vacations, tickets };
}

export default async function PessoasPage() {
  const actor = await getServerAuthUser();
  if (!actor) redirect("/login?next=%2Fpessoas");
  if (!HRDP_ALLOWED_ROLES.includes(actor.role as AuthUserRole)) redirect("/");

  const data = await loadDashboardMetrics(actor.companyId);
  const metrics = [
    { label: "Colaboradores ativos", value: String(data.active), helper: "Base consolidada", icon: UsersRound },
    { label: "Admissões em andamento", value: String(data.admissions), helper: "Pipeline de entrada", icon: UserPlus },
    { label: "Pendências de ponto", value: String(data.point), helper: "Gestor + RH", icon: ClipboardCheck },
    { label: "Férias próximas", value: String(data.vacations), helper: "Próximos 30 dias", icon: CalendarClock },
  ];

  return (
    <PeopleShell>
      <main className="px-4 py-7 md:px-7 md:py-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0b2947] via-[#103d65] to-[#154b7a] p-6 text-white shadow-[0_24px_80px_-32px_rgba(11,41,71,0.65)] md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><Sparkles className="h-3.5 w-3.5" aria-hidden="true"/>Gestão integrada de pessoas</div>
                <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">RH e DP em uma única visão operacional.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/90 md:text-base">Centralize colaboradores, ponto, admissões, férias, benefícios, documentos, desenvolvimento e atendimento de RH com rastreabilidade.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex"><Link href="/rh" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0b2947] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><HeartHandshake className="h-4 w-4" aria-hidden="true"/> RH</Link><Link href="/dp" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><BadgeCheck className="h-4 w-4" aria-hidden="true"/> DP</Link></div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de RH e Departamento Pessoal">
            {metrics.map((metric) => { const Icon = metric.icon; return <article key={metric.label} className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.35)]"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{metric.value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]" aria-hidden="true"><Icon className="h-5 w-5" /></div></div><p className="mt-4 text-xs font-medium text-slate-400">{metric.helper}</p></article>; })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
            <article className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.3)]">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#154b7a]">Prioridades</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">O que precisa de atenção</h2></div><FileWarning className="h-5 w-5 text-amber-500" aria-hidden="true"/></div>
              <div className="mt-5 divide-y divide-slate-100">
                {priorities.map((item) => <Link key={item.href} href={item.href} className="group flex min-h-11 items-center gap-4 py-4 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-[#eaf3fb] group-hover:text-[#154b7a]">{item.tag}</div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#154b7a]" aria-hidden="true"/></Link>)}
              </div>
            </article>

            <aside className="rounded-[30px] border border-[#cfe2f3] bg-[#f0f7fd] p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#154b7a]">Governança</p><h2 className="mt-2 text-xl font-bold tracking-tight text-[#0b2947]">Processos com responsabilidade definida.</h2><p className="mt-3 text-sm leading-6 text-slate-600">Gestores tratam sua equipe, RH faz a conferência e DP conduz o fechamento operacional. Cada ação deixa histórico.</p>
              <div className="mt-6 rounded-2xl border border-white bg-white/75 p-4"><p className="text-sm font-semibold text-slate-900">Canal RH em aberto</p><p className="mt-1 text-2xl font-bold text-[#0b2947]">{data.tickets}</p><p className="mt-1 text-xs text-slate-500">Protocolos aguardando tratamento ou retorno.</p></div>
            </aside>
          </section>
        </div>
      </main>
    </PeopleShell>
  );
}
