import type { StoredFinancialAccount } from "../storage/financialStorage";
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

  const nextStatus =
    remainingPaidAmount <= 0
      ? "OPEN"
      : "PARTIALLY_PAID";

  const now =
    reversedAt ??
    new Date().toISOString();

  const updatedAccount: StoredFinancialAccount = {
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
      reversedBy,

    updatedAt:
      now,
  };

  return {
    account:
      updatedAccount,

    reversedAmount,

    remainingPaidAmount,
  };
}