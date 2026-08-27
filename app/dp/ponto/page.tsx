import { revalidatePath } from "next/cache";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Plus,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function createOccurrence(formData: FormData) {
  "use server";

  const employeeId = text(formData, "employeeId");
  const referenceDate = text(formData, "referenceDate");
  const type = text(formData, "type");
  const description = text(formData, "description");

  if (!employeeId || !referenceDate || !type || !description) {
    throw new Error("Colaborador, data, tipo e descrição são obrigatórios.");
  }

  const employee = await prisma.hrEmployee.findUnique({
    where: { id: employeeId },
    select: { companyId: true },
  });

  if (!employee) throw new Error("Colaborador não encontrado.");

  await prisma.hrTimeOccurrence.create({
    data: {
      companyId: employee.companyId,
      employeeId,
      referenceDate: new Date(`${referenceDate}T12:00:00`),
      type,
      description,
      employeeNote: text(formData, "employeeNote"),
      status: "PENDING",
    },
  });

  revalidatePath("/dp/ponto");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

const requestLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  CANCELED: "Cancelado",
  COMPLETED: "Concluído",
};

export default async function AttendancePage() {
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  const companyId = company?.id;

  const [employees, occurrences, pending, approved] = companyId
    ? await Promise.all([
        prisma.hrEmployee.findMany({
          where: { companyId, active: true, status: { in: ["ACTIVE", "PRE_ADMISSION"] } },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true, employeeNumber: true },
        }),
        prisma.hrTimeOccurrence.findMany({
          where: { companyId },
          orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
          take: 50,
          include: { employee: { select: { id: true, fullName: true, employeeNumber: true } } },
        }),
        prisma.hrTimeOccurrence.count({ where: { companyId, status: "PENDING" } }),
        prisma.hrTimeOccurrence.count({ where: { companyId, status: "APPROVED" } }),
      ])
    : [[], [], 0, 0];

  const today = new Date();
  const todayCount = occurrences.filter((item) => item.referenceDate.toDateString() === today.toDateString()).length;

  const metrics = [
    { label: "Ocorrências hoje", value: todayCount, icon: AlertTriangle },
    { label: "Pendentes", value: pending, icon: Clock3 },
    { label: "Aprovadas", value: approved, icon: BadgeCheck },
    { label: "Colaboradores", value: employees.length, icon: UsersRound },
  ];

  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">DP · Ponto e Jornada</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Ponto e Jornada</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Tratamento diário de faltas, atrasos, marcações incompletas e demais ocorrências, com conferência por gestor e RH.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">Competência aberta · rastreabilidade ativa</div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-medium text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{value}</strong></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Icon className="h-[18px] w-[18px]" /></div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[430px_1fr]">
          <form action={createOccurrence} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5" /></div>
              <div><h2 className="font-bold text-[#0b2947]">Nova ocorrência</h2><p className="text-xs text-slate-500">Registro para tratamento e conferência.</p></div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block"><span className="text-xs font-semibold text-slate-600">Colaborador *</span><select name="employeeId" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"><option value="">Selecione</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}{item.employeeNumber ? ` · ${item.employeeNumber}` : ""}</option>)}</select></label>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="block"><span className="text-xs font-semibold text-slate-600">Data *</span><input name="referenceDate" type="date" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
                <label className="block"><span className="text-xs font-semibold text-slate-600">Tipo *</span><select name="type" required className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"><option value="">Selecione</option><option value="FALTA">Falta</option><option value="ATRASO">Atraso</option><option value="MARCAÇÃO INCOMPLETA">Marcação incompleta</option><option value="SAÍDA ANTECIPADA">Saída antecipada</option><option value="AJUSTE MANUAL">Ajuste manual</option><option value="OUTRA">Outra</option></select></label>
              </div>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Descrição *</span><textarea name="description" required rows={4} placeholder="Descreva objetivamente a ocorrência." className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-600">Justificativa do colaborador</span><textarea name="employeeNote" rows={3} placeholder="Opcional no registro inicial." className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#154b7a]"><ClipboardCheck className="h-4 w-4" />Registrar ocorrência</button>
            </div>
          </form>

          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Tratamento diário</p><h2 className="mt-1 text-lg font-bold text-[#0b2947]">Ocorrências registradas</h2></div><CalendarDays className="h-5 w-5 text-[#154b7a]" /></div>
            {occurrences.length === 0 ? (
              <div className="px-6 py-14 text-center"><ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 font-semibold text-slate-700">Nenhuma ocorrência registrada</p><p className="mt-2 text-sm text-slate-500">As ocorrências de ponto aparecerão aqui para tratamento.</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {occurrences.map((item) => (
                  <div key={item.id} className="grid gap-3 px-6 py-4 md:grid-cols-[120px_minmax(180px,1fr)_150px_minmax(220px,1.3fr)] md:items-center">
                    <span className="text-xs font-medium text-slate-500">{new Intl.DateTimeFormat("pt-BR").format(item.referenceDate)}</span>
                    <div><p className="text-sm font-semibold text-slate-800">{item.employee.fullName}</p><p className="mt-1 text-xs text-slate-400">{item.employee.employeeNumber ?? "Sem matrícula"}</p></div>
                    <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">{requestLabel[item.status] ?? item.status}</span>
                    <div><p className="text-sm font-semibold text-slate-700">{item.type}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p></div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}
