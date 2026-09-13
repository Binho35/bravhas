"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  WalletCards,
} from "lucide-react";

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
      <div className="h-full overflow-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
        <div className="mx-auto w-full max-w-[1600px]">
          <section
            className="relative overflow-hidden rounded-[28px] border border-[#173D5F] bg-[#0B2947] p-5 text-white shadow-[0_28px_70px_-46px_rgba(11,41,71,0.85)] sm:p-7"
            aria-labelledby="dashboard-title"
          >
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#2C7DB6]/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 right-32 h-52 w-52 rounded-full bg-[#8CC4EA]/10 blur-xl" />
            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ED4F5] sm:text-[11px]">
                  BRAVHAS • VISÃO EXECUTIVA
                </p>
                <h2 id="dashboard-title" className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
                  Dashboard
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/64 sm:text-[15px]">
                  Acompanhe financeiro, prioridades e saúde administrativa em uma visão única para decidir com mais clareza.
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm lg:w-auto lg:min-w-56">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Itens de atenção</p>
                  <p className="mt-1 text-2xl font-bold text-white">{totalAttentionItems}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C453]/15 text-[#F6C453]">
                  <AlertTriangle size={19} aria-hidden="true" />
                </span>
              </div>
            </div>
          </section>

          {loading && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#DCE6F0] bg-white px-4 py-3.5 text-sm font-medium text-[#667B8F] shadow-sm" role="status">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2C7DB6]" />
              Carregando indicadores da operação...
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-[#C2413B]" role="alert">
              {error}
            </div>
          )}

          <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principais">
            <div className="rounded-[22px] border border-[#DEE7EF] bg-white p-4 shadow-[0_14px_35px_-28px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#667B8F]">Contas a pagar</p>
                  <p className="mt-2 break-words text-xl font-bold tracking-[-0.025em] text-[#B54745]">{formatCurrency(totalPayable)}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#8A9CAC]">{payableAccounts.length} em aberto</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F0] text-[#C2413B]">
                  <WalletCards size={18} aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#DEE7EF] bg-white p-4 shadow-[0_14px_35px_-28px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#667B8F]">Contas a receber</p>
                  <p className="mt-2 break-words text-xl font-bold tracking-[-0.025em] text-[#1E7A55]">{formatCurrency(totalReceivable)}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#8A9CAC]">{receivableAccounts.length} em aberto</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF8F1] text-[#1E7A55]">
                  <CircleDollarSign size={18} aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#DEE7EF] bg-white p-4 shadow-[0_14px_35px_-28px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#667B8F]">Obrigações críticas</p>
                  <p className="mt-2 text-xl font-bold tracking-[-0.025em] text-[#B54745]">{criticalItems.length}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#8A9CAC]">Prioridade crítica</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF6E5] text-[#C27B19]">
                  <AlertTriangle size={18} aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="rounded-[22px] border border-[#DEE7EF] bg-white p-4 shadow-[0_14px_35px_-28px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#667B8F]">Próximos 7 dias</p>
                  <p className="mt-2 text-xl font-bold tracking-[-0.025em] text-[#154B7A]">{nextSevenDays.length}</p>
                  <p className="mt-1 text-[10px] font-medium text-[#8A9CAC]">Obrigações com vencimento</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#154B7A]">
                  <CalendarClock size={18} aria-hidden="true" />
                </span>
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-[24px] border border-[#DEE7EF] bg-white p-4 shadow-[0_18px_42px_-34px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[#EDF2F6] pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9CAC]">Prioridades da operação</p>
                  <h3 className="mt-1 text-base font-bold tracking-[-0.02em] text-[#0B2947]">Atenções prioritárias</h3>
                </div>
                <span className="rounded-full bg-[#FFF6E5] px-3 py-1 text-[10px] font-bold text-[#A96613]">{attentionItems.length} pendentes</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {attentionItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex flex-col gap-2.5 rounded-2xl border border-[#E7EEF4] bg-[#FBFCFE] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-[#102A43]">{item.title}</p>
                      <p className="mt-1 text-[11px] text-[#7890A5]">{areaLabels[item.area]} • {item.responsibleName}</p>
                    </div>
                    <div className="shrink-0 sm:text-right">
                      <p className="text-xs font-bold text-[#B66A10]">{item.priority === "CRITICAL" ? "Crítica" : "Alta"}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#8A9CAC]">{formatDeadline(item.dueDate, referenceDate)}</p>
                    </div>
                  </div>
                ))}
                {attentionItems.length === 0 && (
                  <div className="flex items-start gap-3 rounded-2xl border border-[#DDECE5] bg-[#F3FAF6] px-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1E7A55] shadow-sm">
                      <CheckCircle2 size={17} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#315C49]">Nenhuma prioridade crítica pendente.</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#688475]">A operação não possui obrigações de prioridade alta ou crítica neste momento.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#DEE7EF] bg-white p-4 shadow-[0_18px_42px_-34px_rgba(11,41,71,0.55)] sm:p-5">
              <div className="flex items-center gap-3 border-b border-[#EDF2F6] pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#154B7A]">
                  <Landmark size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A9CAC]">Indicador operacional</p>
                  <h3 className="mt-1 text-base font-bold tracking-[-0.02em] text-[#0B2947]">Saúde por área</h3>
                </div>
              </div>
              <div className="mt-5 space-y-5">
                {monitoredAreas.map((item) => {
                  const health = calculateAreaHealth(obligations, item.area, referenceDate);
                  return (
                    <div key={item.area}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-[#536A7F]">{item.name}</span>
                        <span className="text-xs font-black text-[#154B7A]">{health}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EAF1F6]" role="progressbar" aria-label={`Saúde ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={health}>
                        <div className="h-full rounded-full bg-[#2C7DB6] transition-[width]" style={{ width: `${health}%` }} />
                      </div>
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
