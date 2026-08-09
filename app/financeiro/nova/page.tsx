"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import {
  addStoredFinancialAccount,
  type StoredFinancialAccount,
} from "@/modules/financial/storage/financialStorage";

import type {
  FinancialAccountType,
} from "@/modules/financial/domain/entities/FinancialAccount";

export default function NovaContaFinanceiraPage() {
  const router = useRouter();

  const [description, setDescription] =
    useState("");

  const [type, setType] =
    useState<FinancialAccountType>(
      "PAYABLE",
    );

  const [amount, setAmount] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [documentNumber, setDocumentNumber] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [costCenter, setCostCenter] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  function handleSave() {
    if (!description.trim()) {
      setError(
        "Informe a descrição da conta.",
      );

      return;
    }

    const numericAmount =
      Number(
        amount
          .replace(/\./g, "")
          .replace(",", "."),
      );

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Informe um valor válido.",
      );

      return;
    }

    if (!dueDate) {
      setError(
        "Informe a data de vencimento.",
      );

      return;
    }

    const now =
      new Date().toISOString();

    const account: StoredFinancialAccount =
      {
        id: `FIN-${Date.now()}`,

        companyId: "COMP-001",

        branchId: "BRANCH-001",

        costCenterId:
          costCenter.trim() ||
          null,

        categoryId:
          category.trim() ||
          null,

        supplierId:
          type === "PAYABLE"
            ? "LOCAL-SUPPLIER"
            : null,

        customerId:
          type === "RECEIVABLE"
            ? "LOCAL-CUSTOMER"
            : null,

        bankAccountId:
          "BANK-LOCAL",

        type,

        status: "OPEN",

        description:
          description.trim(),

        documentNumber:
          documentNumber.trim() ||
          null,

        issueDate: now,

        dueDate:
          new Date(
            `${dueDate}T12:00:00`,
          ).toISOString(),

        paymentDate: null,

        amount:
          numericAmount,

        paidAmount: 0,

        discount: 0,

        interest: 0,

        fine: 0,

        notes:
          notes.trim() ||
          null,

        createdBy: "Robson",

        updatedBy: null,

        createdAt: now,

        updatedAt: now,
      };

    addStoredFinancialAccount(
      account,
    );

    router.push(
      "/financeiro",
    );
  }

  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <div className="grid h-full grid-rows-[auto_1fr] gap-4 overflow-hidden p-5">
        {/* CABEÇALHO */}
        <section className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
              Financeiro
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[#0B2947]">
              Nova Conta Financeira
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Cadastre contas a pagar ou receber.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/financeiro",
              )
            }
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
          >
            Voltar
          </button>
        </section>

        {/* CONTEÚDO */}
        <section className="grid min-h-0 grid-cols-[1.3fr_0.7fr] gap-4">
          {/* FORMULÁRIO */}
          <div className="min-h-0 overflow-auto rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {/* DESCRIÇÃO */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Descrição
                </label>

                <input
                  value={
                    description
                  }
                  onChange={(event) => {
                    setDescription(
                      event.target.value,
                    );

                    setError(null);
                  }}
                  placeholder="Ex.: Pagamento fornecedor contábil"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none transition focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />
              </div>

              {/* TIPO */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Tipo
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as FinancialAccountType,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none"
                >
                  <option value="PAYABLE">
                    Conta a pagar
                  </option>

                  <option value="RECEIVABLE">
                    Conta a receber
                  </option>
                </select>
              </div>

              {/* VALOR */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Valor
                </label>

                <input
                  value={amount}
                  onChange={(event) => {
                    setAmount(
                      event.target.value,
                    );

                    setError(null);
                  }}
                  placeholder="0,00"
                  inputMode="decimal"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>

              {/* VENCIMENTO */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Vencimento
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => {
                    setDueDate(
                      event.target.value,
                    );

                    setError(null);
                  }}
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>

              {/* DOCUMENTO */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Documento
                </label>

                <input
                  value={
                    documentNumber
                  }
                  onChange={(event) =>
                    setDocumentNumber(
                      event.target.value,
                    )
                  }
                  placeholder="NF, boleto, guia..."
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>

              {/* CATEGORIA */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Categoria
                </label>

                <input
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Tributos"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>

              {/* CENTRO DE CUSTO */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Centro de custo
                </label>

                <input
                  value={costCenter}
                  onChange={(event) =>
                    setCostCenter(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Administrativo"
                  className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>

              {/* OBSERVAÇÕES */}
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Observações
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  placeholder="Informações adicionais, conferência necessária, autorização..."
                  className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-sm outline-none focus:border-[#154B7A]"
                />
              </div>
            </div>
          </div>

          {/* PAINEL LATERAL */}
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
            <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Harpia
              </p>

              <h3 className="mt-2 text-lg font-bold">
                Assistente Financeira
              </h3>

              <p className="mt-4 text-sm leading-6 text-white/70">
                O lançamento será incluído no controle financeiro e poderá alimentar vencimentos, projeção de caixa e alertas.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#0B2947]">
                Conferência
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  "Tipo do lançamento está correto?",
                  "Valor foi conferido?",
                  "Vencimento está correto?",
                  "Existe documento fiscal ou comprovante?",
                  "Categoria e centro de custo estão definidos?",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#154B7A]" />

                    <p className="text-xs leading-5 text-[#64748B]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-[#DC2626]">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/financeiro",
                  )
                }
                className="h-10 flex-1 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-[#475569] transition hover:bg-[#F8FAFC]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="h-10 flex-1 rounded-xl bg-[#154B7A] text-sm font-semibold text-white transition hover:bg-[#103D65]"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}