import type {
  FinancialTransaction,
  FinancialTransactionType,
} from "../types/FinancialTransaction";

import {
  addFinancialTransaction,
} from "../storage/financialTransactionStorage";

export interface CreateFinancialTransactionInput {
  accountId: string;

  type: FinancialTransactionType;

  amount: number;

  performedBy: string;

  performedAt?: string;

  notes?: string | null;
}

export function createFinancialTransaction({
  accountId,
  type,
  amount,
  performedBy,
  performedAt,
  notes,
}: CreateFinancialTransactionInput): FinancialTransaction {
  if (!accountId.trim()) {
    throw new Error(
      "A conta financeira da movimentação é obrigatória.",
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error(
      "O valor da movimentação é inválido.",
    );
  }

  if (!performedBy.trim()) {
    throw new Error(
      "O responsável pela movimentação é obrigatório.",
    );
  }

  const transaction: FinancialTransaction = {
    id: `FTR-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

    accountId,

    type,

    amount,

    performedBy:
      performedBy.trim(),

    performedAt:
      performedAt ??
      new Date().toISOString(),

    notes:
      notes?.trim() ||
      null,
  };

  addFinancialTransaction(
    transaction,
  );

  return transaction;
}