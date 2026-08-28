import { CalendarCheck2, CheckCircle2, Clock3, FileSpreadsheet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";

export default async function PayrollPage() {
  const actor = await hrdpPermission.folha("view");
  const companyId = actor.companyId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const [activeEmployees, pendingPoint, leaves, vacations, benefits] = await Promise.all([
    prisma.hrEmployee.count({ where: { companyId, active: true, status: "ACTIVE" } }),
    prisma.hrTimeOccurrence.count({ where: { companyId, referenceDate: { gte: monthStart, lte: monthEnd }, status: { in: ["PENDING", "DRAFT"] } } }),
    prisma.hrLeaveRequest.count({ where: { companyId, startDate: { lte: monthEnd }, OR: [{ endDate: null }, { endDate: { gte: monthStart } }] } }),
    prisma.hrVacationRequest.count({ where: { companyId, startDate: { lte: monthEnd }, endDate: { gte: monthStart }, status: { in: ["APPROVED", "COMPLETED"] } } }),
    prisma.hrBenefitEnrollment.count({ where: { companyId, active: true } }),
  ]);
  const competence = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now);
  const readiness = pendingPoint === 0 ? "Pronta para conferência" : "Com pendências";
  const items = [
    ["Base de colaboradores", `${activeEmployees} ativos`, activeEmployees > 0],
    ["Ponto e jornada", pendingPoint === 0 ? "Sem pendências" : `${pendingPoint} pendências`, pendingPoint === 0],
    ["Afastamentos", `${leaves} no período`, true],
    ["Férias", `${vacations} no período`, true],
    ["Benefícios", `${benefits} vínculos ativos`, true],
  ];
  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Folha</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Folha e Fechamento</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Cockpit de conferência das variáveis que alimentam a folha. O BravHAS consolida evidências e pendências sem substituir o motor contábil nesta etapa.</p></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Competência",competence],["Colaboradores",activeEmployees],["Pendências de ponto",pendingPoint],["Status",readiness]].map(([l,v])=><article key={String(l)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{l}</p><strong className="mt-2 block text-xl text-[#0b2947]">{String(v)}</strong></article>)}</section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 pb-4"><FileSpreadsheet className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Checklist de fechamento</h2><p className="text-xs text-slate-500">Conferência executiva da competência atual.</p></div></div><div className="mt-2 divide-y divide-slate-100">{items.map(([label,detail,ok])=><div key={String(label)} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold text-slate-800">{String(label)}</p><p className="mt-1 text-sm text-slate-500">{String(detail)}</p></div>{ok?<CheckCircle2 className="h-5 w-5 text-emerald-600"/>:<Clock3 className="h-5 w-5 text-amber-600"/>}</div>)}</div></article>
    <aside className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154b7a]"><CalendarCheck2 className="h-5 w-5"/></div><h2 className="mt-4 font-bold text-[#0b2947]">Governança de fechamento</h2><p className="mt-2 text-sm leading-6 text-slate-600">O fechamento só deve avançar após tratamento do ponto, conferência de afastamentos, férias, benefícios e variáveis autorizadas. Cada origem permanece rastreável no dossiê funcional.</p><div className="mt-5 rounded-2xl border border-white bg-white/80 p-4"><p className="text-xs font-semibold text-slate-500">Situação da competência</p><p className={`mt-2 font-bold ${pendingPoint===0?"text-emerald-700":"text-amber-700"}`}>{readiness}</p></div></aside></section>
  </div></main>;
}
