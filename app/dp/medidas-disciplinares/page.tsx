import { revalidatePath } from "next/cache";
import { AlertTriangle, FileWarning, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function createAction(formData: FormData) {
  "use server";
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  if (!company) throw new Error("Empresa ativa não encontrada.");
  const employeeId = text(formData, "employeeId");
  const type = text(formData, "type") as "VERBAL_GUIDANCE" | "WRITTEN_WARNING" | "SUSPENSION" | "TERMINATION_FOR_CAUSE" | null;
  const occurredAt = text(formData, "occurredAt");
  const reason = text(formData, "reason");
  if (!employeeId || !type || !occurredAt || !reason) throw new Error("Preencha os campos obrigatórios.");

  await prisma.hrDisciplinaryAction.create({
    data: {
      companyId: company.id,
      employeeId,
      type,
      occurredAt: new Date(`${occurredAt}T12:00:00`),
      reason,
      description: text(formData, "description"),
      issuedBy: text(formData, "issuedBy"),
      documentKey: text(formData, "documentKey"),
    },
  });

  revalidatePath("/dp/medidas-disciplinares");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

async function acknowledgeAction(formData: FormData) {
  "use server";
  const id = text(formData, "id");
  const employeeId = text(formData, "employeeId");
  if (!id || !employeeId) throw new Error("Medida disciplinar inválida.");

  await prisma.hrDisciplinaryAction.update({ where: { id }, data: { acknowledgedAt: new Date() } });
  revalidatePath("/dp/medidas-disciplinares");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

const typeLabel: Record<string, string> = {
  VERBAL_GUIDANCE: "Orientação verbal",
  WRITTEN_WARNING: "Advertência escrita",
  SUSPENSION: "Suspensão",
  TERMINATION_FOR_CAUSE: "Justa causa",
};

export default async function DisciplinaryPage() {
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  const companyId = company?.id;
  const [employees, actions] = companyId ? await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, active: true }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.hrDisciplinaryAction.findMany({ where: { companyId }, orderBy: { occurredAt: "desc" }, take: 80, include: { employee: { select: { id: true, fullName: true } } } }),
  ]) : [[], []];

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCount = actions.filter((item) => item.occurredAt >= monthStart).length;

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Governança</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Medidas disciplinares</h1><p className="mt-2 text-sm text-slate-600">Registro formal, evidências, ciência e rastreabilidade de advertências, suspensões e demais medidas.</p></div>

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Histórico total",actions.length],["Aplicadas no mês",monthCount],["Suspensões",actions.filter((item)=>item.type==="SUSPENSION").length],["Aguardando ciência",actions.filter((item)=>!item.acknowledgedAt).length]].map(([label,value])=><article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
      <form action={createAction} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><Plus className="h-5 w-5"/></div><div><h2 className="font-bold text-[#0b2947]">Nova medida</h2><p className="text-xs text-slate-500">Registro controlado no dossiê funcional.</p></div></div><div className="mt-5 space-y-4">
        <select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{employees.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
        <select name="type" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Tipo de medida</option><option value="VERBAL_GUIDANCE">Orientação verbal</option><option value="WRITTEN_WARNING">Advertência escrita</option><option value="SUSPENSION">Suspensão</option><option value="TERMINATION_FOR_CAUSE">Justa causa</option></select>
        <input name="occurredAt" type="date" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"/>
        <input name="reason" required placeholder="Motivo objetivo" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/>
        <input name="issuedBy" placeholder="Responsável pela aplicação" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/>
        <input name="documentKey" placeholder="Referência do documento assinado" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/>
        <textarea name="description" rows={4} placeholder="Descrição dos fatos e evidências" className="w-full rounded-2xl border border-slate-200 p-4 text-sm"/>
        <button className="h-11 w-full rounded-2xl bg-[#0b2947] text-sm font-semibold text-white">Registrar medida</button>
      </div></form>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><FileWarning className="h-5 w-5 text-amber-600"/><div><h2 className="font-bold text-[#0b2947]">Histórico disciplinar</h2><p className="text-xs text-slate-500">Acesso restrito, evidência e ciência.</p></div></div>{actions.length===0?<div className="p-12 text-center text-sm text-slate-500">Nenhuma medida registrada.</div>:<div className="divide-y divide-slate-100">{actions.map((item)=><div key={item.id} className="p-5"><div className="grid gap-2 md:grid-cols-[1.3fr_1fr_1.4fr_120px] md:items-center"><div><p className="font-semibold text-slate-800">{item.employee.fullName}</p><p className="text-xs text-slate-400">{typeLabel[item.type]??item.type}</p></div><span className="text-sm text-slate-600">{new Intl.DateTimeFormat("pt-BR").format(item.occurredAt)}</span><div><p className="text-sm text-slate-600">{item.reason}</p>{item.documentKey?<p className="mt-1 text-xs text-slate-400">Documento: {item.documentKey}</p>:null}</div><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.acknowledgedAt?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{item.acknowledgedAt?"Ciente":"Sem ciência"}</span></div>{!item.acknowledgedAt?<form action={acknowledgeAction} className="mt-3 flex justify-end"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="employeeId" value={item.employee.id}/><button className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white">Registrar ciência</button></form>:<p className="mt-3 text-right text-[11px] text-slate-400">Ciência em {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(item.acknowledgedAt)}</p>}</div>)}</div>}</article>
    </section>

    <div className="mt-5 flex gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0"/><p>O sistema registra fatos e histórico. A definição da medida deve seguir política interna, análise de RH/DP e orientação jurídica quando necessária.</p></div>
  </div></main>;
}
