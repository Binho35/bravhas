import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, ExternalLink, FilePlus2, Files, Upload } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { logServerFailure } from "@/lib/serverErrors";
import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";
import type { DocumentStorage, StoredDocument } from "@/modules/hrdp/storage/documentStorage";
import { getDocumentStorage, isManagedDocumentStorageKey } from "@/modules/hrdp/storage/storageRuntime";
import { getAdmissionBlockers } from "@/modules/hrdp/workflows/admissionLifecycle";

const DOCUMENT_TYPES = new Set([
  "CURRICULO",
  "PROPOSTA",
  "CONTRATO",
  "DOCUMENTO_PESSOAL",
  "HOLERITE",
  "ESPELHO_PONTO",
  "ATESTADO",
  "MEDIDA_DISCIPLINAR",
  "FERIAS",
  "OUTRO",
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

function externalDocumentReference(formData: FormData) {
  const reference = text(formData, "externalReference");
  if (!reference) return null;
  if (reference.length > 2048 || /[\u0000-\u001f\u007f]/.test(reference)) throw new Error("Referência externa inválida.");
  const normalized = reference.toLowerCase();
  if (normalized.startsWith("local:") || normalized.startsWith("vercel-blob:")) throw new Error("Referência externa usa prefixo reservado.");
  return reference;
}

async function createDocument(employeeId: string, formData: FormData) {
  "use server";
  const actor = await hrdpPermission.colaboradores("create");
  const employee = await prisma.hrEmployee.findFirst({ where: { id: employeeId, companyId: actor.companyId }, select: { id: true, companyId: true } });
  if (!employee) throw new Error("Colaborador não encontrado ou fora do escopo autorizado.");

  const type = text(formData, "type");
  const title = text(formData, "title");
  if (!type || !DOCUMENT_TYPES.has(type)) throw new Error("Tipo de documento inválido.");
  if (!title || title.length > 180) throw new Error("Título do documento inválido.");

  const notes = text(formData, "notes");
  if (notes && notes.length > 4000) throw new Error("Observação do documento excede o limite permitido.");

  const fileValue = formData.get("file");
  const externalReference = externalDocumentReference(formData);
  let storedFile: StoredDocument | null = null;
  let storage: DocumentStorage | null = null;
  let storageKey = externalReference;

  if (fileValue instanceof File && fileValue.size > 0) {
    storage = getDocumentStorage();
    storedFile = await storage.save({ companyId: actor.companyId, employeeId, file: fileValue });
    storageKey = storedFile.storageKey;
  }

  if (!storageKey) throw new Error("Anexe um arquivo ou informe uma referência externa para o documento.");

  const issuedAt = optionalDate(formData, "issuedAt");
  const expiresAt = optionalDate(formData, "expiresAt");

  try {
    await prisma.$transaction(async (tx) => {
      const document = await tx.hrEmployeeDocument.create({
        data: { companyId: actor.companyId, employeeId, type, title, storageKey, issuedAt, expiresAt, notes },
      });

      await logHrdpAudit({
        companyId: actor.companyId,
        actorUserId: actor.id,
        action: "EMPLOYEE_DOCUMENT_CREATED",
        entityType: "HrEmployeeDocument",
        entityId: document.id,
        metadata: {
          employeeId,
          type,
          title,
          uploaded: Boolean(storedFile),
          ...(storedFile ? { mimeType: storedFile.mimeType, size: storedFile.size, checksumSha256: storedFile.checksumSha256 } : {}),
        },
      }, tx);
    });
  } catch (error) {
    if (storedFile && storage) {
      try {
        await storage.delete({ companyId: actor.companyId, employeeId, storageKey: storedFile.storageKey });
      } catch (cleanupError) {
        logServerFailure("Falha ao compensar upload documental", cleanupError);
      }
    }
    throw error;
  }

  revalidatePath(`/rh/colaboradores/${employeeId}/documentos`);
  revalidatePath(`/rh/colaboradores/${employeeId}`);
  revalidatePath("/rh/admissoes");
}

async function verifyDocument(employeeId: string, formData: FormData) {
  "use server";
  const actor = await hrdpPermission.colaboradores("approve");
  const id = text(formData, "id");
  if (!id) throw new Error("Documento inválido.");

  const document = await prisma.hrEmployeeDocument.findFirst({ where: { id, employeeId, companyId: actor.companyId }, select: { id: true, title: true } });
  if (!document) throw new Error("Documento não encontrado ou fora do escopo autorizado.");

  await prisma.$transaction(async (tx) => {
    const updated = await tx.hrEmployeeDocument.updateMany({
      where: { id, employeeId, companyId: actor.companyId },
      data: { verifiedAt: new Date(), verifiedBy: actor.name },
    });
    if (updated.count !== 1) throw new Error("Documento não encontrado ou fora do escopo autorizado.");

    await logHrdpAudit({
      companyId: actor.companyId,
      actorUserId: actor.id,
      action: "EMPLOYEE_DOCUMENT_VERIFIED",
      entityType: "HrEmployeeDocument",
      entityId: id,
      metadata: { employeeId, title: document.title },
    }, tx);
  });

  revalidatePath(`/rh/colaboradores/${employeeId}/documentos`);
  revalidatePath(`/rh/colaboradores/${employeeId}`);
  revalidatePath("/rh/admissoes");
}

function dateLabel(value: Date | null) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "—";
}

export default async function EmployeeDocumentsPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const actor = await hrdpPermission.colaboradores("view");
  const { employeeId } = await params;
  const employee = await prisma.hrEmployee.findFirst({
    where: { id: employeeId, companyId: actor.companyId },
    select: {
      id: true,
      fullName: true,
      status: true,
      cpf: true,
      hireDate: true,
      employmentType: true,
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!employee) notFound();

  const verified = employee.documents.filter((item) => item.verifiedAt).length;
  const persisted = employee.documents.filter((item) => item.storageKey).length;
  const blockers = employee.status === "PRE_ADMISSION" ? getAdmissionBlockers(employee) : [];
  const readyForAdmission = employee.status === "PRE_ADMISSION" && blockers.length === 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryLimit = new Date(today);
  expiryLimit.setDate(expiryLimit.getDate() + 30);
  const expiring = employee.documents.filter((item) => item.expiresAt && item.expiresAt >= today && item.expiresAt <= expiryLimit).length;

  return (
    <main className="px-4 py-6 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <Link href={`/rh/colaboradores/${employee.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#154b7a]"><ArrowLeft className="h-4 w-4" />Voltar ao dossiê</Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Dossiê · Documentos</p>
            <h1 className="mt-2 text-3xl font-bold text-[#0b2947]">Documentos de {employee.fullName}</h1>
            <p className="mt-2 text-sm text-slate-600">Etapa 2 de 3 da admissão: o arquivo precisa estar persistido e conferido antes da ativação.</p>
          </div>
          {employee.status === "PRE_ADMISSION" ? readyForAdmission ? (
            <Link href="/rh/admissoes" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white">Ir para concluir admissão <ArrowRight className="h-4 w-4" /></Link>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">Etapa 2 de 3 · {blockers.length} pendência(s)</div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">Admissão concluída · status {employee.status}</div>
          )}
        </div>

        {employee.status === "ACTIVE" ? <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><p className="font-bold text-emerald-800">Colaborador ACTIVE</p><p className="mt-1 text-sm text-emerald-700">Admissão concluída. O colaborador está liberado para as rotinas operacionais aplicáveis de DP.</p></div> : null}

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">1. Cadastro</p><p className="mt-1 text-xs text-slate-600">CPF, admissão e vínculo mínimo registrados.</p></div>
          <div className={`rounded-2xl border p-4 ${persisted > 0 ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50"}`}><p className={`text-xs font-bold ${persisted > 0 ? "text-emerald-700" : "text-[#154b7a]"}`}>2. Documento persistido</p><p className="mt-1 text-xs text-slate-600">{persisted}/{employee.documents.length} documento(s) com referência persistida · {verified} conferido(s).</p></div>
          <div className={`rounded-2xl border p-4 ${readyForAdmission || employee.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}><p className={`text-xs font-bold ${readyForAdmission || employee.status === "ACTIVE" ? "text-emerald-700" : "text-slate-700"}`}>3. Ativação</p><p className="mt-1 text-xs text-slate-500">{employee.status === "ACTIVE" ? "Concluída." : readyForAdmission ? "Pronta para conclusão." : "Bloqueada até resolver as pendências abaixo."}</p></div>
        </section>

        {employee.status === "PRE_ADMISSION" ? <section className={`mt-4 rounded-3xl border p-5 ${readyForAdmission ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`} aria-label="Checklist de admissão"><h2 className={`font-bold ${readyForAdmission ? "text-emerald-800" : "text-amber-900"}`}>Checklist para ACTIVE</h2>{readyForAdmission ? <p className="mt-2 text-sm text-emerald-700">Cadastro pronto: documento persistido e todos os documentos verificados. Use “Ir para concluir admissão”.</p> : <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800">{blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>}</section> : null}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          {[["Documentos", employee.documents.length], ["Persistidos", persisted], ["Conferidos", verified], ["Vencem em até 30 dias", expiring]].map(([label, value]) => <article key={String(label)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><strong className="mt-2 block text-2xl text-[#0b2947]">{String(value)}</strong></article>)}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[420px_1fr]">
          <form action={createDocument.bind(null, employee.id)} encType="multipart/form-data" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><FilePlus2 className="h-5 w-5" /></div><div><h2 className="font-bold text-[#0b2947]">Adicionar documento</h2><p className="text-xs text-slate-500">Anexe o arquivo real ao dossiê funcional.</p></div></div>
            <div className="mt-5 space-y-4">
              <select name="type" required className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm"><option value="">Tipo de documento</option><option value="CURRICULO">Currículo</option><option value="PROPOSTA">Carta proposta</option><option value="CONTRATO">Contrato de trabalho</option><option value="DOCUMENTO_PESSOAL">Documento pessoal</option><option value="HOLERITE">Holerite</option><option value="ESPELHO_PONTO">Espelho de ponto</option><option value="ATESTADO">Atestado / declaração</option><option value="MEDIDA_DISCIPLINAR">Medida disciplinar</option><option value="FERIAS">Documento de férias</option><option value="OUTRO">Outro</option></select>
              <input name="title" required maxLength={180} placeholder="Título do documento" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
              <label className="block rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-4"><span className="flex items-center gap-2 text-sm font-semibold text-[#154b7a]"><Upload className="h-4 w-4" />Selecionar arquivo</span><input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="mt-3 block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-[#0b2947] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white" /><span className="mt-2 block text-[11px] text-slate-500">PDF, JPG, PNG ou WEBP · máximo 4 MB. O conteúdo é validado no servidor antes da persistência.</span></label>
              <input name="externalReference" maxLength={2048} placeholder="Ou informe referência externa / URL interna" className="h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm" />
              <div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-500">Emissão<input name="issuedAt" type="date" className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label><label className="text-xs text-slate-500">Validade<input name="expiresAt" type="date" className="mt-1 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm" /></label></div>
              <textarea name="notes" rows={3} maxLength={4000} placeholder="Observações" className="w-full rounded-2xl border border-slate-200 p-4 text-sm" />
              <button className="h-11 w-full rounded-2xl bg-[#0b2947] text-sm font-semibold text-white">Salvar documento</button>
            </div>
          </form>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 p-6"><Files className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold text-[#0b2947]">Arquivo funcional</h2><p className="text-xs text-slate-500">Histórico documental do colaborador.</p></div></div>
            {employee.documents.length === 0 ? <div className="p-14 text-center text-sm text-slate-500">Nenhum documento cadastrado. Anexe ao menos um documento para avançar.</div> : <div className="divide-y divide-slate-100">{employee.documents.map((item) => {
              const managedFile = isManagedDocumentStorageKey(item.storageKey);
              return <div key={item.id} className="grid gap-3 p-5 lg:grid-cols-[1.4fr_1fr_120px_150px] lg:items-center"><div><p className="font-semibold text-slate-800">{item.title}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{item.type}</span>{managedFile ? <a href={`/api/hr/documents/${item.id}/file`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#154b7a] hover:underline"><ExternalLink className="h-3.5 w-3.5" />Abrir arquivo</a> : item.storageKey ? <span className="max-w-[250px] truncate">Persistido · referência externa</span> : <span>Sem arquivo</span>}</div></div><div className="text-xs text-slate-500"><p>Emissão: {dateLabel(item.issuedAt)}</p><p>Validade: {dateLabel(item.expiresAt)}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.verifiedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.verifiedAt ? "Conferido" : "Pendente"}</span>{item.verifiedAt ? <span className="text-xs text-slate-400">{item.verifiedBy ?? "RH"}<br />{dateLabel(item.verifiedAt)}</span> : <form action={verifyDocument.bind(null, employee.id)}><input type="hidden" name="id" value={item.id} /><button className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white"><BadgeCheck className="h-4 w-4" />Conferir</button></form>}</div>;
            })}</div>}
          </article>
        </section>
      </div>
    </main>
  );
}
