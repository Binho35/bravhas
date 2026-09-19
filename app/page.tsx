"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  ClipboardCheck,
  TrendingUp,
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

  const kpis = [
    {
      label: "Contas a pagar",
      value: formatCurrency(totalPayable),
      detail: `${payableAccounts.length} em aberto`,
      icon: WalletCards,
      tone: "danger",
    },
    {
      label: "Contas a receber",
      value: formatCurrency(totalReceivable),
      detail: `${receivableAccounts.length} em aberto`,
      icon: CircleDollarSign,
      tone: "success",
    },
    {
      label: "Obrigações críticas",
      value: String(criticalItems.length),
      detail: "Prioridade crítica",
      icon: AlertTriangle,
      tone: "warning",
    },
    {
      label: "Próximos 7 dias",
      value: String(nextSevenDays.length),
      detail: "Obrigações com vencimento",
      icon: CalendarClock,
      tone: "info",
    },
  ];

  return (
    <AppShell sidebar={<Sidebar />} header={<Header />}>
      <div className="bravhas-dashboard h-full overflow-auto">
        <div className="mx-auto w-full max-w-[1560px]">
          <section className="bravhas-dashboard-hero">
            <div>
              <span className="bravhas-dashboard-eyebrow">Visão Executiva</span>
              <h2>Dashboard</h2>
              <p>
                Financeiro, obrigações e pessoas reunidos em uma leitura objetiva da operação administrativa.
              </p>
            </div>

            <div className="bravhas-attention-card" data-clear={totalAttentionItems === 0}>
              <span>
                {totalAttentionItems === 0 ? (
                  <ClipboardCheck size={18} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={18} aria-hidden="true" />
                )}
              </span>
              <div>
                <small>Itens de atenção</small>
                <strong>{totalAttentionItems}</strong>
              </div>
            </div>
          </section>

          {loading && (
            <div className="bravhas-feedback mt-4" role="status">
              Carregando indicadores...
            </div>
          )}
          {error && (
            <div className="bravhas-feedback bravhas-feedback-error mt-4" role="alert">
              {error}
            </div>
          )}

          <section className="bravhas-kpi-grid" aria-label="Indicadores principais">
            {kpis.map(({ icon: Icon, ...item }) => (
              <article className="bravhas-kpi-card" data-tone={item.tone} key={item.label}>
                <div className="bravhas-kpi-icon">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="bravhas-dashboard-grid">
            <article className="bravhas-executive-panel">
              <header className="bravhas-panel-heading">
                <div>
                  <span>Acompanhamento</span>
                  <h3>Atenções prioritárias</h3>
                </div>
                <p>{attentionItems.length} obrigação{attentionItems.length === 1 ? "" : "ões"}</p>
              </header>

              <div className="bravhas-priority-list">
                {attentionItems.slice(0, 8).map((item) => (
                  <div key={item.id} className="bravhas-priority-row">
                    <span className="bravhas-priority-marker" data-critical={item.priority === "CRITICAL"} />
                    <div className="min-w-0 flex-1">
                      <strong>{item.title}</strong>
                      <small>{areaLabels[item.area]} · {item.responsibleName}</small>
                    </div>
                    <div className="bravhas-priority-deadline">
                      <span>{item.priority === "CRITICAL" ? "Crítica" : "Alta"}</span>
                      <small>{formatDeadline(item.dueDate, referenceDate)}</small>
                    </div>
                  </div>
                ))}
                {attentionItems.length === 0 && (
                  <div className="bravhas-empty-state">
                    <ClipboardCheck size={22} aria-hidden="true" />
                    <div>
                      <strong>Nenhuma prioridade crítica pendente.</strong>
                      <p>As obrigações que exigirem atenção aparecerão aqui.</p>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <article className="bravhas-executive-panel">
              <header className="bravhas-panel-heading">
                <div>
                  <span>Leitura executiva</span>
                  <h3>Saúde por área</h3>
                </div>
                <TrendingUp size={19} className="text-[#4A9BC7]" aria-hidden="true" />
              </header>

              <div className="bravhas-health-list">
                {monitoredAreas.map((item) => {
                  const health = calculateAreaHealth(obligations, item.area, referenceDate);
                  return (
                    <div className="bravhas-health-row" key={item.area}>
                      <div className="flex items-center justify-between gap-3">
                        <span>{item.name}</span>
                        <strong>{health}%</strong>
                      </div>
                      <div
                        className="bravhas-health-track"
                        role="progressbar"
                        aria-label={`Saúde ${item.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={health}
                      >
                        <span style={{ width: `${health}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
