"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import { CashFlowSummary } from "@/modules/financial/components/CashFlowSummary";
import { CashFlowTimeline } from "@/modules/financial/components/CashFlowTimeline";

import {
  calculateCashFlow,
  type CashFlowSummary as CashFlowSummaryData,
} from "@/modules/financial/services/calculateCashFlow";

import {
  getStoredFinancialAccounts,
  type StoredFinancialAccount,
} from "@/modules/financial/storage/financialStorage";

import {
  getFinancialTransactions,
} from "@/modules/financial/storage/financialTransactionStorage";

import type {
  FinancialTransaction,
} from "@/modules/financial/types/FinancialTransaction";

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

  const [
    accounts,
    setAccounts,
  ] = useState<
    StoredFinancialAccount[]
  >([]);

  const [
    transactions,
    setTransactions,
  ] = useState<
    FinancialTransaction[]
  >([]);

  const [
    openingBalance,
    setOpeningBalance,
  ] = useState("0");

  useEffect(() => {
    setAccounts(
      getStoredFinancialAccounts(),
    );

    setTransactions(
      getFinancialTransactions(),
    );
  }, []);

  const summary =
    useMemo(() => {
      const parsedOpeningBalance =
        Number(
          openingBalance
            .replace(/\./g, "")
            .replace(",", "."),
        );

      if (
        !Number.isFinite(
          parsedOpeningBalance,
        )
      ) {
        return EMPTY_SUMMARY;
      }

      return calculateCashFlow({
        accounts,

        transactions,

        openingBalance:
          parsedOpeningBalance,
      });
    }, [
      accounts,
      transactions,
      openingBalance,
    ]);

  const negativeDays =
    summary.buckets.filter(
      (bucket) =>
        bucket.projectedBalance < 0,
    );

  const firstNegativeDay =
    negativeDays[0];

  const harpiaMessage =
    firstNegativeDay
      ? `A projeção indica saldo negativo a partir de ${firstNegativeDay.date}. Recomendo revisar pagamentos previstos ou antecipar recebimentos.`
      : summary.totalPayable >
          summary.totalReceivable
        ? "As saídas previstas estão acima das entradas previstas. Vale revisar o calendário de pagamentos."
        : "A projeção atual não apresenta déficit no período analisado.";

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4 overflow-hidden p-5">
        {/* CABEÇALHO */}
        <section className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Financeiro
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              Fluxo de Caixa
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Projeção de entradas, saídas e saldo futuro.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/financeiro",
              )
            }
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
          >
            Voltar ao Financeiro
          </button>
        </section>

        {/* CONTROLES */}
        <section className="grid grid-cols-[1fr_auto] items-end gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="max-w-xs">
            <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
              Saldo inicial
            </label>

            <input
              value={
                openingBalance
              }
              onChange={(event) =>
                setOpeningBalance(
                  event.target.value,
                )
              }
              inputMode="decimal"
              placeholder="0,00"
              className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
            />
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
              Horizonte
            </p>

            <p className="mt-1 text-sm font-bold text-[#0B2947]">
              Próximos 30 dias
            </p>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="grid min-h-0 grid-cols-[0.75fr_1.25fr] gap-4">
          <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            <CashFlowSummary
              summary={summary}
            />

            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Harpia
              </p>

              <h3 className="mt-2 text-lg font-bold">
                Análise do caixa
              </h3>

              <p className="mt-4 text-sm leading-6 text-white/75">
                {harpiaMessage}
              </p>

              <div className="mt-5 rounded-xl bg-white/10 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Dias com saldo negativo
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {
                    negativeDays.length
                  }
                </p>
              </div>
            </div>
          </div>

          <CashFlowTimeline
            buckets={
              summary.buckets
            }
            limit={30}
          />
        </section>
      </div>
    </AppShell>
  );
}