import type { FinancialAccountView } from "../types/FinancialAccountView";
import { formatCurrency } from "../utils/currency";

interface FinancialSummaryProps {
  account: FinancialAccountView;

  total: number;

  remaining: number;
}

export function FinancialSummary({
  account,
  total,
  remaining,
}: FinancialSummaryProps) {
  const statusLabel =
    account.status === "PAID"
      ? "Pago"
      : account.status === "PARTIALLY_PAID"
        ? "Parcial"
        : account.status === "CANCELED"
          ? "Cancelado"
          : account.status === "OVERDUE"
            ? "Vencido"
            : "Em aberto";

  const statusClass =
    account.status === "PAID"
      ? "bg-green-50 text-green-700"
      : account.status === "PARTIALLY_PAID"
        ? "bg-amber-50 text-amber-700"
        : account.status === "CANCELED"
          ? "bg-slate-100 text-slate-500"
          : account.status === "OVERDUE"
            ? "bg-red-50 text-red-700"
            : "bg-blue-50 text-blue-700";

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
            Resumo Financeiro
          </p>

          <h3 className="mt-1 text-base font-bold text-[#0B2947]">
            Posição da conta
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">
            Valor original
          </p>

          <p className="mt-1 text-lg font-bold text-[#0B2947]">
            {formatCurrency(account.amount)}
          </p>
        </div>

        <div className="rounded-xl bg-[#F8FAFC] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">
            Total ajustado
          </p>

          <p className="mt-1 text-lg font-bold text-[#154B7A]">
            {formatCurrency(total)}
          </p>
        </div>

        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-green-700/70">
            Liquidado
          </p>

          <p className="mt-1 text-lg font-bold text-[#16A34A]">
            {formatCurrency(account.paidAmount)}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            remaining > 0
              ? "bg-red-50"
              : "bg-green-50"
          }`}
        >
          <p
            className={`text-[10px] font-medium uppercase tracking-[0.1em] ${
              remaining > 0
                ? "text-red-700/70"
                : "text-green-700/70"
            }`}
          >
            Saldo restante
          </p>

          <p
            className={`mt-1 text-lg font-bold ${
              remaining > 0
                ? "text-[#DC2626]"
                : "text-[#16A34A]"
            }`}
          >
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E2E8F0] pt-4">
        <div>
          <p className="text-[10px] text-[#94A3B8]">
            Descontos
          </p>

          <p className="mt-1 text-sm font-semibold text-[#475569]">
            {formatCurrency(account.discount)}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-[#94A3B8]">
            Juros
          </p>

          <p className="mt-1 text-sm font-semibold text-[#475569]">
            {formatCurrency(account.interest)}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-[#94A3B8]">
            Multa
          </p>

          <p className="mt-1 text-sm font-semibold text-[#475569]">
            {formatCurrency(account.fine)}
          </p>
        </div>
      </div>
    </div>
  );
}