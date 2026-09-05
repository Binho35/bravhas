"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileText, Search, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

type DocumentItem = {
  id: string; type: string; title: string; storageKey: string | null; issuedAt: string | null; expiresAt: string | null;
  verifiedAt: string | null; createdAt: string; fileAvailable: boolean; externalReference: boolean;
  employee: { id: string; fullName: string; status: string };
};

function date(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—"; }

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hr/documents", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload?.message ?? "Não foi possível carregar os documentos.");
        if (!cancelled) {
          setDocuments(payload.documents);
          setLoadedAt(Date.now());
        }
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Não foi possível carregar os documentos."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return documents;
    return documents.filter((item) => [item.title, item.type, item.employee.fullName].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)));
  }, [documents, query]);

  const verified = documents.filter((item) => item.verifiedAt).length;
  const expiring = loadedAt === null ? 0 : documents.filter((item) => {
    if (!item.expiresAt) return false;
    const expiresAt = new Date(item.expiresAt).getTime();
    return expiresAt >= loadedAt && expiresAt <= loadedAt + 30 * 86400000;
  }).length;

  return (
    <PermissionGuard resource="DOCUMENTS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage eyebrow="Gestão" title="Documentos" description="Central tenant-safe dos documentos reais vinculados aos colaboradores." statusText="Fonte real · RH/DP">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[["Documentos", documents.length], ["Conferidos", verified], ["Pendentes", documents.length - verified], ["Vencem em 30 dias", expiring]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"><p className="text-xs text-[#64748B]">{label}</p><p className="mt-2 text-2xl font-bold text-[#0B2947]">{loading ? "…" : value}</p></div>)}
          </section>
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
          <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-bold text-[#0B2947]">Biblioteca documental</h3><p className="mt-1 text-xs text-[#94A3B8]">Mesma fonte persistente utilizada no dossiê do colaborador.</p></div><label className="flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] px-3"><Search size={15} className="text-[#64748B]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar documento ou colaborador" className="w-64 max-w-full text-xs outline-none" /></label></div>
            {loading ? <div className="p-8 text-sm text-[#64748B]">Carregando documentos...</div> : filtered.length === 0 ? <div className="p-10 text-center"><FileText className="mx-auto text-[#94A3B8]" size={30} /><p className="mt-3 text-sm font-semibold text-[#475569]">{documents.length ? "Nenhum documento corresponde à busca." : "Nenhum documento cadastrado."}</p></div> : <div className="divide-y divide-[#F1F5F9]">{filtered.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_180px_130px_110px] md:items-center"><div><p className="text-sm font-semibold text-[#0F172A]">{item.title}</p><p className="mt-1 text-xs text-[#64748B]">{item.employee.fullName} · {item.type}</p></div><div className="text-xs text-[#64748B]">Validade: {date(item.expiresAt)}</div><div className={`text-xs font-semibold ${item.verifiedAt ? "text-emerald-700" : "text-amber-700"}`}>{item.verifiedAt ? `Conferido ${date(item.verifiedAt)}` : "Pendente"}</div><div className="flex justify-end">{item.fileAvailable ? <Link href={`/api/hr/documents/${item.id}/file`} target="_blank" className="text-xs font-semibold text-[#154B7A]">Abrir arquivo</Link> : <Link href={`/rh/colaboradores/${item.employee.id}/documentos`} className="text-xs font-semibold text-[#154B7A]">Abrir dossiê</Link>}</div></div>)}</div>}
          </section>
          <div className="inline-flex items-center gap-2 text-xs text-[#64748B]"><ShieldCheck size={15} className="text-emerald-600" />Consulta limitada à empresa autenticada; arquivos continuam protegidos pela rota autorizada.</div>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
