"use client";

import { useEffect, useState } from "react";
import { BarChart3, BriefcaseBusiness, UsersRound, WalletCards } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { OperationalModulePage } from "@/components/layout/OperationalModulePage";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";

type Indicators = {
  people: { activeEmployees: number; preAdmissions: number; activeLeaves: number; upcomingVacations: number; pendingTime: number };
  financial: { payableCount: number; receivableCount: number; totalPayable: number; totalReceivable: number; overduePayables: number; overdueReceivables: number };
  obligations: { open: number; overdue: number; dueSoon: number; completed: number };
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function IndicatorsPage() {
  const [data, setData] = useState<Indicators | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/indicadores", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload?.message ?? "Não foi possível carregar os indicadores.");
        if (!cancelled) setData(payload as Indicators);
      })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Não foi possível carregar os indicadores."); });
    return () => { cancelled = true; };
  }, []);

  const groups = data ? [
    { label: "Financeiro", icon: WalletCards, items: [
      ["A pagar", `${data.financial.payableCount} · ${money.format(data.financial.totalPayable)}`],
      ["A receber", `${data.financial.receivableCount} · ${money.format(data.financial.totalReceivable)}`],
      ["Vencidas", `${data.financial.overduePayables} pagar · ${data.financial.overdueReceivables} receber`],
    ] },
    { label: "Pessoas", icon: UsersRound, items: [
      ["Colaboradores ativos", String(data.people.activeEmployees)],
      ["Pré-admissões", String(data.people.preAdmissions)],
      ["Afastamentos ativos", String(data.people.activeLeaves)],
      ["Férias nos próximos 30 dias", String(data.people.upcomingVacations)],
    ] },
    { label: "Departamento Pessoal", icon: BriefcaseBusiness, items: [
      ["Pendências de ponto", String(data.people.pendingTime)],
      ["Obrigações abertas", String(data.obligations.open)],
      ["Obrigações atrasadas", String(data.obligations.overdue)],
      ["Obrigações concluídas", String(data.obligations.completed)],
    ] },
  ] : [];

  return (
    <PermissionGuard resource="INDICATORS" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <OperationalModulePage eyebrow="Gestão" title="Indicadores" description="Indicadores administrativos calculados exclusivamente a partir dos registros persistidos da empresa." statusText="Dados reais · sem métricas simuladas">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
          {!data && !error ? <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">Carregando indicadores reais...</div> : null}
          <section className="grid gap-4 lg:grid-cols-3">
            {groups.map(({ label, icon: Icon, items }) => (
              <article key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#154B7A]"><Icon size={19} /></div><h3 className="text-sm font-bold text-[#0B2947]">{label}</h3></div>
                <div className="mt-5 divide-y divide-[#F1F5F9]">
                  {items.map(([name, value]) => <div key={name} className="flex items-center justify-between gap-4 py-3"><span className="text-xs text-[#64748B]">{name}</span><strong className="text-right text-sm text-[#0B2947]">{value}</strong></div>)}
                </div>
              </article>
            ))}
          </section>
          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm"><div className="flex gap-3"><BarChart3 className="shrink-0 text-[#154B7A]" size={20} /><div><h3 className="text-sm font-bold text-[#0B2947]">Critério de consolidação</h3><p className="mt-1 text-xs leading-5 text-[#64748B]">Valores financeiros consideram contas abertas, parcialmente pagas ou vencidas e descontam o valor já baixado. Pessoas, ponto e obrigações são contados diretamente no banco, sempre com escopo da empresa autenticada.</p></div></div></section>
        </OperationalModulePage>
      </AppShell>
    </PermissionGuard>
  );
}
