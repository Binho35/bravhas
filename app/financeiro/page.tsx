"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import { financialAccounts as mockFinancialAccounts } from "@/modules/financial/mocks/financialAccounts";

import {
  getStoredFinancialAccounts,
  type StoredFinancialAccount,
} from "@/modules/financial/storage/financialStorage";

import type {
  FinancialAccountStatus,
  FinancialAccountType,
} from "@/modules/financial/domain/entities/FinancialAccount";

interface FinancialAccountListItem {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type: FinancialAccountType;

  status: FinancialAccountStatus;

  description: string;

  documentNumber?: string | null;

  issueDate: Date;

  dueDate: Date;

  paymentDate?: Date | null;

  amount: number;

  paidAmount: number;

  discount: number;

  interest: number;

  fine: number;

  notes?: string | null;

  createdBy: string;

  updatedBy?: string | null;

  createdAt: Date;

  updatedAt: Date;
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

function convertStoredFinancialAccount(
  item: StoredFinancialAccount,
): FinancialAccountListItem {
  return {
    ...item,

    issueDate: new Date(
      item.issueDate,
    ),

    dueDate: new Date(
      item.dueDate,
    ),

    paymentDate:
      item.paymentDate
        ? new Date(
            item.paymentDate,
          )
        : null,

    createdAt: new Date(
      item.createdAt,
    ),

    updatedAt: new Date(
      item.updatedAt,
    ),
  };
}

function isAccountOverdue(
  account: FinancialAccountListItem,
  referenceDate: Date,
): boolean {
  if (
    account.status === "PAID" ||
    account.status === "CANCELED"
  ) {
    return false;
  }

  return (
    account.dueDate.getTime() <
    referenceDate.getTime()
  );
}

export default function FinanceiroPage() {
  const router = useRouter();

  const [
    storedFinancialAccounts,
    setStoredFinancialAccounts,
  ] = useState<
    FinancialAccountListItem[]
  >([]);

  useEffect(() => {
    const stored =
      getStoredFinancialAccounts().map(
        convertStoredFinancialAccount,
      );

    setStoredFinancialAccounts(
      stored,
    );
  }, []);

  const financialAccounts =
    useMemo(
      () => [
        ...mockFinancialAccounts,
        ...storedFinancialAccounts,
      ],
      [storedFinancialAccounts],
    );

  const today = new Date();

  const payableOpen =
    useMemo(
      () =>
        financialAccounts.filter(
          (item) =>
            item.type ===
              "PAYABLE" &&
            item.status !==
              "PAID" &&
            item.status !==
              "CANCELED",
        ),
      [financialAccounts],
    );

  const receivableOpen =
    useMemo(
      () =>
        financialAccounts.filter(
          (item) =>
            item.type ===
              "RECEIVABLE" &&
            item.status !==
              "PAID" &&
            item.status !==
              "CANCELED",
        ),
      [financialAccounts],
    );

  const paidAccounts =
    useMemo(
      () =>
        financialAccounts.filter(
          (item) =>
            item.status ===
            "PAID",
        ),
      [financialAccounts],
    );

  const totalPayable =
    payableOpen.reduce(
      (total, item) =>
        total + item.amount,
      0,
    );

  const totalReceivable =
    receivableOpen.reduce(
      (total, item) =>
        total + item.amount,
      0,
    );

  const totalPaid =
    paidAccounts.reduce(
      (total, item) =>
        total +
        item.paidAmount,
      0,
    );

  const projectedBalance =
    totalReceivable -
    totalPayable;

  const overdueAccounts =
    financialAccounts.filter(
      (item) =>
        isAccountOverdue(
          item,
          today,
        ),
    );

  const upcomingAccounts =
    [...financialAccounts]
      .filter(
        (item) =>
          item.status !==
            "PAID" &&
          item.status !==
            "CANCELED",
      )
      .sort(
        (a, b) =>
          a.dueDate.getTime() -
          b.dueDate.getTime(),
      )
      .slice(0, 6);

  const dayFiveReceivables =
    receivableOpen.filter(
      (item) =>
        item.dueDate.getDate() ===
        5,
    );

  const dayTwentyReceivables =
    receivableOpen.filter(
      (item) =>
        item.dueDate.getDate() ===
        20,
    );

  const dayFiveTotal =
    dayFiveReceivables.reduce(
      (total, item) =>
        total + item.amount,
      0,
    );

  const dayTwentyTotal =
    dayTwentyReceivables.reduce(
      (total, item) =>
        total + item.amount,
      0,
    );

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
              Gestão Administrativa
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B2947]">
              Financeiro
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Caixa, recebimentos,
              pagamentos e vencimentos
              sob acompanhamento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-right shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                Posição projetada
              </p>

              <p
                className={`mt-1 text-sm font-bold ${
                  projectedBalance >=
                  0
                    ? "text-[#16A34A]"
                    : "text-[#DC2626]"
                }`}
              >
                {formatCurrency(
                  projectedBalance,
                )}
              </p>
            </div>

            <Link
              href="/financeiro/nova"
              className="flex h-[58px] items-center rounded-xl bg-[#154B7A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#103D65]"
            >
              + Nova conta
            </Link>
          </div>
        </section>

        {/* INDICADORES */}
        <section className="grid grid-cols-5 gap-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Contas a pagar
            </p>

            <p className="mt-2 text-xl font-bold text-[#DC2626]">
              {formatCurrency(
                totalPayable,
              )}
            </p>

            <p className="mt-1 text-[10px] text-[#94A3B8]">
              {payableOpen.length}{" "}
              {payableOpen.length === 1
                ? "em aberto"
                : "em aberto"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Contas a receber
            </p>

            <p className="mt-2 text-xl font-bold text-[#16A34A]">
              {formatCurrency(
                totalReceivable,
              )}
            </p>

            <p className="mt-1 text-[10px] text-[#94A3B8]">
              {receivableOpen.length}{" "}
              em aberto
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Saldo projetado
            </p>

            <p
              className={`mt-2 text-xl font-bold ${
                projectedBalance >= 0
                  ? "text-[#154B7A]"
                  : "text-[#DC2626]"
              }`}
            >
              {formatCurrency(
                projectedBalance,
              )}
            </p>

            <p className="mt-1 text-[10px] text-[#94A3B8]">
              Receber menos pagar
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Vencidas
            </p>

            <p className="mt-2 text-xl font-bold text-[#DC2626]">
              {
                overdueAccounts.length
              }
            </p>

            <p className="mt-1 text-[10px] text-[#94A3B8]">
              Exigem ação imediata
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#64748B]">
              Pagamentos realizados
            </p>

            <p className="mt-2 text-xl font-bold text-[#154B7A]">
              {formatCurrency(
                totalPaid,
              )}
            </p>

            <p className="mt-1 text-[10px] text-[#94A3B8]">
              No período atual
            </p>
          </div>
        </section>

        {/* CONTEÚDO */}
        <section className="grid min-h-0 grid-cols-[1.2fr_0.8fr] gap-4">
          {/* ESQUERDA */}
          <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            {/* RECEBIMENTOS 5 E 20 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Recebimentos previstos
                </p>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0B2947]">
                      Dia 5
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#16A34A]">
                      {formatCurrency(
                        dayFiveTotal,
                      )}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF3FB] px-2.5 py-1 text-[10px] font-bold text-[#154B7A]">
                    {
                      dayFiveReceivables.length
                    }{" "}
                    previstos
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Recebimentos previstos
                </p>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0B2947]">
                      Dia 20
                    </p>

                    <p className="mt-1 text-2xl font-bold text-[#16A34A]">
                      {formatCurrency(
                        dayTwentyTotal,
                      )}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF3FB] px-2.5 py-1 text-[10px] font-bold text-[#154B7A]">
                    {
                      dayTwentyReceivables.length
                    }{" "}
                    previstos
                  </span>
                </div>
              </div>
            </div>

            {/* TABELA */}
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0B2947]">
                    Movimentações financeiras
                  </h3>

                  <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                    Contas a pagar e receber
                    no período.
                  </p>
                </div>

                <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#64748B]">
                  {
                    financialAccounts.length
                  }{" "}
                  lançamentos
                </span>
              </div>

              <div className="min-h-0 overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                    <tr className="border-b border-[#E2E8F0] text-left">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Descrição
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Tipo
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Vencimento
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Valor
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...financialAccounts]
                      .sort(
                        (a, b) =>
                          a.dueDate.getTime() -
                          b.dueDate.getTime(),
                      )
                      .map((item) => {
                        const overdue =
                          isAccountOverdue(
                            item,
                            today,
                          );

                        return (
                          <tr
                            key={item.id}
                            onClick={() =>
                              router.push(
                                `/financeiro/${item.id}`,
                              )
                            }
                            className="cursor-pointer border-b border-[#F1F5F9] transition hover:bg-[#F8FAFC]"
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-[#0F172A]">
                                {
                                  item.description
                                }
                              </p>

                              <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                                {item.documentNumber ??
                                  "Sem documento"}
                              </p>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  item.type ===
                                  "PAYABLE"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                {item.type ===
                                "PAYABLE"
                                  ? "Pagar"
                                  : "Receber"}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs font-semibold text-[#475569]">
                              {formatDate(
                                item.dueDate,
                              )}
                            </td>

                            <td className="px-4 py-3 text-xs font-bold text-[#0F172A]">
                              {formatCurrency(
                                item.amount,
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  item.status ===
                                  "PAID"
                                    ? "bg-green-50 text-green-700"
                                    : overdue
                                      ? "bg-red-50 text-red-700"
                                      : item.status ===
                                          "PARTIALLY_PAID"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {item.status ===
                                "PAID"
                                  ? "Pago"
                                  : overdue
                                    ? "Vencido"
                                    : item.status ===
                                        "PARTIALLY_PAID"
                                      ? "Parcial"
                                      : "Em aberto"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* DIREITA */}
          <div className="grid min-h-0 grid-rows-[auto_1fr] gap-4">
            {/* RESUMO */}
            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Controle Financeiro
              </p>

              <h3 className="mt-2 text-lg font-bold">
                Posição do caixa
              </h3>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    A receber
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(
                      totalReceivable,
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/60">
                    A pagar
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(
                      totalPayable,
                    )}
                  </span>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/70">
                      Resultado projetado
                    </span>

                    <span
                      className={`text-lg font-bold ${
                        projectedBalance >=
                        0
                          ? "text-[#8CC4EA]"
                          : "text-red-300"
                      }`}
                    >
                      {formatCurrency(
                        projectedBalance,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PRÓXIMOS VENCIMENTOS */}
            <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
              <div className="border-b border-[#E2E8F0] px-4 py-3">
                <h3 className="text-sm font-bold text-[#0B2947]">
                  Próximos vencimentos
                </h3>

                <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                  Obrigações financeiras
                  por data.
                </p>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {upcomingAccounts.map(
                  (item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">
                          {
                            item.description
                          }
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                          {formatDate(
                            item.dueDate,
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xs font-bold ${
                            item.type ===
                            "PAYABLE"
                              ? "text-[#DC2626]"
                              : "text-[#16A34A]"
                          }`}
                        >
                          {formatCurrency(
                            item.amount,
                          )}
                        </p>

                        <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#94A3B8]">
                          {item.type ===
                          "PAYABLE"
                            ? "Pagar"
                            : "Receber"}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}