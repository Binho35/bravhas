import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, ClipboardCheck, FileWarning, UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { completeEmployeeAdmission, getAdmissionBlockers } from "@/modules/hrdp/workflows/admissionLifecycle";

async function activateEmployee(formData: FormData) {
  "use server";
  const actor = await hrdpPermission.admissoes("approve");
  const employeeId = formData.get("employeeId");
  if (typeof employeeId !== "string" || !employeeId.trim()) throw new Error("Colaborador inválido.");

  await completeEmployeeAdmission({ companyId: actor.companyId, employeeId, actorUserId: actor.id });

  revalidatePath("/rh/admissoes");
  revalidatePath("/rh/colaboradores");
  revalidatePath("/pessoas");
  revalidatePath(`/rh/colaboradores/${employeeId}`);
  revalidatePath(`/rh/colaboradores/${employeeId}/documentos`);
  revalidatePath(`/rh/colaboradores/${employeeId}/historico`);
  revalidatePath("/dp");
  revalidatePath("/dp/ponto");
  revalidatePath("/dp/ferias");
  revalidatePath("/dp/beneficios");
  revalidatePath("/dp/folha");
  revalidatePath("/dp/medidas-disciplinares");
  revalidatePath("/dp/desligamentos");
  redirect(`/rh/colaboradores/${employeeId}/documentos`);
}

export default async function AdmissionsPage() {
  const actor = await hrdpPermission.admissoes("view");
  const companyId = actor.companyId;
  const admissions = await prisma.hrEmployee.findMany({
    where: { companyId, status: "PRE_ADMISSION" },
    orderBy: [{ hireDate: "asc" }, { createdAt: "asc" }],
    include: { department: true, position: true, documents: true, benefitEnrollments: true },
  });
  const pendingDocs = admissions.reduce((sum, item) => sum + item.documents.filter((doc) => !doc.verifiedAt).length, 0);
  const readyCount = admissions.filter((item) => getAdmissionBlockers(item).length === 0).length;
  const next30 = new Date();
  next30.setDate(next30.getDate() + 30);
  const startsSoon = admissions.filter((item) => item.hireDate && item.hireDate <= next30).length;

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1360px]">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">RH · Admissões</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Admissões</h1><p className="mt-2 text-sm text-slate-600">Etapa 3 de 3: resolva as pendências e libere o colaborador para RH e DP.</p></div><Link href="/rh/colaboradores/novo" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white"><UserPlus className="h-4 w-4"/>Nova admissão</Link></div>

    <section className="mt-5 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">1. Cadastro</p><p className="mt-1 text-xs text-slate-600">CPF, data de admissão e tipo de contrato registrados.</p></div>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">2. Documentos</p><p className="mt-1 text-xs text-slate-600">Ao menos um documento persistido e todos conferidos.</p></div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold text-[#154b7a]">3. Ativação</p><p className="mt-1 text-xs text-slate-600">{readyCount} colaborador(es) pronto(s) para concluir.</p></div>
    </section>

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Em pré-admissão", admissions.length], ["Prontos para ativar", readyCount], ["Documentos pendentes", pendingDocs], ["Inícios próximos", startsSoon]].map(([label, value]) => <article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}</section>

    <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-6"><ClipboardCheck className="h-5 w-5 text-[#154b7a]"/><div><h2 className="font-bold text-[#0b2947]">Pipeline de entrada</h2><p className="text-xs text-slate-500">O sistema mostra exatamente o que falta para cada colaborador antes do status ACTIVE.</p></div></div>{admissions.length === 0 ? <div className="p-14 text-center"><BadgeCheck className="mx-auto h-7 w-7 text-emerald-600"/><h3 className="mt-3 font-bold text-slate-700">Nenhuma pré-admissão pendente</h3><p className="mt-2 text-sm text-slate-500">Todos os processos de entrada foram concluídos.</p></div> : <div className="divide-y divide-slate-100">{admissions.map((item) => {
      const verified = item.documents.filter((document) => document.verifiedAt).length;
      const persisted = item.documents.filter((document) => document.storageKey).length;
      const blockers = getAdmissionBlockers(item);
      const ready = blockers.length === 0;
      return <div key={item.id} className="grid gap-4 p-5 lg:grid-cols-[1.25fr_.8fr_1.35fr_190px] lg:items-center"><div><Link href={`/rh/colaboradores/${item.id}`} className="font-semibold text-[#0b2947] hover:underline">{item.fullName}</Link><p className="mt-1 text-xs text-slate-400">{item.position?.name ?? "Cargo não definido"} · {item.department?.name ?? "Setor não definido"}</p></div><div className="text-sm text-slate-600"><p>Início</p><strong className="font-semibold text-slate-800">{item.hireDate ? new Intl.DateTimeFormat("pt-BR").format(item.hireDate) : "Não informado"}</strong></div><div>{ready ? <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><BadgeCheck className="h-4 w-4"/>Cadastro pronto para ACTIVE</div> : <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2"><div className="flex items-center gap-2 text-xs font-semibold text-amber-800"><FileWarning className="h-4 w-4"/>Blockers para ACTIVE</div><p className="mt-1 text-xs text-amber-700">{blockers.join(" · ")}</p></div>}<p className="mt-2 text-xs text-slate-500">{persisted}/{item.documents.length} persistidos · {verified}/{item.documents.length} verificados · {item.benefitEnrollments.length} benefícios (não bloqueiam ACTIVE)</p></div><div>{ready ? <form action={activateEmployee}><input type="hidden" name="employeeId" value={item.id}/><button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-semibold text-white">Concluir admissão <ArrowRight className="h-4 w-4"/></button></form> : <Link href={`/rh/colaboradores/${item.id}/documentos`} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#154b7a] px-4 text-xs font-semibold text-white">Resolver pendências <ArrowRight className="h-4 w-4"/></Link>}</div></div>;
    })}</div>}</section>
  </div></main>;
}
