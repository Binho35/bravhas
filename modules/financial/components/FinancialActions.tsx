"use client";

import { useState } from "react";

import type { FinancialAccountView } from "../types/FinancialAccountView";

import {
  getStoredFinancialAccounts,
  updateStoredFinancialAccount,
  type StoredFinancialAccount,
} from "../storage/financialStorage";

import { parseCurrencyInput } from "../utils/currency";

import { registerPayment } from "../services/registerPayment";
import { registerReceipt } from "../services/registerReceipt";
import { cancelFinancialAccount } from "../services/cancelFinancialAccount";
import { reversePayment } from "../services/reversePayment";

interface FinancialActionsProps {
  account: FinancialAccountView;

  total: number;

  remaining: number;

  onAccountUpdated: (
    account: FinancialAccountView,
  ) => void;
}

export function FinancialActions({
  account,
  total,
  remaining,
  onAccountUpdated,
}: FinancialActionsProps) {
  const [settlementValue, setSettlementValue] =
    useState("");

  const [reverseValue, setReverseValue] =
    useState("");

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const isReadOnly =
    account.source === "mock";

  const isClosed =
    account.status === "PAID" ||
    account.status === "CANCELED";

  const hasSettlement =
    account.paidAmount > 0;

  function clearFeedback() {
    setMessage(null);
    setError(null);
  }

  function getStoredAccount():
    | StoredFinancialAccount
    | null {
    return (
      getStoredFinancialAccounts().find(
        (item) =>
          item.id === account.id,
      ) ?? null
    );
  }

  function persist(
    updated: StoredFinancialAccount,
    successMessage: string,
  ) {
    updateStoredFinancialAccount(
      updated,
    );

    onAccountUpdated({
      ...updated,
      source: "stored",
    });

    setMessage(
      successMessage,
    );

    setError(null);
  }

  function handlePartialSettlement() {
    clearFeedback();

    if (isReadOnly) {
      setError(
        "Lançamentos demonstrativos são somente leitura.",
      );
      return;
    }

    if (isClosed) {
      setError(
        "Esta conta não permite uma nova baixa.",
      );
      return;
    }

    const current =
      getStoredAccount();

    if (!current) {
      setError(
        "Conta não encontrada no armazenamento.",
      );
      return;
    }

    const value =
      parseCurrencyInput(
        settlementValue,
      );

    if (value <= 0) {
      setError(
        account.type === "PAYABLE"
          ? "Informe o valor do pagamento."
          : "Informe o valor do recebimento.",
      );
      return;
    }

    try {
      if (account.type === "PAYABLE") {
        const result =
          registerPayment({
            account: current,
            amount: value,
            paidBy: "Robson",
          });

        persist(
          result.account,
          result.fullyPaid
            ? "Pagamento registrado. Conta quitada."
            : "Pagamento parcial registrado.",
        );
      } else {
        const result =
          registerReceipt({
            account: current,
            amount: value,
            receivedBy: "Robson",
          });

        persist(
          result.account,
          result.fullyReceived
            ? "Recebimento registrado. Conta liquidada."
            : "Recebimento parcial registrado.",
        );
      }

      setSettlementValue("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível registrar a baixa.",
      );
    }
  }

  function handleFullSettlement() {
    clearFeedback();

    if (isReadOnly) {
      setError(
        "Lançamentos demonstrativos são somente leitura.",
      );
      return;
    }

    if (isClosed) {
      setError(
        "Esta conta não permite uma nova baixa.",
      );
      return;
    }

    const current =
      getStoredAccount();

    if (!current) {
      setError(
        "Conta não encontrada no armazenamento.",
      );
      return;
    }

    if (remaining <= 0) {
      setError(
        "Esta conta não possui saldo pendente.",
      );
      return;
    }

    try {
      if (account.type === "PAYABLE") {
        const result =
          registerPayment({
            account: current,
            amount: remaining,
            paidBy: "Robson",
          });

        persist(
          result.account,
          "Conta paga integralmente.",
        );
      } else {
        const result =
          registerReceipt({
            account: current,
            amount: remaining,
            receivedBy: "Robson",
          });

        persist(
          result.account,
          "Conta recebida integralmente.",
        );
      }

      setSettlementValue("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível quitar o saldo.",
      );
    }
  }

  function handleCancel() {
    clearFeedback();

    if (isReadOnly) {
      setError(
        "Lançamentos demonstrativos não podem ser cancelados.",
      );
      return;
    }

    const confirmation =
      window.confirm(
        "Deseja realmente cancelar esta conta?",
      );

    if (!confirmation) {
      return;
    }

    const current =
      getStoredAccount();

    if (!current) {
      setError(
        "Conta não encontrada no armazenamento.",
      );
      return;
    }

    try {
      const result =
        cancelFinancialAccount({
          account: current,
          canceledBy: "Robson",
        });

      persist(
        result.account,
        "Conta cancelada com sucesso.",
      );

      setSettlementValue("");
      setReverseValue("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível cancelar a conta.",
      );
    }
  }

  function handleReverse() {
    clearFeedback();

    if (isReadOnly) {
      setError(
        "Lançamentos demonstrativos são somente leitura.",
      );
      return;
    }

    const current =
      getStoredAccount();

    if (!current) {
      setError(
        "Conta não encontrada no armazenamento.",
      );
      return;
    }

    if (!hasSettlement) {
      setError(
        "Esta conta não possui valor liquidado para estorno.",
      );
      return;
    }

    const parsedValue =
      reverseValue.trim()
        ? parseCurrencyInput(
            reverseValue,
          )
        : undefined;

    try {
      const result =
        reversePayment({
          account: current,
          amount: parsedValue,
          reversedBy: "Robson",
        });

      persist(
        result.account,
        parsedValue === undefined
          ? "Baixa estornada integralmente."
          : "Baixa estornada parcialmente.",
      );

      setReverseValue("");
      setSettlementValue("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível realizar o estorno.",
      );
    }
  }

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
          Operação Financeira
        </p>

        <h3 className="mt-1 text-base font-bold text-[#0B2947]">
          {account.type === "PAYABLE"
            ? "Pagamento"
            : "Recebimento"}
        </h3>

        <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">
          Registre uma baixa parcial, quite o saldo ou estorne uma movimentação.
        </p>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
          Valor da baixa
        </label>

        <input
          value={settlementValue}
          onChange={(event) => {
            setSettlementValue(
              event.target.value,
            );

            clearFeedback();
          }}
          disabled={
            isReadOnly ||
            isClosed
          }
          placeholder="0,00"
          inputMode="decimal"
          className="h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none transition disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={
            isReadOnly ||
            isClosed
          }
          onClick={
            handlePartialSettlement
          }
          className="h-10 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#154B7A] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:text-[#CBD5E1]"
        >
          Baixa parcial
        </button>

        <button
          type="button"
          disabled={
            isReadOnly ||
            isClosed ||
            remaining <= 0
          }
          onClick={
            handleFullSettlement
          }
          className="h-10 rounded-xl bg-[#16A34A] text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
        >
          Quitar saldo
        </button>
      </div>

      <div className="mt-5 border-t border-[#E2E8F0] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          Estorno
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#94A3B8]">
          Informe um valor para estorno parcial ou deixe em branco para estornar toda a baixa.
        </p>

        <input
          value={reverseValue}
          onChange={(event) => {
            setReverseValue(
              event.target.value,
            );

            clearFeedback();
          }}
          disabled={
            isReadOnly ||
            !hasSettlement ||
            account.status === "CANCELED"
          }
          placeholder="Valor do estorno (opcional)"
          inputMode="decimal"
          className="mt-3 h-10 w-full rounded-xl border border-[#E2E8F0] px-3 text-sm outline-none transition disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
        />

        <button
          type="button"
          disabled={
            isReadOnly ||
            !hasSettlement ||
            account.status === "CANCELED"
          }
          onClick={handleReverse}
          className="mt-2 h-10 w-full rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-[#E2E8F0] disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1]"
        >
          Estornar baixa
        </button>
      </div>

      <button
        type="button"
        disabled={
          isReadOnly ||
          account.status === "PAID" ||
          account.status === "CANCELED"
        }
        onClick={handleCancel}
        className="mt-3 h-10 w-full rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-[#DC2626] transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-[#E2E8F0] disabled:bg-[#F8FAFC] disabled:text-[#CBD5E1]"
      >
        Cancelar conta
      </button>

      {message && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold leading-5 text-[#16A34A]">
            {message}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold leading-5 text-[#DC2626]">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}