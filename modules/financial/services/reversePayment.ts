import type { StoredFinancialAccount } from "../storage/financialStorage";

import { createFinancialTransaction } from "./createFinancialTransaction";

import { roundCurrency } from "../utils/currency";

export interface ReversePaymentInput {
  account: StoredFinancialAccount;

  amount?: number;

  reversedBy: string;

  reversedAt?: string;
}

export interface ReversePaymentResult {
  account: StoredFinancialAccount;

  reversedAmount: number;

  remainingPaidAmount: number;
}

export function reversePayment({
  account,
  amount,
  reversedBy,
  reversedAt,
}: ReversePaymentInput): ReversePaymentResult {
  if (account.status === "CANCELED") {
    throw new Error(
      "Não é possível estornar uma conta cancelada.",
    );
  }

  if (!reversedBy.trim()) {
    throw new Error(
      "O responsável pelo estorno é obrigatório.",
    );
  }

  if (
    !Number.isFinite(
      account.paidAmount,
    ) ||
    account.paidAmount <= 0
  ) {
    throw new Error(
      "Esta conta não possui valor liquidado para estorno.",
    );
  }

  const currentPaidAmount =
    roundCurrency(
      account.paidAmount,
    );

  const reversedAmount =
    amount === undefined
      ? currentPaidAmount
      : roundCurrency(amount);

  if (
    !Number.isFinite(
      reversedAmount,
    ) ||
    reversedAmount <= 0
  ) {
    throw new Error(
      "O valor do estorno deve ser maior que zero.",
    );
  }

  if (
    reversedAmount >
    currentPaidAmount + 0.001
  ) {
    throw new Error(
      "O valor do estorno é maior que o valor já liquidado.",
    );
  }

  const remainingPaidAmount =
    roundCurrency(
      currentPaidAmount -
        reversedAmount,
    );

  const dueDate =
    new Date(
      account.dueDate,
    );

  const isOverdue =
    dueDate.getTime() <
      Date.now();

  const nextStatus =
    remainingPaidAmount <= 0
      ? isOverdue
        ? "OVERDUE"
        : "OPEN"
      : "PARTIALLY_PAID";

  const now =
    new Date().toISOString();

  const effectiveReversalDate =
    reversedAt ?? now;

  const updatedAccount: StoredFinancialAccount =
    {
      ...account,

      paidAmount:
        remainingPaidAmount,

      status:
        nextStatus,

      paymentDate:
        remainingPaidAmount <= 0
          ? null
          : account.paymentDate,

      updatedBy:
        reversedBy.trim(),

      updatedAt:
        now,
    };

  createFinancialTransaction({
    accountId:
      account.id,

    type:
      "REVERSAL",

    amount:
      reversedAmount,

    performedBy:
      reversedBy.trim(),

    performedAt:
      effectiveReversalDate,

    notes:
      amount === undefined
        ? "Estorno integral da baixa financeira."
        : "Estorno parcial da baixa financeira.",
  });

  return {
    account:
      updatedAccount,

    reversedAmount,

    remainingPaidAmount,
  };
}