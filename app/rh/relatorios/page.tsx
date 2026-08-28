import { Activity, CalendarDays, FileWarning, Headphones, UserMinus, UserPlus, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";

function pct(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export default async function HrReportsPage() {
  const actor = await hrdpPermission.relatorios("view");
  const company = await prisma.company.findFirst({ where: { id: actor.companyId, active: true }, select: { id: true, name: true } });

  if (!company) {
    return (
      <main className="px-4 py-8 md:px-7">
        <div className="mx-auto max-w-5xl rounded-3xl border border-amber-200 bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">RH · Relatórios</p>
          <h1 className="mt-2 text-2xl font-bold text-[#0b2947]">Empresa ativa não encontrada</h1>
          <p className="mt-3 text-sm text-slate-600">Os indicadores serão liberados assim que uma empresa ativa estiver disponível.</p>
        </div>
      </main>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const next30Days = new Date(now);
  next30Days.setDate(next30Days.getDate() + 30);

  const [
    active,
    preAdmission,
    admissionsThisMonth,
    terminationsThisMonth,
    pendingPoint,
    upcomingVacations,
    openLeaves,
    activeBenefits,
    openTickets,
    departmentBreakdown,
    recentTerminations,
  ] = await Promise.all([
    prisma.hrEmployee.count({ where: { companyId: company.id, active: true, status: "ACTIVE" } }),
    prisma.hrEmployee.count({ where: { companyId: company.id, active: true, status: "PRE_ADMISSION" } }),
    prisma.hrEmployee.count({ where: { companyId: company.id, hireDate: { gte: monthStart, lt: nextMonth } } }),
    prisma.hrEmployee.count({ where: { companyId: company.id, terminationDate: { gte: monthStart, lt: nextMonth } } }),
    prisma.hrTimeOccurrence.count({ where: { companyId: company.id, status: "PENDING" } }),
    prisma.hrVacationRequest.count({ where: { companyId: company.id, status: "APPROVED", startDate: { gte: now, lte: next30Days } } }),
    prisma.hrLeaveRequest.count({ where: { companyId: company.id, status: { in: ["PENDING", "APPROVED"] }, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] } }),
    prisma.hrBenefitEnrollment.count({ where: { companyId: company.id, active: true } }),
    prisma.hrTicket.count({ where: { companyId: company.id, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_EMPLOYEE"] } } }),
    prisma.hrDepartment.findMany({
      where: { companyId: company.id, active: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { employees: { where: { active: true, status: "ACTIVE" } } } } },
    }),
    prisma.hrEmployee.findMany({
      where: { companyId: company.id, terminationDate: { not: null } },
      orderBy: { terminationDate: "desc" },
      take: 5,
      select: { id: true, fullName: true, terminationDate: true, position: { select: { name: true } }, department: { select: { name: true } } },
    }),
  ]);

  const turnoverBase = active + terminationsThisMonth;
  const turnover = turnoverBase > 0 ? (terminationsThisMonth / turnoverBase) * 100 : 0;
  const totalDepartmentPeople = departmentBreakdown.reduce((sum, item) => sum + item._count.employees, 0);

  const cards = [
    { label: "Headcount ativo", value: String(active), helper: `${preAdmission} em pré-admissão`, icon: UsersRound },
    { label: "Admissões no mês", value: String(admissionsThisMonth), helper: "Entradas na competência", icon: UserPlus },
    { label: "Desligamentos no mês", value: String(terminationsThisMonth), helper: `Turnover aprox. ${pct(turnover)}`, icon: UserMinus },
    { label: "Pendências de ponto", value: String(pendingPoint), helper: "Aguardando tratamento", icon: FileWarning },
  ];

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">RH · Relatórios</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Indicadores de Pessoas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Painel executivo conectado ao People Core de {company.name}, com visão da competência atual e alertas operacionais.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">Dados consolidados em tempo real</div>
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, helper, icon: Icon }) => (
            <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3fb] text-[#154b7a]"><Icon className="h-4 w-4" /></div></div>
              <p className="mt-4 text-3xl font-bold tracking-tight text-[#0b2947]">{value}</p>
              <p className="mt-2 text-xs text-slate-500">{helper}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-5"><CalendarDays className="h-5 w-5 text-[#154b7a]" /><p className="mt-4 text-xs font-semibold text-slate-500">Férias nos próximos 30 dias</p><p className="mt-2 text-2xl font-bold text-[#0b2947]">{upcomingVacations}</p></article>
          <article className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-5"><Activity className="h-5 w-5 text-[#154b7a]" /><p className="mt-4 text-xs font-semibold text-slate-500">Afastamentos em curso</p><p className="mt-2 text-2xl font-bold text-[#0b2947]">{openLeaves}</p></article>
          <article className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-5"><UsersRound className="h-5 w-5 text-[#154b7a]" /><p className="mt-4 text-xs font-semibold text-slate-500">Benefícios ativos</p><p className="mt-2 text-2xl font-bold text-[#0b2947]">{activeBenefits}</p></article>
          <article className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-5"><Headphones className="h-5 w-5 text-[#154b7a]" /><p className="mt-4 text-xs font-semibold text-slate-500">Protocolos Canal RH abertos</p><p className="mt-2 text-2xl font-bold text-[#0b2947]">{openTickets}</p></article>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div><h2 className="font-bold text-[#0b2947]">Headcount por departamento</h2><p className="mt-1 text-xs text-slate-500">Distribuição dos colaboradores ativos na estrutura formal.</p></div>
            <div className="mt-6 space-y-4">
              {departmentBreakdown.length === 0 ? <p className="text-sm text-slate-500">Nenhum departamento cadastrado.</p> : departmentBreakdown.map((item) => {
                const share = totalDepartmentPeople > 0 ? (item._count.employees / totalDepartmentPeople) * 100 : 0;
                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-slate-700">{item.name}</span><span className="text-slate-500">{item._count.employees} · {pct(share)}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#154b7a]" style={{ width: `${Math.min(100, share)}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-100 p-6"><h2 className="font-bold text-[#0b2947]">Desligamentos recentes</h2><p className="mt-1 text-xs text-slate-500">Últimos registros formalizados no People Core.</p></div>
            <div className="divide-y divide-slate-100">
              {recentTerminations.length === 0 ? <p className="p-6 text-sm text-slate-500">Nenhum desligamento registrado.</p> : recentTerminations.map((item) => (
                <div key={item.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-800">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.position?.name ?? "Cargo não informado"} · {item.department?.name ?? "Sem departamento"}</p></div><span className="whitespace-nowrap text-xs font-medium text-slate-500">{item.terminationDate ? new Intl.DateTimeFormat("pt-BR").format(item.terminationDate) : "—"}</span></div></div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
