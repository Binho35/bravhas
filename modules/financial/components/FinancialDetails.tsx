import type { FinancialAccountView } from "../types/FinancialAccountView";
import { formatDate } from "../utils/date";

interface FinancialDetailsProps {
  account: FinancialAccountView;
}

export function FinancialDetails({
  account,
}: FinancialDetailsProps) {
  return (
    <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
          Dados da Conta
        </p>

        <h3 className="mt-1 text-base font-bold text-[#0B2947]">
          Informações financeiras
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Descrição
          </label>

          <input
            value={account.description}
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Documento
          </label>

          <input
            value={
              account.documentNumber ?? ""
            }
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Tipo
          </label>

          <input
            value={
              account.type === "PAYABLE"
                ? "Conta a pagar"
                : "Conta a receber"
            }
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Emissão
          </label>

          <input
            value={formatDate(
              account.issueDate,
            )}
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Vencimento
          </label>

          <input
            value={formatDate(
              account.dueDate,
            )}
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Categoria
          </label>

          <input
            value={
              account.categoryId ?? ""
            }
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Centro de Custo
          </label>

          <input
            value={
              account.costCenterId ?? ""
            }
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Banco / Conta
          </label>

          <input
            value={
              account.bankAccountId ??
              ""
            }
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Criado por
          </label>

          <input
            value={account.createdBy}
            disabled
            className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm text-[#475569]"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-[#475569]">
            Observações
          </label>

          <textarea
            rows={4}
            value={account.notes ?? ""}
            disabled
            className="w-full resize-none rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#475569]"
          />
        </div>
      </div>
    </div>
  );
}