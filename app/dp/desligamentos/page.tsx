import { revalidatePath } from "next/cache";
import { LogOut, UserMinus } from "lucide-react";

import { prisma } from "@/lib/prisma";

function text(formData: FormData, key: string) { const value = formData.get(key); return typeof value === "string" && value.trim() ? value.trim() : null; }
async function terminateEmployee(formData: FormData) {
  "use server";
  const employeeId = text(formData, "employeeId"); const terminationDate = text(formData, "terminationDate");
  if (!employeeId || !terminationDate) throw new Error("Colaborador e data são obrigatórios.");
  const reason = text(formData, "reason");
  await prisma.$transaction([
    prisma.hrEmployee.update({ where: { id: employeeId }, data: { status: "TERMINATED", active: false, terminationDate: new Date(`${terminationDate}T12:00:00`), notes: reason ? `Desligamento: ${reason}` : undefined } }),
    prisma.hrBenefitEnrollment.updateMany({ where: { employeeId, active: true }, data: { active: false, endedAt: new Date(`${terminationDate}T12:00:00`) } }),
  ]);
  revalidatePath("/dp/desligamentos"); revalidatePath("/rh/colaboradores"); revalidatePath("/pessoas");
}
export default async function TerminationsPage(){
  const company=await prisma.company.findFirst({where:{active:true},select:{id:true}}); const companyId=company?.id;
  const [activeEmployees,terminated]=companyId?await Promise.all([
    prisma.hrEmployee.findMany({where:{companyId,active:true,status:{in:["ACTIVE","ON_LEAVE"]}},orderBy:{fullName:"asc"},select:{id:true,fullName:true,employeeNumber:true}}),
    prisma.hrEmployee.findMany({where:{companyId,status:"TERMINATED"},orderBy:{terminationDate:"desc"},take:50,include:{department:true,position:true}}),
  ]):[[],[]];
  const monthStart=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">DP · Desligamentos</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Desligamentos</h1><p className="mt-2 text-sm text-slate-600">Encerramento de vínculo, benefícios e histórico funcional em fluxo controlado.</p></div>
  <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Ativos elegíveis",activeEmployees.length],["Desligados",terminated.length],["Concluídos no mês",terminated.filter(i=>i.terminationDate&&i.terminationDate>=monthStart).length],["Benefícios encerrados","Automático"]].map(([l,v])=><article key={String(l)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{l}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(v)}</strong></article>)}</section>
  <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]"><form action={terminateEmployee} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><UserMinus className="h-5 w-5"/></div><div><h2 className="font-bold text-[#0b2947]">Encerrar vínculo</h2><p className="text-xs text-slate-500">Ação crítica com impacto no cadastro e benefícios.</p></div></div><div className="mt-5 space-y-4"><select name="employeeId" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Selecione o colaborador</option>{activeEmployees.map(i=><option key={i.id} value={i.id}>{i.fullName}{i.employeeNumber?` · ${i.employeeNumber}`:""}</option>)}</select><input name="terminationDate" required type="date" className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"/><select name="reason" className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Motivo</option><option>Pedido de demissão</option><option>Dispensa sem justa causa</option><option>Dispensa por justa causa</option><option>Término de contrato</option><option>Acordo</option><option>Outro</option></select><button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-rose-700 text-sm font-semibold text-white"><LogOut className="h-4 w-4"/>Concluir desligamento</button><p className="text-xs leading-5 text-slate-400">A conclusão encerra os benefícios ativos e preserva o dossiê para consulta histórica.</p></div></form>
  <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-6"><h2 className="font-bold text-[#0b2947]">Histórico de desligamentos</h2><p className="text-xs text-slate-500">Vínculos encerrados recentemente.</p></div>{terminated.length===0?<div className="p-12 text-center text-sm text-slate-500">Nenhum desligamento registrado.</div>:<div className="divide-y divide-slate-100">{terminated.map(item=><div key={item.id} className="grid gap-2 p-5 md:grid-cols-[1.4fr_1fr_1fr_120px] md:items-center"><div><p className="font-semibold text-slate-800">{item.fullName}</p><p className="text-xs text-slate-400">{item.position?.name??"—"} · {item.department?.name??"—"}</p></div><span className="text-sm text-slate-600">{item.employeeNumber??"Sem matrícula"}</span><span className="text-sm text-slate-600">{item.terminationDate?new Intl.DateTimeFormat("pt-BR").format(item.terminationDate):"—"}</span><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Encerrado</span></div>)}</div>}</article></section>
  </div></main>;
}
