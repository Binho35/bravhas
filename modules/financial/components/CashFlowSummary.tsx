import type {
  CashFlowSummary as CashFlowSummaryData,
} from "../services/calculateCashFlow";

import {
  formatCurrency,
} from "../utils/currency";

interface CashFlowSummaryProps {
  summary: CashFlowSummaryData;
}

export function CashFlowSummary({
  summary,
}: CashFlowSummaryProps) {
  const projectedPositive =
    summary.projectedBalance >= 0;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
            Fluxo de Caixa
          </p>

          <h3 className="mt-1 text-base font-bold text-[#0B2947]">
            Posição projetada
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${
            projectedPositive
              ? "bg-green-50 text-[#16A34A]"
              : "bg-red-50 text-[#DC2626]"
          }`}
        >
          {projectedPositive
            ? "Positivo"
            : "Negativo"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-green-700/70">
            A receber
          </p>

          <p className="mt-1 text-lg font-bold text-[#16A34A]">
            {formatCurrency(
              summary.totalReceivable,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-red-50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-red-700/70">
            A pagar
          </p>

          <p className="mt-1 text-lg font-bold text-[#DC2626]">
            {formatCurrency(
              summary.totalPayable,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">
            Já recebido
          </p>

          <p className="mt-1 text-lg font-bold text-[#154B7A]">
            {formatCurrency(
              summary.totalReceived,
            )}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">
            Já pago
          </p>

          <p className="mt-1 text-lg font-bold text-[#154B7A]">
            {formatCurrency(
              summary.totalPaid,
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-[#E2E8F0] pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[#64748B]">
              Saldo projetado
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                projectedPositive
                  ? "text-[#16A34A]"
                  : "text-[#DC2626]"
              }`}
            >
              {formatCurrency(
                summary.projectedBalance,
              )}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-[#94A3B8]">
              Vencidos
            </p>

            <p className="mt-1 text-xs font-semibold text-[#DC2626]">
              Pagar:{" "}
              {formatCurrency(
                summary.overduePayable,
              )}
            </p>

            <p className="mt-1 text-xs font-semibold text-[#D97706]">
              Receber:{" "}
              {formatCurrency(
                summary.overdueReceivable,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}