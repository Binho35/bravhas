import Link from "next/link";
import { revalidatePath } from "next/cache";
import { BadgeCheck, ClipboardCheck, UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";

async function activateEmployee(formData: FormData) {
  "use server";
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId) throw new Error("Colaborador inválido.");
  await prisma.hrEmployee.update({ where: { id: employeeId }, data: { status: "ACTIVE", active: true } });
  revalidatePath("/rh/admissoes");
  revalidatePath("/rh/colaboradores");
  revalidatePath("/pessoas");
}

export default async function AdmissionsPage() {
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  const companyId = company?.id;
  const admissions = companyId ? await prisma.hrEmployee.findMany({
    where: { companyId, status: "PRE_ADMISSION" },
    orderBy: [{ hireDate: "asc" }, { createdAt: "asc" }],
    include: { department: true, position: true, documents: true, benefitEnrollments: true },
  }) : [];
  const pendingDocs = admissions.reduce((sum, item) => sum + item.documents.filter((doc) => !doc.verifiedAt).length, 0);
  const next30 = new Date(); next30.setDate(next30.getDate() + 30);
  const startsSoon = admissions.filter((item) => item.hireDate && item.hireDate <= next30).length;

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">RH · Admissões</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Admissões</h1><p className="mt-2 text-sm text-slate-600">Pipeline da pré-admissão até a liberação final do colaborador.</p></div><Link href="/rh/colaboradores/novo" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white"><UserPlus className="h-4 w-4"/>Nova admissão</Link></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Em pré-admissão",admissions.length],["Documentos pendentes",pendingDocs],["Inícios próximos",startsSoon],["Com benefícios",admissions.filter(i=>i.benefitEnrollments.length>0).length]].map(([l,v])=><article key={String(l)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{l}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(v)}</strong></article>)}</section>
    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><ClipboardCheck className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Pipeline de entrada</h2><p className="text-xs text-slate-500">Conferência de vínculo, documentos e benefícios.</p></div></div>{admissions.length===0?<div className="p-14 text-center"><BadgeCheck className="mx-auto h-7 w-7 text-emerald-600"/><h3 className="mt-3 font-bold text-slate-700">Nenhuma pré-admissão pendente</h3></div>:<div className="divide-y divide-slate-100">{admissions.map(item=><div key={item.id} className="grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_1fr_140px] md:items-center"><div><Link href={`/rh/colaboradores/${item.id}`} className="font-semibold text-[#0b2947] hover:underline">{item.fullName}</Link><p className="mt-1 text-xs text-slate-400">{item.position?.name??"Cargo não definido"} · {item.department?.name??"Setor não definido"}</p></div><div className="text-sm text-slate-600"><p>Início</p><strong className="font-semibold text-slate-800">{item.hireDate?new Intl.DateTimeFormat("pt-BR").format(item.hireDate):"—"}</strong></div><div className="text-sm text-slate-600"><p>{item.documents.length} documentos</p><p>{item.benefitEnrollments.length} benefícios</p></div><form action={activateEmployee}><input type="hidden" name="employeeId" value={item.id}/><button className="h-10 rounded-2xl bg-emerald-600 px-4 text-xs font-semibold text-white">Concluir admissão</button></form></div>)}</div>}</section>
  </div></main>;
}
