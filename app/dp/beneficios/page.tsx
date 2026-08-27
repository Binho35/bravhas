import { revalidatePath } from "next/cache";
import { Gift, Plus, WalletCards } from "lucide-react";

import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function decimal(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  return value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "") || null;
}
async function createBenefit(formData: FormData) {
  "use server";
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  if (!company) throw new Error("Empresa ativa não encontrada.");
  const employeeId = text(formData, "employeeId");
  const benefitType = text(formData, "benefitType");
  if (!employeeId || !benefitType) throw new Error("Colaborador e benefício são obrigatórios.");
  await prisma.hrBenefitEnrollment.create({
    data: {
      companyId: company.id,
      employeeId,
      benefitType,
      provider: text(formData, "provider"),
      monthlyValue: decimal(formData, "monthlyValue"),
      employeeDiscount: decimal(formData, "employeeDiscount"),
      startedAt: text(formData, "startedAt") ? new Date(`${text(formData, "startedAt")}T12:00:00`) : null,
      notes: text(formData, "notes"),
    },
  });
  revalidatePath("/dp/beneficios");
  revalidatePath("/pessoas");
}
export default async function BenefitsPage() {
  const company = await prisma.company.findFirst({ where: { active: true }, select: { id: true } });
  const companyId = company?.id;
  const [employees, enrollments] = companyId ? await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, active: true }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.hrBenefitEnrollment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 50, include: { employee: { select: { fullName: true } } } }),
  ]) : [[], []];
  const active = enrollments.filter((item) => item.active).length;
  const monthly = enrollments.filter((item) => item.active).reduce((sum, item) => sum + Number(item.monthlyValue?.toString() ?? 0), 0);
  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Benefícios</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Benefícios</h1><p className="mt-2 text-sm text-slate-600">VT, VR/VA e demais benefícios com fornecedor, custo, desconto e histórico por colaborador.</p></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Benefícios ativos",active],["Vínculos registrados",enrollments.length],["Colaboradores",employees.length],["Custo mensal",new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(monthly)]].map(([label,value])=><article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
      <form action={createBenefit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5"/></div><div><h2 className="font-bold text-[#0b2947]">Novo vínculo</h2><p className="text-xs text-slate-500">Inclua um benefício no dossiê.</p></div></div><div className="mt-5 space-y-4">
        <select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{employees.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
        <select name="benefitType" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Tipo de benefício</option><option>Vale-transporte</option><option>Vale-refeição</option><option>Vale-alimentação</option><option>Plano de saúde</option><option>Plano odontológico</option><option>Seguro de vida</option><option>Outro</option></select>
        <input name="provider" placeholder="Fornecedor" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/><div className="grid grid-cols-2 gap-3"><input name="monthlyValue" placeholder="Valor mensal" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"/><input name="employeeDiscount" placeholder="Desconto" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"/></div><input name="startedAt" type="date" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/><textarea name="notes" rows={3} placeholder="Observações" className="w-full rounded-2xl border border-slate-200 p-4 text-sm"/><button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] text-sm font-semibold text-white"><WalletCards className="h-4 w-4"/>Salvar benefício</button>
      </div></form>
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><Gift className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Carteira de benefícios</h2><p className="text-xs text-slate-500">Vínculos mais recentes.</p></div></div>{enrollments.length===0?<div className="p-12 text-center text-sm text-slate-500">Nenhum benefício registrado.</div>:<div className="divide-y divide-slate-100">{enrollments.map((item)=><div key={item.id} className="grid gap-2 p-5 md:grid-cols-[1.4fr_1fr_1fr_110px] md:items-center"><div><p className="font-semibold text-slate-800">{item.employee.fullName}</p><p className="text-xs text-slate-400">{item.benefitType}</p></div><span className="text-sm text-slate-600">{item.provider??"—"}</span><span className="text-sm font-semibold text-slate-700">{item.monthlyValue?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(item.monthlyValue.toString())):"—"}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{item.active?"Ativo":"Encerrado"}</span></div>)}</div>}</article>
    </section>
  </div></main>;
}
