import type { StoredFinancialAccount } from "../storage/financialStorage";

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

  const now =
    canceledAt ??
    new Date().toISOString();

  const updatedAccount: StoredFinancialAccount = {
    ...account,

    status: "CANCELED",

    updatedBy:
      canceledBy,

    updatedAt:
      now,
  };

  return {
    account:
      updatedAccount,
  };
}