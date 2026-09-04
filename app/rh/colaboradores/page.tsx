import Link from "next/link";
import { BadgeCheck, FileText, Filter, Search, UserPlus, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { getEmployeeScopeWhere } from "@/modules/auth/server/rbacPolicy";

const statusLabel: Record<string, string> = { PRE_ADMISSION: "Pré-admissão", ACTIVE: "Ativo", ON_LEAVE: "Afastado", TERMINATED: "Desligado" };
const statusClass: Record<string, string> = { PRE_ADMISSION: "bg-amber-50 text-amber-700 ring-amber-100", ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-100", ON_LEAVE: "bg-blue-50 text-blue-700 ring-blue-100", TERMINATED: "bg-slate-100 text-slate-600 ring-slate-200" };
const validStatuses = ["PRE_ADMISSION", "ACTIVE", "ON_LEAVE", "TERMINATED"] as const;
type EmployeeStatusFilter = (typeof validStatuses)[number];

async function loadPeopleData(q: string, status: string) {
  const scope = await getEmployeeScopeWhere();
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);
  const normalizedStatus = validStatuses.includes(status as EmployeeStatusFilter) ? status as EmployeeStatusFilter : undefined;
  const search = q.trim();
  const employeeWhere = { ...scope, ...(normalizedStatus ? { status: normalizedStatus } : {}), ...(search ? { AND: [{ OR: [{ fullName: { contains: search, mode: "insensitive" as const } }, { cpf: { contains: search } }, { employeeNumber: { contains: search, mode: "insensitive" as const } }, { emailCorporate: { contains: search, mode: "insensitive" as const } }, { emailPersonal: { contains: search, mode: "insensitive" as const } }, { department: { name: { contains: search, mode: "insensitive" as const } } }, { position: { name: { contains: search, mode: "insensitive" as const } } }] }] } : {}) };
  const visibleEmployees = await prisma.hrEmployee.findMany({ where: employeeWhere, orderBy: { fullName: "asc" }, take: 100, include: { department: true, position: true } });
  const visibleIds = visibleEmployees.map((item) => item.id);
  const active = visibleEmployees.filter((item) => item.status === "ACTIVE").length;
  const preAdmission = visibleEmployees.filter((item) => item.status === "PRE_ADMISSION").length;
  const [pendingDocs, expiringDocs] = visibleIds.length > 0 ? await Promise.all([
    prisma.hrEmployeeDocument.count({ where: { employeeId: { in: visibleIds }, companyId: scope.companyId, verifiedAt: null } }),
    prisma.hrEmployeeDocument.count({ where: { employeeId: { in: visibleIds }, companyId: scope.companyId, expiresAt: { gte: now, lte: in30Days } } }),
  ]) : [0, 0];
  return { employees: visibleEmployees, active, preAdmission, pendingDocs, expiringDocs };
}

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await hrdpPermission.colaboradores("view");
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "";
  const data = await loadPeopleData(q, status);
  const summary = [["Colaboradores ativos", String(data.active), "Base consolidada"], ["Pré-admissões", String(data.preAdmission), "Aguardando conclusão"], ["Pendências cadastrais", String(data.pendingDocs), "Conferência RH/DP"], ["Documentos a vencer", String(data.expiringDocs), "Próximos 30 dias"]];

  return <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">People Core</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Colaboradores</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Cadastro mestre de pessoas, vínculo, unidade, setor, cargo, gestor, documentos e histórico funcional.</p></div><Link href="/rh/colaboradores/novo" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#154b7a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40"><UserPlus className="h-4 w-4" aria-hidden="true"/>Novo colaborador</Link></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de colaboradores">{summary.map(([label,value,detail],index)=><article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{value}</strong></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]" aria-hidden="true">{index===0?<UsersRound className="h-[18px] w-[18px]"/>:index===1?<UserPlus className="h-[18px] w-[18px]"/>:index===2?<BadgeCheck className="h-[18px] w-[18px]"/>:<FileText className="h-[18px] w-[18px]"/>}</div></div><p className="mt-4 text-[11px] text-slate-400">{detail}</p></article>)}</section>
    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]"><div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Base corporativa</p><h2 className="mt-1 text-lg font-bold">Todos os colaboradores</h2></div><form method="get" className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"><label htmlFor="employee-search" className="relative min-w-0 flex-1 lg:w-80"><span className="sr-only">Buscar colaborador</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/><input id="employee-search" name="q" defaultValue={q} placeholder="Nome, CPF, matrícula, cargo ou setor" className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#154b7a] focus:ring-2 focus:ring-[#154b7a]/10"/></label><label htmlFor="employee-status" className="sr-only">Filtrar por status</label><select id="employee-status" name="status" defaultValue={status} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-[#154b7a] focus:ring-2 focus:ring-[#154b7a]/10"><option value="">Todos os status</option><option value="ACTIVE">Ativos</option><option value="PRE_ADMISSION">Pré-admissão</option><option value="ON_LEAVE">Afastados</option><option value="TERMINATED">Desligados</option></select><button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#154b7a] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40"><Filter className="h-4 w-4" aria-hidden="true"/>Aplicar</button>{q||status?<Link href="/rh/colaboradores" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154b7a]/40">Limpar</Link>:null}</form></div>
    <div className="hidden grid-cols-[minmax(240px,1.4fr)_1fr_1fr_1fr_130px] border-b border-slate-100 bg-slate-50/70 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 md:grid"><span>Colaborador</span><span>Setor</span><span>Cargo</span><span>Admissão</span><span>Status</span></div>
    {data.employees.length===0?<div className="px-6 py-14 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#eaf3fb] text-[#154b7a]" aria-hidden="true"><UsersRound className="h-6 w-6"/></div><h3 className="mt-5 font-bold text-[#0b2947]">{q||status?"Nenhum resultado encontrado":"Nenhum colaborador cadastrado"}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{q||status?"Ajuste os filtros para localizar outro colaborador.":"Inicie o cadastro mestre para formar a base única de RH e Departamento Pessoal."}</p></div>:<div className="divide-y divide-slate-100">{data.employees.map(employee=><Link key={employee.id} href={`/rh/colaboradores/${employee.id}`} className="grid gap-2 px-4 py-4 text-sm transition hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#154b7a]/30 sm:px-6 md:grid-cols-[minmax(240px,1.4fr)_1fr_1fr_1fr_130px] md:items-center"><div><p className="font-semibold text-slate-900">{employee.fullName}</p><p className="mt-1 text-xs text-slate-400">{employee.employeeNumber??employee.cpf??"Sem matrícula"}</p></div><span className="text-slate-600">{employee.department?.name??"—"}</span><span className="text-slate-600">{employee.position?.name??"—"}</span><span className="text-slate-600">{employee.hireDate?new Intl.DateTimeFormat("pt-BR").format(employee.hireDate):"—"}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusClass[employee.status]??statusClass.PRE_ADMISSION}`}>{statusLabel[employee.status]??employee.status}</span></Link>)}</div>}</section>
  </div></main>;
}
