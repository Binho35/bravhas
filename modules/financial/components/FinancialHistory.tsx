"use client";

import type { FinancialTransaction } from "../types/FinancialTransaction";

interface FinancialHistoryProps {
  transactions: FinancialTransaction[];
}

function getIcon(
  type: FinancialTransaction["type"],
): string {
  switch (type) {
    case "PAYMENT":
      return "💸";

    case "RECEIPT":
      return "💰";

    case "REVERSAL":
      return "↩️";

    case "CANCELLATION":
      return "❌";

    default:
      return "•";
  }
}

function getTitle(
  type: FinancialTransaction["type"],
): string {
  switch (type) {
    case "PAYMENT":
      return "Pagamento";

    case "RECEIPT":
      return "Recebimento";

    case "REVERSAL":
      return "Estorno";

    case "CANCELLATION":
      return "Cancelamento";

    default:
      return "Movimentação";
  }
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
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export function FinancialHistory({
  transactions,
}: FinancialHistoryProps) {
  const orderedTransactions =
    [...transactions].sort(
      (a, b) =>
        new Date(
          b.performedAt,
        ).getTime() -
        new Date(
          a.performedAt,
        ).getTime(),
    );

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-[#E2E8F0] px-6 py-4">
        <h2 className="text-lg font-bold text-[#0B2947]">
          Histórico Financeiro
        </h2>

        <p className="mt-1 text-sm text-[#64748B]">
          Todas as movimentações
          realizadas nesta conta.
        </p>
      </div>

      {orderedTransactions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-[#94A3B8]">
            Nenhuma movimentação
            registrada.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {orderedTransactions.map(
            (transaction) => (
              <div
                key={
                  transaction.id
                }
                className="flex gap-4 rounded-xl border border-[#E2E8F0] p-4 transition hover:border-[#154B7A]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF3FB] text-2xl">
                  {getIcon(
                    transaction.type,
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#0B2947]">
                      {getTitle(
                        transaction.type,
                      )}
                    </h3>

                    <span className="text-xs text-[#94A3B8]">
                      {formatDate(
                        transaction.performedAt,
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold text-[#154B7A]">
                    {formatCurrency(
                      transaction.amount,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-[#64748B]">
                    Responsável:{" "}
                    <strong>
                      {
                        transaction.performedBy
                      }
                    </strong>
                  </p>

                  {transaction.notes && (
                    <p className="mt-2 rounded-lg bg-[#F8FAFC] p-3 text-sm text-[#475569]">
                      {
                        transaction.notes
                      }
                    </p>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}