"use client";

import { BarChart3, BriefcaseBusiness, UsersRound, WalletCards } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

const indicators = [
  { label: "Financeiro", description: "Receitas, despesas, caixa e compromissos financeiros.", icon: WalletCards },
  { label: "Pessoas", description: "Quadro, movimentações e informações consolidadas de pessoas.", icon: UsersRound },
  { label: "Departamento Pessoal", description: "Ponto, férias e rotinas de DP.", icon: BriefcaseBusiness },
];

export default function IndicatorsPage() {
  return (
    <PermissionGuard resource="INDICATORS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage
          eyebrow="Gestão"
          title="Indicadores"
          description="Painel gerencial para consolidação dos principais indicadores administrativos do BravHAS."
          statusText="Rota disponível para homologação"
        >
          <section className="grid gap-3 lg:grid-cols-3">
            {indicators.map(({ label, description, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#154B7A]">
                    <Icon size={19} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2947]">{label}</h3>
                    <p className="mt-1 text-xs text-[#64748B]">{description}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-xl bg-[#F8FAFC] px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">Valor consolidado</p>
                  <p className="mt-2 text-2xl font-bold text-[#0B2947]">—</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">Sem dados fictícios nesta etapa de homologação.</p>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <BarChart3 className="mt-0.5 shrink-0 text-[#154B7A]" size={20} aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-[#0B2947]">Consolidação de indicadores</h3>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">
                  A navegação foi restaurada sem inventar métricas. Os indicadores serão alimentados pelas fontes reais dos módulos conforme cada integração for homologada.
                </p>
              </div>
            </div>
          </section>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
