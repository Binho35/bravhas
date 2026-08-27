import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  PRE_ADMISSION: "Pré-admissão",
  ACTIVE: "Ativo",
  ON_LEAVE: "Afastado",
  TERMINATED: "Desligado",
};

const statusClass: Record<string, string> = {
  PRE_ADMISSION: "bg-amber-50 text-amber-700 ring-amber-100",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ON_LEAVE: "bg-blue-50 text-blue-700 ring-blue-100",
  TERMINATED: "bg-slate-100 text-slate-600 ring-slate-200",
};

function dateLabel(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "—";
}

function moneyLabel(value: { toString(): string } | null | undefined) {
  if (!value) return "—";
  const numeric = Number(value.toString());
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numeric)
    : "—";
}

export default async function EmployeeDossierPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;

  const employee = await prisma.hrEmployee.findUnique({
    where: { id: employeeId },
    include: {
      department: true,
      position: true,
      manager: { select: { id: true, fullName: true } },
      documents: { orderBy: { createdAt: "desc" }, take: 8 },
      timeOccurrences: { orderBy: { createdAt: "desc" }, take: 8 },
      vacationRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: {
        select: {
          documents: true,
          timeOccurrences: true,
          vacationRequests: true,
          leaveRequests: true,
          benefitEnrollments: true,
          disciplinaryActions: true,
          tickets: true,
        },
      },
    },
  });

  if (!employee) notFound();

  const branch = employee.branchId
    ? await prisma.branch.findUnique({ where: { id: employee.branchId }, select: { name: true } })
    : null;

  const summaryCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: "Documentos", value: employee._count.documents, icon: FileText },
    { label: "Ocorrências de ponto", value: employee._count.timeOccurrences, icon: BadgeCheck },
    { label: "Férias", value: employee._count.vacationRequests, icon: CalendarDays },
    { label: "Afastamentos", value: employee._count.leaveRequests, icon: HeartPulse },
  ];

  const timeline = [
    ...employee.documents.map((item) => ({ id: `doc-${item.id}`, date: item.createdAt, type: "Documento", title: item.title, detail: item.verifiedAt ? "Documento conferido" : "Aguardando conferência" })),
    ...employee.timeOccurrences.map((item) => ({ id: `point-${item.id}`, date: item.createdAt, type: "Ponto", title: item.type, detail: item.description })),
    ...employee.vacationRequests.map((item) => ({ id: `vacation-${item.id}`, date: item.createdAt, type: "Férias", title: `${dateLabel(item.startDate)} a ${dateLabel(item.endDate)}`, detail: item.status })),
    ...employee.leaveRequests.map((item) => ({ id: `leave-${item.id}`, date: item.createdAt, type: "Afastamento", title: item.type, detail: `${dateLabel(item.startDate)} a ${dateLabel(item.endDate)}` })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <Link href="/rh/colaboradores" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#154b7a]">
          <ArrowLeft className="h-4 w-4" /> Voltar para colaboradores
        </Link>

        <section className="mt-5 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_18px_60px_-34px_rgba(15,23,42,0.35)]">
          <div className="bg-gradient-to-r from-[#0b2947] via-[#103d65] to-[#154b7a] px-6 py-7 text-white md:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-white/10 ring-1 ring-white/15"><UserRound className="h-7 w-7" /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Dossiê funcional</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClass[employee.status] ?? statusClass.PRE_ADMISSION}`}>{statusLabel[employee.status] ?? employee.status}</span>
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{employee.fullName}</h1>
                  <p className="mt-2 text-sm text-blue-100">{employee.position?.name ?? "Cargo não definido"} · {employee.department?.name ?? "Departamento não definido"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Link href="/dp/ponto" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold transition hover:bg-white/15">Ponto</Link>
                <Link href="/dp/ferias" className="rounded-2xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0b2947] transition hover:bg-blue-50">Férias</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-100 px-6 py-5 text-sm md:grid-cols-2 xl:grid-cols-4 md:px-8">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#154b7a]" /><div><p className="text-[11px] text-slate-400">E-mail</p><p className="font-medium text-slate-700">{employee.emailCorporate ?? employee.emailPersonal ?? "—"}</p></div></div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#154b7a]" /><div><p className="text-[11px] text-slate-400">Telefone</p><p className="font-medium text-slate-700">{employee.phone ?? "—"}</p></div></div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#154b7a]" /><div><p className="text-[11px] text-slate-400">Unidade</p><p className="font-medium text-slate-700">{branch?.name ?? "—"}</p></div></div>
            <div className="flex items-center gap-3"><UsersRound className="h-4 w-4 text-[#154b7a]" /><div><p className="text-[11px] text-slate-400">Gestor imediato</p><p className="font-medium text-slate-700">{employee.manager?.fullName ?? "—"}</p></div></div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-medium text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{value}</strong></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Icon className="h-[18px] w-[18px]" /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><BriefcaseBusiness className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Vínculo e contrato</h2><p className="text-xs text-slate-500">Dados funcionais consolidados.</p></div></div>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                ["Matrícula", employee.employeeNumber ?? "—"],
                ["Admissão", dateLabel(employee.hireDate)],
                ["Tipo de contrato", employee.employmentType ?? "—"],
                ["Regime", employee.workMode ?? "—"],
                ["Carga semanal", employee.weeklyHours ? `${employee.weeklyHours.toString()}h` : "—"],
                ["Salário base", moneyLabel(employee.baseSalary)],
                ["CPF", employee.cpf ?? "—"],
                ["RG", employee.rg ?? "—"],
              ].map(([label, value]) => <div key={label}><dt className="text-[11px] font-medium text-slate-400">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{value}</dd></div>)}
            </dl>
          </article>

          <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4"><ShieldCheck className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Governança do dossiê</h2><p className="text-xs text-slate-500">Cobertura dos processos vinculados.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Benefícios", employee._count.benefitEnrollments],
                ["Medidas disciplinares", employee._count.disciplinaryActions],
                ["Protocolos Canal RH", employee._count.tickets],
                ["Documentos", employee._count.documents],
              ].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-[#0b2947]">{String(value)}</p></div>)}
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Histórico funcional</p><h2 className="mt-1 text-lg font-bold text-[#0b2947]">Linha do tempo</h2></div><span className="text-xs text-slate-400">Eventos mais recentes</span></div>
          {timeline.length === 0 ? (
            <div className="py-12 text-center"><p className="font-semibold text-slate-700">Nenhum evento registrado ainda</p><p className="mt-2 text-sm text-slate-500">Documentos, ponto, férias e afastamentos aparecerão aqui automaticamente.</p></div>
          ) : (
            <div className="divide-y divide-slate-100">{timeline.map((item) => <div key={item.id} className="grid gap-2 py-4 md:grid-cols-[120px_130px_1fr] md:items-start"><span className="text-xs font-medium text-slate-400">{dateLabel(item.date)}</span><span className="w-fit rounded-full bg-[#eaf3fb] px-2.5 py-1 text-[11px] font-semibold text-[#154b7a]">{item.type}</span><div><p className="text-sm font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.detail}</p></div></div>)}</div>
          )}
        </section>
      </div>
    </main>
  );
}
