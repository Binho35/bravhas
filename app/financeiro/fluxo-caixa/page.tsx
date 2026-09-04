"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PermissionGuard } from "@/modules/auth/components/PermissionGuard";
import { CashFlowSummary } from "@/modules/financial/components/CashFlowSummary";
import { CashFlowTimeline } from "@/modules/financial/components/CashFlowTimeline";
import {
  calculateCashFlow,
  type CashFlowAccount,
  type CashFlowSummary as CashFlowSummaryData,
} from "@/modules/financial/services/calculateCashFlow";
import type { FinancialTransaction } from "@/modules/financial/types/FinancialTransaction";

interface AccountApiItem {
  id: string;
  type: CashFlowAccount["type"];
  status: CashFlowAccount["status"];
  dueDate: string;
  amount: number | string;
  paidAmount: number | string;
  discount: number | string;
  interest: number | string;
  fine: number | string;
}

const EMPTY_SUMMARY: CashFlowSummaryData = {
  totalReceivable: 0,
  totalPayable: 0,
  totalReceived: 0,
  totalPaid: 0,
  projectedBalance: 0,
  overdueReceivable: 0,
  overduePayable: 0,
  buckets: [],
};

export default function CashFlowPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<CashFlowAccount[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCashFlowData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/financeiro/contas", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.accounts)) {
          throw new Error(data?.message ?? "Não foi possível carregar o fluxo de caixa.");
        }
        if (cancelled) return;

        const apiAccounts = data.accounts as AccountApiItem[];
        const mappedAccounts: CashFlowAccount[] = apiAccounts.map((account) => ({
          id: account.id,
          type: account.type,
          status: account.status,
          dueDate: account.dueDate,
          amount: Number(account.amount),
          paidAmount: Number(account.paidAmount),
          discount: Number(account.discount),
          interest: Number(account.interest),
          fine: Number(account.fine),
        }));

        const transactionResponses = await Promise.all(
          mappedAccounts.map(async (account) => {
            const transactionResponse = await fetch(`/api/financeiro/contas/${account.id}/transacoes`, { cache: "no-store" });
            const transactionData = await transactionResponse.json();
            if (!transactionResponse.ok || !transactionData.success || !Array.isArray(transactionData.transactions)) return [];
            return transactionData.transactions as FinancialTransaction[];
          }),
        );

        if (!cancelled) {
          setAccounts(mappedAccounts);
          setTransactions(transactionResponses.flat());
        }
      } catch (caughtError) {
        if (!cancelled) {
          setAccounts([]);
          setTransactions([]);
          setError(caughtError instanceof Error ? caughtError.message : "Não foi possível carregar o fluxo de caixa.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCashFlowData();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const parsedOpeningBalance = Number(openingBalance.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsedOpeningBalance)) return EMPTY_SUMMARY;
    return calculateCashFlow({ accounts, transactions, openingBalance: parsedOpeningBalance });
  }, [accounts, transactions, openingBalance]);

  const negativeDays = summary.buckets.filter((bucket) => bucket.projectedBalance < 0);
  const firstNegativeDay = negativeDays[0];
  const harpiaMessage = firstNegativeDay
    ? `A projeção indica saldo negativo a partir de ${firstNegativeDay.date}. Recomendo revisar pagamentos previstos ou antecipar recebimentos.`
    : summary.totalPayable > summary.totalReceivable
      ? "As saídas previstas estão acima das entradas previstas. Vale revisar o calendário de pagamentos."
      : "A projeção atual não apresenta déficit no período analisado.";

  return (
    <PermissionGuard resource="CASH_FLOW" action="VIEW">
      <AppShell sidebar={<Sidebar />} header={<Header />}>
        <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden p-5">
          <section className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Financeiro</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">Fluxo de Caixa</h2>
              <p className="mt-1 text-sm text-[#64748B]">Projeção de entradas, saídas e saldo futuro.</p>
            </div>
            <button type="button" onClick={() => router.push("/financeiro")} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]">Voltar ao Financeiro</button>
          </section>

          <section className="grid grid-cols-[1fr_auto] items-end gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold text-[#475569]">Saldo inicial</label>
              <input value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} inputMode="decimal" placeholder="0,00" className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10" />
            </div>
            <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Horizonte</p><p className="mt-1 text-sm font-bold text-[#0B2947]">Próximos 30 dias</p></div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-sm text-[#64748B]">Carregando fluxo de caixa...</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-[#DC2626]">{error}</div>
          ) : (
            <section className="grid min-h-0 grid-cols-[0.75fr_1.25fr] gap-4">
              <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
                <CashFlowSummary summary={summary} />
                <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Harpia</p>
                  <h3 className="mt-2 text-lg font-bold">Análise do caixa</h3>
                  <p className="mt-4 text-sm leading-6 text-white/75">{harpiaMessage}</p>
                  <div className="mt-5 rounded-xl bg-white/10 p-4"><p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Dias com saldo negativo</p><p className="mt-2 text-2xl font-bold">{negativeDays.length}</p></div>
                </div>
              </div>
              <CashFlowTimeline buckets={summary.buckets} limit={30} />
            </section>
          )}
        </div>
      </AppShell>
    </PermissionGuard>
  );
}
