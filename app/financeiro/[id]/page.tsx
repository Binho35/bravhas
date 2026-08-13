"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AppShell,
} from "@/components/layout/AppShell";

import {
  Header,
} from "@/components/layout/Header";

import {
  Sidebar,
} from "@/components/layout/Sidebar";

import {
  PermissionGuard,
} from "@/modules/auth/components/PermissionGuard";

import {
  FinancialActions,
} from "@/modules/financial/components/FinancialActions";

import {
  FinancialDetails,
} from "@/modules/financial/components/FinancialDetails";

import {
  FinancialHistory,
} from "@/modules/financial/components/FinancialHistory";

import {
  FinancialSummary,
} from "@/modules/financial/components/FinancialSummary";

import {
  HarpiaFinancialCard,
} from "@/modules/financial/components/HarpiaFinancialCard";

import {
  useFinancialAccount,
} from "@/modules/financial/hooks/useFinancialAccount";

import type {
  FinancialTransaction,
} from "@/modules/financial/types/FinancialTransaction";

import type {
  FinancialAccountView,
} from "@/modules/financial/types/FinancialAccountView";

export default function FinancialAccountPage() {
  const params =
    useParams<{ id: string }>();

  const router =
    useRouter();

  const [
    transactions,
    setTransactions,
  ] =
    useState<
      FinancialTransaction[]
    >([]);

  const {
    account,
    loading,
    notFound,
    total,
    remaining,
    isOverdue,
    onAccountUpdated,
  } =
    useFinancialAccount(
      params.id,
    );

  const loadTransactions =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              `/api/financeiro/contas/${params.id}/transacoes`,
            );

          if (!response.ok) {
            throw new Error(
              "Não foi possível carregar o histórico financeiro.",
            );
          }

          const data =
            await response.json();

          if (
            !data.success ||
            !Array.isArray(
              data.transactions,
            )
          ) {
            throw new Error(
              "Resposta inválida ao carregar o histórico financeiro.",
            );
          }

          setTransactions(
            data.transactions,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar histórico financeiro:",
            error,
          );

          setTransactions([]);
        }
      },
      [params.id],
    );

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  function handleAccountUpdated(
    updatedAccount: FinancialAccountView,
  ) {
    onAccountUpdated(
      updatedAccount,
    );

    void loadTransactions();
  }

  if (loading) {
    return (
      <PermissionGuard
        resource="FINANCIAL"
      >
        <AppShell
          sidebar={<Sidebar />}
          header={<Header />}
        >
          <div className="flex h-full items-center justify-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Financeiro
              </p>

              <h2 className="mt-2 text-lg font-bold text-[#0B2947]">
                Carregando ficha financeira...
              </h2>
            </div>
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  if (
    notFound ||
    !account
  ) {
    return (
      <PermissionGuard
        resource="FINANCIAL"
      >
        <AppShell
          sidebar={<Sidebar />}
          header={<Header />}
        >
          <div className="flex h-full items-center justify-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Financeiro
              </p>

              <h2 className="mt-2 text-lg font-bold text-[#0B2947]">
                Conta financeira não encontrada
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                O lançamento solicitado não está disponível.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/financeiro",
                  )
                }
                className="mt-5 rounded-xl bg-[#154B7A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#103D65]"
              >
                Voltar ao Financeiro
              </button>
            </div>
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  const statusText =
    account.status ===
    "PAID"
      ? "Pago"
      : account.status ===
          "PARTIALLY_PAID"
        ? "Parcialmente liquidado"
        : account.status ===
            "CANCELED"
          ? "Cancelado"
          : isOverdue
            ? "Vencido"
            : "Em aberto";

  return (
    <PermissionGuard
      resource="FINANCIAL"
    >
      <AppShell
        sidebar={<Sidebar />}
        header={<Header />}
      >
        <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
          <section className="flex items-end justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Financeiro • Ficha Financeira
              </p>

              <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-[#0B2947]">
                {account.description}
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                {account.type ===
                "PAYABLE"
                  ? "Conta a pagar"
                  : "Conta a receber"}{" "}
                • {statusText}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/financeiro",
                )
              }
              className="shrink-0 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
            >
              Voltar
            </button>
          </section>

          <section className="grid min-h-0 grid-cols-[1.35fr_0.65fr] gap-4">
            <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4 overflow-auto">
              <FinancialDetails
                account={
                  account
                }
              />

              <FinancialHistory
                transactions={
                  transactions
                }
              />
            </div>

            <div className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-4 overflow-auto">
              <HarpiaFinancialCard
                accountType={
                  account.type
                }
                status={
                  account.status
                }
                remaining={
                  remaining
                }
              />

              <FinancialSummary
                account={
                  account
                }
                total={
                  total
                }
                remaining={
                  remaining
                }
              />

              <FinancialActions
                account={
                  account
                }
                total={
                  total
                }
                remaining={
                  remaining
                }
                onAccountUpdated={
                  handleAccountUpdated
                }
              />
            </div>
          </section>
        </div>
      </AppShell>
    </PermissionGuard>
  );
}