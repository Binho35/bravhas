"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import type { ObligationArea, ObligationPriority, ObligationStatus } from "@/modules/obligations/domain/entities/Obligation";
import type { FinancialAccountStatus, FinancialAccountType } from "@/modules/financial/domain/entities/FinancialAccount";
import { formatCurrency } from "@/modules/financial/utils/currency";

interface DashboardObligationApiItem {
  id: string;
  title: string;
  description: string | null;
  area: ObligationArea;
  priority: ObligationPriority;
  status: ObligationStatus;
  responsibleName: string;
  dueDate: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DashboardObligation extends Omit<DashboardObligationApiItem, "dueDate" | "completedAt" | "createdAt" | "updatedAt"> {
  dueDate: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardFinancialAccountApiItem {
  id: string;
  type: FinancialAccountType;
  status: FinancialAccountStatus;
  description: string;
  dueDate: string;
  amount: number | string;
  paidAmount: number | string;
  discount: number | string;
  interest: number | string;
  fine: number | string;
}

interface DashboardFinancialAccount {
  id: string;
  type: FinancialAccountType;
  status: FinancialAccountStatus;
  description: string;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  discount: number;
  interest: number;
  fine: number;
}

const areaLabels: Record<ObligationArea, string> = {
  FINANCIAL: "Financeiro",
  HR: "Recursos Humanos",
  PAYROLL: "Departamento Pessoal",
  COMPLIANCE: "Compliance",
  ADMINISTRATIVE: "Administrativo",
};

const monitoredAreas: Array<{ area: ObligationArea; name: string }> = [
  { area: "FINANCIAL", name: "Financeiro" },
  { area: "HR", name: "Recursos Humanos" },
  { area: "PAYROLL", name: "Departamento Pessoal" },
];

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysDifference(targetDate: Date, referenceDate: Date): number {
  const target = normalizeDate(targetDate);
  const reference = normalizeDate(referenceDate);
  return Math.round((target.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadline(dueDate: Date, referenceDate: Date): string {
  const difference = getDaysDifference(dueDate, referenceDate);
  if (difference < 0) return `${Math.abs(difference)}d atrasada`;
  if (difference === 0) return "Hoje";
  if (difference === 1) return "Amanhã";
  if (difference <= 7) return `${difference} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(dueDate)
    .replace(".", "")
    .toUpperCase();
}

function calculateAreaHealth(obligations: DashboardObligation[], area: ObligationArea, referenceDate: Date): number {
  const areaItems = obligations.filter((item) => item.area === area);
  if (areaItems.length === 0) return 100;
  const activeItems = areaItems.filter((item) => item.status !== "COMPLETED" && item.status !== "CANCELED");
  const overdue = activeItems.filter((item) => getDaysDifference(item.dueDate, referenceDate) < 0).length;
  const critical = activeItems.filter((item) => item.priority === "CRITICAL").length;
  const high = activeItems.filter((item) => item.priority === "HIGH").length;
  return Math.max(0, Math.min(100, 100 - overdue * 18 - critical * 8 - high * 4));
}

export default function Home() {
  const [obligations, setObligations] = useState<DashboardObligation[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<DashboardFinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [obligationResponse, financialResponse] = await Promise.all([
          fetch("/api/obrigacoes", { cache: "no-store" }),
          fetch("/api/financeiro/contas", { cache: "no-store" }),
        ]);
        const [obligationData, financialData] = await Promise.all([
          obligationResponse.json(),
          financialResponse.json(),
        ]);
        if (!obligationResponse.ok || !obligationData.success || !Array.isArray(obligationData.obligations)) {
          throw new Error(obligationData?.message ?? "Não foi possível carregar as obrigações.");
        }
        if (!financialResponse.ok || !financialData.success || !Array.isArray(financialData.accounts)) {
          throw new Error(financialData?.message ?? "Não foi possível carregar o financeiro.");
        }
        if (cancelled) return;
        setObligations(
          (obligationData.obligations as DashboardObligationApiItem[]).map((item) => ({
            ...item,
            dueDate: new Date(item.dueDate),
            completedAt: item.completedAt ? new Date(item.completedAt) : null,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })),
        );
        setFinancialAccounts(
          (financialData.accounts as DashboardFinancialAccountApiItem[]).map((item) => ({
            ...item,
            dueDate: new Date(item.dueDate),
            amount: Number(item.amount),
            paidAmount: Number(item.paidAmount),
            discount: Number(item.discount),
            interest: Number(item.interest),
            fine: Number(item.fine),
          })),
        );
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar o dashboard.");
          setObligations([]);
          setFinancialAccounts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const referenceDate = useMemo(() => new Date(), []);

  function getFinancialRemaining(account: DashboardFinancialAccount): number {
    const total = account.amount - account.discount + account.interest + account.fine;
    return Math.max(0, total - account.paidAmount);
  }

  const activeFinancialAccounts = financialAccounts.filter((item) => item.status !== "PAID" && item.status !== "CANCELED");
  const payableAccounts = activeFinancialAccounts.filter((item) => item.type === "PAYABLE");
  const receivableAccounts = activeFinancialAccounts.filter((item) => item.type === "RECEIVABLE");
  const totalPayable = payableAccounts.reduce((total, item) => total + getFinancialRemaining(item), 0);
  const totalReceivable = receivableAccounts.reduce((total, item) => total + getFinancialRemaining(item), 0);
  const overdueFinancialAccounts = activeFinancialAccounts.filter((item) => item.dueDate.getTime() < referenceDate.getTime());

  const activeObligations = obligations.filter((item) => item.status !== "COMPLETED" && item.status !== "CANCELED");
  const attentionItems = [...activeObligations]
    .filter((item) => item.priority === "CRITICAL" || item.priority === "HIGH")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  const criticalItems = attentionItems.filter((item) => item.priority === "CRITICAL");
  const totalAttentionItems = attentionItems.length + overdueFinancialAccounts.length;
  const nextSevenDays = activeObligations.filter((item) => {
    const difference = getDaysDifference(item.dueDate, referenceDate);
    return difference >= 0 && difference <= 7;
  });

  return (
    <AppShell sidebar={<Sidebar />} header={<Header />}>
      <div className="h-full overflow-auto p-3 sm:p-5">
        <div className="mx-auto w-full max-w-[1600px]">
          <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Visão Executiva</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">Dashboard</h2>
              <p className="mt-1 text-sm text-[#64748B]">Resumo consolidado de obrigações e financeiro.</p>
            </div>
            <div className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-sm sm:w-auto sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Itens de atenção</p>
              <p className="mt-1 text-xl font-bold text-[#DC2626]">{totalAttentionItems}</p>
            </div>
          </section>

          {loading && <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm text-[#64748B]" role="status">Carregando indicadores...</div>}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-[#DC2626]" role="alert">{error}</div>}

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principais">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"><p className="text-xs text-[#64748B]">Contas a pagar</p><p className="mt-2 break-words text-xl font-bold text-[#DC2626]">{formatCurrency(totalPayable)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">{payableAccounts.length} em aberto</p></div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"><p className="text-xs text-[#64748B]">Contas a receber</p><p className="mt-2 break-words text-xl font-bold text-[#16A34A]">{formatCurrency(totalReceivable)}</p><p className="mt-1 text-[10px] text-[#94A3B8]">{receivableAccounts.length} em aberto</p></div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"><p className="text-xs text-[#64748B]">Obrigações críticas</p><p className="mt-2 text-xl font-bold text-[#DC2626]">{criticalItems.length}</p><p className="mt-1 text-[10px] text-[#94A3B8]">Prioridade crítica</p></div>
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm"><p className="text-xs text-[#64748B]">Próximos 7 dias</p><p className="mt-2 text-xl font-bold text-[#154B7A]">{nextSevenDays.length}</p><p className="mt-1 text-[10px] text-[#94A3B8]">Obrigações com vencimento</p></div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2947]">Atenções prioritárias</h3>
              <div className="mt-3 space-y-2">
                {attentionItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-[#F1F5F9] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="break-words text-sm font-semibold text-[#0F172A]">{item.title}</p><p className="text-[11px] text-[#94A3B8]">{areaLabels[item.area]} • {item.responsibleName}</p></div>
                    <div className="shrink-0 sm:text-right"><p className="text-xs font-bold text-[#D97706]">{item.priority === "CRITICAL" ? "Crítica" : "Alta"}</p><p className="text-[10px] text-[#94A3B8]">{formatDeadline(item.dueDate, referenceDate)}</p></div>
                  </div>
                ))}
                {attentionItems.length === 0 && <p className="text-sm text-[#64748B]">Nenhuma obrigação prioritária pendente.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2947]">Saúde por área</h3>
              <div className="mt-4 space-y-4">
                {monitoredAreas.map((item) => {
                  const health = calculateAreaHealth(obligations, item.area, referenceDate);
                  return (
                    <div key={item.area}>
                      <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#475569]">{item.name}</span><span className="text-xs font-bold text-[#154B7A]">{health}%</span></div>
                      <div className="mt-1 h-2 rounded-full bg-[#EAF3FB]" role="progressbar" aria-label={`Saúde ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={health}><div className="h-2 rounded-full bg-[#154B7A]" style={{ width: `${health}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
