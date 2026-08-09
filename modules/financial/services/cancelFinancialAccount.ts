import type { StoredFinancialAccount } from "../storage/financialStorage";

import { createFinancialTransaction } from "./createFinancialTransaction";

export interface CancelFinancialAccountInput {
  account: StoredFinancialAccount;

  canceledBy: string;

  canceledAt?: string;
}

export interface CancelFinancialAccountResult {
  account: StoredFinancialAccount;
}

export function cancelFinancialAccount({
  account,
  canceledBy,
  canceledAt,
}: CancelFinancialAccountInput): CancelFinancialAccountResult {
  if (account.status === "PAID") {
    throw new Error(
      "Uma conta quitada não pode ser cancelada diretamente.",
    );
  }

  if (account.status === "CANCELED") {
    throw new Error(
      "Esta conta já está cancelada.",
    );
  }

  if (!canceledBy.trim()) {
    throw new Error(
      "O responsável pelo cancelamento é obrigatório.",
    );
  }

  const now =
    new Date().toISOString();

  const effectiveCancellationDate =
    canceledAt ?? now;

  const updatedAccount: StoredFinancialAccount = {
    ...account,

    status: "CANCELED",

    updatedBy:
      canceledBy.trim(),

    updatedAt:
      now,
  };

  createFinancialTransaction({
    accountId:
      account.id,

    type:
      "CANCELLATION",

    amount: 0,

    performedBy:
      canceledBy.trim(),

    performedAt:
      effectiveCancellationDate,

    notes:
      "Conta cancelada.",
  });

  return {
    account:
      updatedAccount,
  };
}