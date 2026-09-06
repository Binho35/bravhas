import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { ServerSubmitButton } from "@/components/forms/ServerSubmitButton";
import { prisma } from "@/lib/prisma";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

const DOCUMENT_TYPES = new Set([
  "CURRICULO", "PROPOSTA", "CONTRATO", "DOCUMENTO_PESSOAL", "HOLERITE", "ESPELHO_PONTO", "ATESTADO", "MEDIDA_DISCIPLINAR", "FERIAS", "OUTRO",
]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalDate(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data inválida.");
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Data inválida.");
  return parsed;
}

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

async function updateDocument(documentId: string, formData: FormData) {
  "use server";
  const actor = await hrdpPermission.colaboradores("edit");
  const title = text(formData, "title");
  const type = text(formData, "type");
  const notes = text(formData, "notes");
  if (!title || title.length > 180) throw new Error("Título do documento inválido.");
  if (!type || !DOCUMENT_TYPES.has(type)) throw new Error("Tipo de documento inválido.");
  if (notes && notes.length > 4000) throw new Error("Observação do documento excede o limite permitido.");

  const employeeId = await prisma.$transaction(async (tx) => {
    const current = await tx.hrEmployeeDocument.findFirst({
      where: { id: documentId, companyId: actor.companyId },
    });
    if (!current) throw new Error("Documento não encontrado ou fora do escopo autorizado.");

    const next = {
      title,
      type,
      issuedAt: optionalDate(formData, "issuedAt"),
      expiresAt: optionalDate(formData, "expiresAt"),
      notes,
    };
    const changedFields = [
      ["title", current.title, next.title],
      ["type", current.type, next.type],
      ["issuedAt", current.issuedAt?.toISOString() ?? null, next.issuedAt?.toISOString() ?? null],
      ["expiresAt", current.expiresAt?.toISOString() ?? null, next.expiresAt?.toISOString() ?? null],
      ["notes", current.notes, next.notes],
    ].filter(([, before, after]) => before !== after).map(([field]) => field as string);

    const result = await tx.hrEmployeeDocument.updateMany({
      where: { id: documentId, companyId: actor.companyId },
      data: next,
    });
    if (result.count !== 1) throw new Error("Documento não encontrado ou fora do escopo autorizado.");

    await logHrdpAudit({
      companyId: actor.companyId,
      actorUserId: actor.id,
      action: "EMPLOYEE_DOCUMENT_UPDATED",
      entityType: "HrEmployeeDocument",
      entityId: documentId,
      metadata: { employeeId: current.employeeId, changedFields },
    }, tx);
    return current.employeeId;
  });

  revalidatePath("/documentos");
  revalidatePath(`/documentos/${documentId}`);
  revalidatePath(`/rh/colaboradores/${employeeId}`);
  revalidatePath(`/rh/colaboradores/${employeeId}/documentos`);
  revalidatePath(`/rh/colaboradores/${employeeId}/historico`);
  revalidatePath("/rh/admissoes");
  redirect(`/documentos/${documentId}`);
}

export default async function DocumentDetailsPage({ params }: { params: Promise<{ documentId: string }> }) {
  const actor = await hrdpPermission.colaboradores("view");
  const { documentId } = await params;
  const document = await prisma.hrEmployeeDocument.findFirst({
    where: { id: documentId, companyId: actor.companyId },
    include: { employee: { select: { id: true, fullName: true } } },
  });
  if (!document) notFound();

  let canEdit = true;
  try { await hrdpPermission.colaboradores("edit"); } catch { canEdit = false; }

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[900px]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Documento funcional</p><h1 className="mt-2 text-3xl font-bold text-[#0b2947]">{document.title}</h1><p className="mt-2 text-sm text-slate-600">Vinculado a {document.employee.fullName} · {document.verifiedAt ? "Conferido" : "Pendente de conferência"}</p></div><div className="flex gap-2"><Link href="/documentos" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Biblioteca</Link><Link href={`/rh/colaboradores/${document.employee.id}/documentos`} className="rounded-xl bg-[#154b7a] px-4 py-2 text-sm font-semibold text-white">Dossiê</Link></div></div>

    {canEdit ? <form action={updateDocument.bind(null, document.id)} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
      <label className="md:col-span-2"><span className="text-xs font-semibold text-slate-600">Título</span><input aria-label="Título do documento" name="title" required maxLength={180} defaultValue={document.title} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" /></label>
      <label><span className="text-xs font-semibold text-slate-600">Tipo</span><select aria-label="Tipo do documento" name="type" required defaultValue={document.type} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="CURRICULO">Currículo</option><option value="PROPOSTA">Carta proposta</option><option value="CONTRATO">Contrato de trabalho</option><option value="DOCUMENTO_PESSOAL">Documento pessoal</option><option value="HOLERITE">Holerite</option><option value="ESPELHO_PONTO">Espelho de ponto</option><option value="ATESTADO">Atestado / declaração</option><option value="MEDIDA_DISCIPLINAR">Medida disciplinar</option><option value="FERIAS">Documento de férias</option><option value="OUTRO">Outro</option></select></label>
      <div className="grid grid-cols-2 gap-3"><label><span className="text-xs font-semibold text-slate-600">Emissão</span><input name="issuedAt" type="date" defaultValue={dateInput(document.issuedAt)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label><label><span className="text-xs font-semibold text-slate-600">Validade</span><input name="expiresAt" type="date" defaultValue={dateInput(document.expiresAt)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label></div>
      <label className="md:col-span-2"><span className="text-xs font-semibold text-slate-600">Observações</span><textarea aria-label="Observações do documento" name="notes" rows={4} maxLength={4000} defaultValue={document.notes ?? ""} className="mt-2 w-full rounded-2xl border border-slate-200 p-4 text-sm" /></label>
      <div className="md:col-span-2 flex justify-end"><ServerSubmitButton pendingLabel="Salvando documento..." className="h-11 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white">Salvar metadados</ServerSubmitButton></div>
    </form> : <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Seu perfil possui acesso de consulta, sem permissão para editar metadados.</div>}
  </div></main>;
}
