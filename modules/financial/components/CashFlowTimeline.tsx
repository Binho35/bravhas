import type {
  CashFlowBucket,
} from "../services/calculateCashFlow";

import {
  formatCurrency,
} from "../utils/currency";

interface CashFlowTimelineProps {
  buckets: CashFlowBucket[];

  limit?: number;
}

function formatDay(
  value: string,
): string {
  const date =
    new Date(
      `${value}T12:00:00`,
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
    },
  )
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

export function CashFlowTimeline({
  buckets,
  limit = 14,
}: CashFlowTimelineProps) {
  const visibleBuckets =
    buckets.slice(
      0,
      limit,
    );

  return (
    <div className="min-h-0 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
            Projeção diária
          </p>

          <h3 className="mt-1 text-base font-bold text-[#0B2947]">
            Linha do fluxo de caixa
          </h3>
        </div>

        <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-[10px] font-semibold text-[#64748B]">
          {visibleBuckets.length} dias
        </span>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="divide-y divide-[#E2E8F0]">
          {visibleBuckets.map(
            (bucket) => {
              const positive =
                bucket.net >= 0;

              const projectedPositive =
                bucket.projectedBalance >=
                0;

              return (
                <div
                  key={
                    bucket.date
                  }
                  className="grid grid-cols-[72px_1fr_1fr_1fr] items-center gap-3 px-5 py-3 transition hover:bg-[#F8FAFC]"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0B2947]">
                      {formatDay(
                        bucket.date,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#94A3B8]">
                      Entradas
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#16A34A]">
                      {formatCurrency(
                        bucket.inflow,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#94A3B8]">
                      Saídas
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#DC2626]">
                      {formatCurrency(
                        bucket.outflow,
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#94A3B8]">
                      Saldo projetado
                    </p>

                    <p
                      className={`mt-1 text-xs font-bold ${
                        projectedPositive
                          ? "text-[#154B7A]"
                          : "text-[#DC2626]"
                      }`}
                    >
                      {formatCurrency(
                        bucket.projectedBalance,
                      )}
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        positive
                          ? "bg-green-50 text-[#16A34A]"
                          : "bg-red-50 text-[#DC2626]"
                      }`}
                    >
                      {positive
                        ? "Dia positivo"
                        : "Dia negativo"}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}