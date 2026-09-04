"use client";

import { FileText, FolderOpen, ShieldCheck, Search } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

const categories = [
  "RH e Departamento Pessoal",
  "Financeiro",
  "Contratos e Fornecedores",
  "Compliance e Administrativo",
];

export default function DocumentsPage() {
  return (
    <PermissionGuard resource="DOCUMENTS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage
          eyebrow="Gestão"
          title="Documentos"
          description="Central de consulta e organização dos documentos administrativos vinculados aos processos do BravHAS."
          statusText="Rota disponível para homologação"
        >
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category) => (
              <div key={category} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#154B7A]">
                    <FolderOpen size={19} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2947]">{category}</h3>
                    <p className="mt-1 text-xs text-[#94A3B8]">Nenhum documento indexado.</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="min-h-[20rem] rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0B2947]">Biblioteca administrativa</h3>
                <p className="mt-1 text-xs text-[#94A3B8]">A rota foi restaurada sem expor arquivos ou dados fictícios.</p>
              </div>
              <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs text-[#64748B]">
                <Search size={15} aria-hidden="true" />
                Busca será habilitada com a indexação documental
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-5 py-10 text-center">
              <FileText className="mx-auto text-[#94A3B8]" size={30} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[#475569]">Nenhum documento disponível nesta central.</p>
              <p className="mt-1 text-xs text-[#94A3B8]">O upload e a vinculação de documentos serão homologados somente quando o armazenamento definitivo estiver conectado.</p>
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-[#ECFDF5] px-3 py-1.5 text-[11px] font-semibold text-[#047857]">
                <ShieldCheck size={14} aria-hidden="true" />
                Sem dados simulados ou exposição indevida
              </div>
            </div>
          </section>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
