import { revalidatePath } from "next/cache";
import { Gift, Plus, WalletCards } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

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
  const actor = await hrdpPermission.beneficios("create");
  if (!actor) throw new Error("Autenticação necessária para incluir benefícios.");

  const employeeId = text(formData, "employeeId");
  const benefitType = text(formData, "benefitType");
  if (!employeeId || !benefitType) throw new Error("Colaborador e benefício são obrigatórios.");

  const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId }, select: { id: true } });
  if (!employee) throw new Error("Colaborador fora do escopo autorizado.");

  const enrollment = await prisma.hrBenefitEnrollment.create({
    data: {
      companyId: actor.companyId,
      employeeId,
      benefitType,
      provider: text(formData, "provider"),
      monthlyValue: decimal(formData, "monthlyValue"),
      employeeDiscount: decimal(formData, "employeeDiscount"),
      startedAt: text(formData, "startedAt") ? new Date(`${text(formData, "startedAt")}T12:00:00`) : null,
      notes: text(formData, "notes"),
    },
  });

  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "BENEFIT_ENROLLMENT_CREATED", entityType: "HrBenefitEnrollment", entityId: enrollment.id, metadata: { employeeId, benefitType } });

  revalidatePath("/dp/beneficios");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

async function endBenefit(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.beneficios("edit");
  if (!actor) throw new Error("Autenticação necessária para encerrar benefícios.");
  const id = text(formData, "id");
  const employeeId = text(formData, "employeeId");
  if (!id || !employeeId) throw new Error("Benefício inválido.");

  const current = await prisma.hrBenefitEnrollment.findFirst({ where: { id, employeeId, companyId: actor.companyId, active: true }, select: { id: true, benefitType: true } });
  if (!current) throw new Error("Benefício fora do escopo autorizado ou já encerrado.");

  await prisma.hrBenefitEnrollment.update({ where: { id }, data: { active: false, endedAt: new Date() } });
  await logHrdpAudit({ companyId: actor.companyId, actorUserId: actor.id, action: "BENEFIT_ENROLLMENT_ENDED", entityType: "HrBenefitEnrollment", entityId: id, metadata: { employeeId, benefitType: current.benefitType } });

  revalidatePath("/dp/beneficios");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
}

export default async function BenefitsPage() {
  const actor = await hrdpPermission.beneficios("view");
  if (!actor) return <main className="p-8">Autenticação necessária.</main>;
  const companyId = actor.companyId;
  const [employees, enrollments] = await Promise.all([
    prisma.hrEmployee.findMany({ where: { companyId, active: true, status: { in: ["ACTIVE", "PRE_ADMISSION"] } }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.hrBenefitEnrollment.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 80, include: { employee: { select: { id: true, fullName: true } } } }),
  ]);

  const active = enrollments.filter((item) => item.active).length;
  const monthly = enrollments.filter((item) => item.active).reduce((sum, item) => sum + Number(item.monthlyValue?.toString() ?? 0), 0);
  const discounts = enrollments.filter((item) => item.active).reduce((sum, item) => sum + Number(item.employeeDiscount?.toString() ?? 0), 0);

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Benefícios</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Benefícios</h1><p className="mt-2 text-sm text-slate-600">VT, VR/VA e demais benefícios com fornecedor, custo, desconto, vigência e histórico por colaborador.</p></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Benefícios ativos",active],["Vínculos registrados",enrollments.length],["Custo mensal",new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(monthly)],["Descontos mensais",new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(discounts)]].map(([label,value])=><article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
      <form action={createBenefit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Plus className="h-5 w-5"/></div><div><h2 className="font-bold text-[#0b2947]">Novo vínculo</h2><p className="text-xs text-slate-500">Inclua um benefício no dossiê.</p></div></div><div className="mt-5 space-y-4">
        <select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{employees.map((item)=><option key={item.id} value={item.id}>{item.fullName}</option>)}</select>
        <select name="benefitType" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Tipo de benefício</option><option>Vale-transporte</option><option>Vale-refeição</option><option>Vale-alimentação</option><option>Plano de saúde</option><option>Plano odontológico</option><option>Seguro de vida</option><option>Outro</option></select>
        <input name="provider" placeholder="Fornecedor" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/>
        <div className="grid grid-cols-2 gap-3"><input name="monthlyValue" placeholder="Valor mensal" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"/><input name="employeeDiscount" placeholder="Desconto" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm"/></div>
        <input name="startedAt" type="date" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm"/>
        <textarea name="notes" rows={3} placeholder="Observações" className="w-full rounded-2xl border border-slate-200 p-4 text-sm"/>
        <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b2947] text-sm font-semibold text-white"><WalletCards className="h-4 w-4"/>Salvar benefício</button>
      </div></form>
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><Gift className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Carteira de benefícios</h2><p className="text-xs text-slate-500">Vínculos, custos e vigência.</p></div></div>{enrollments.length===0?<div className="p-12 text-center text-sm text-slate-500">Nenhum benefício registrado.</div>:<div className="divide-y divide-slate-100">{enrollments.map((item)=><div key={item.id} className="p-5"><div className="grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_110px] md:items-center"><div><p className="font-semibold text-slate-800">{item.employee.fullName}</p><p className="text-xs text-slate-400">{item.benefitType}</p></div><span className="text-sm text-slate-600">{item.provider??"—"}</span><div className="text-sm text-slate-600"><p className="font-semibold text-slate-700">{item.monthlyValue?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(item.monthlyValue.toString())):"—"}</p><p className="text-xs text-slate-400">Desconto: {item.employeeDiscount?new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(item.employeeDiscount.toString())):"—"}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{item.active?"Ativo":"Encerrado"}</span></div>{item.active?<form action={endBenefit} className="mt-3 flex justify-end"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="employeeId" value={item.employee.id}/><button className="text-xs font-semibold text-rose-600 hover:underline">Encerrar benefício</button></form>:<p className="mt-3 text-right text-[11px] text-slate-400">Encerrado em {item.endedAt?new Intl.DateTimeFormat("pt-BR").format(item.endedAt):"—"}</p>}</div>)}</div>}</article>
    </section>
  </div></main>;
}
