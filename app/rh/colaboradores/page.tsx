import Link from "next/link";
import {
  BadgeCheck,
  FileText,
  Filter,
  Search,
  UserPlus,
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

async function loadPeopleData() {
  try {
    const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
    if (!company) return { employees: [], active: 0, preAdmission: 0, pendingDocs: 0, expiringDocs: 0 };

    const [employees, active, preAdmission, pendingDocs, expiringDocs] = await Promise.all([
      prisma.hrEmployee.findMany({
        where: { companyId: company.id },
        orderBy: { fullName: "asc" },
        take: 100,
        include: { department: true, position: true },
      }),
      prisma.hrEmployee.count({ where: { companyId: company.id, status: "ACTIVE" } }),
      prisma.hrEmployee.count({ where: { companyId: company.id, status: "PRE_ADMISSION" } }),
      prisma.hrEmployeeDocument.count({ where: { companyId: company.id, verifiedAt: null } }),
      prisma.hrEmployeeDocument.count({
        where: {
          companyId: company.id,
          expiresAt: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { employees, active, preAdmission, pendingDocs, expiringDocs };
  } catch {
    return { employees: [], active: 0, preAdmission: 0, pendingDocs: 0, expiringDocs: 0 };
  }
}

export default async function EmployeesPage() {
  const data = await loadPeopleData();
  const summary = [
    ["Colaboradores ativos", String(data.active), "Base consolidada"],
    ["Pré-admissões", String(data.preAdmission), "Aguardando conclusão"],
    ["Pendências cadastrais", String(data.pendingDocs), "Conferência RH/DP"],
    ["Documentos a vencer", String(data.expiringDocs), "Próximos 30 dias"],
  ];

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">People Core</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Colaboradores</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cadastro mestre de pessoas, vínculo, unidade, setor, cargo, gestor, documentos e histórico funcional.</p>
          </div>

          <Link href="/rh/colaboradores/novo" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#154b7a]">
            <UserPlus className="h-4 w-4" />
            Novo colaborador
          </Link>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(([label, value, detail], index) => (
            <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-medium text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{value}</strong></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]">
                  {index === 0 ? <UsersRound className="h-[18px] w-[18px]" /> : index === 1 ? <UserPlus className="h-[18px] w-[18px]" /> : index === 2 ? <BadgeCheck className="h-[18px] w-[18px]" /> : <FileText className="h-[18px] w-[18px]" />}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-400">{detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Base corporativa</p><h2 className="mt-1 text-lg font-bold">Todos os colaboradores</h2></div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              <label className="relative min-w-0 flex-1 lg:w-80"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input disabled placeholder="Buscar por nome, CPF, cargo ou setor" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none" /></label>
              <button type="button" disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"><Filter className="h-4 w-4" />Filtros</button>
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(240px,1.4fr)_1fr_1fr_1fr_130px] border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 md:grid">
            <span>Colaborador</span><span>Setor</span><span>Cargo</span><span>Admissão</span><span>Status</span>
          </div>

          {data.employees.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#eaf3fb] text-[#154b7a]"><UsersRound className="h-6 w-6" /></div>
              <h3 className="mt-5 font-bold text-[#0b2947]">Nenhum colaborador cadastrado</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Inicie o cadastro mestre para formar a base única de RH e Departamento Pessoal.</p>
              <Link href="/rh/colaboradores/novo" className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-[#154b7a] transition hover:bg-blue-100"><UserPlus className="h-4 w-4" />Iniciar primeiro cadastro</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.employees.map((employee) => (
                <div key={employee.id} className="grid gap-2 px-6 py-4 text-sm transition hover:bg-slate-50/70 md:grid-cols-[minmax(240px,1.4fr)_1fr_1fr_1fr_130px] md:items-center">
                  <div><p className="font-semibold text-slate-900">{employee.fullName}</p><p className="mt-1 text-xs text-slate-400">{employee.employeeNumber ?? employee.cpf ?? "Sem matrícula"}</p></div>
                  <span className="text-slate-600">{employee.department?.name ?? "—"}</span>
                  <span className="text-slate-600">{employee.position?.name ?? "—"}</span>
                  <span className="text-slate-600">{employee.hireDate ? new Intl.DateTimeFormat("pt-BR").format(employee.hireDate) : "—"}</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClass[employee.status] ?? statusClass.PRE_ADMISSION}`}>{statusLabel[employee.status] ?? employee.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
