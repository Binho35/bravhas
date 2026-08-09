import type { StoredFinancialAccount } from "../storage/financialStorage";
import { roundCurrency } from "../utils/currency";

export interface RegisterPaymentInput {
  account: StoredFinancialAccount;

  amount: number;

  paidBy: string;

  paymentDate?: string;
}

export interface RegisterPaymentResult {
  account: StoredFinancialAccount;

  fullyPaid: boolean;

  remaining: number;
}

export function registerPayment({
  account,
  amount,
  paidBy,
  paymentDate,
}: RegisterPaymentInput): RegisterPaymentResult {
  if (account.type !== "PAYABLE") {
    throw new Error(
      "Este lançamento não é uma conta a pagar.",
    );
  }

  if (
    account.status === "PAID" ||
    account.status === "CANCELED"
  ) {
    throw new Error(
      "Esta conta não permite um novo pagamento.",
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "O valor do pagamento deve ser maior que zero.",
    );
  }

  const total = roundCurrency(
    account.amount -
      account.discount +
      account.interest +
      account.fine,
  );

  const currentPaid = roundCurrency(
    account.paidAmount,
  );

  const remainingBeforePayment =
    roundCurrency(
      total - currentPaid,
    );

  if (remainingBeforePayment <= 0) {
    throw new Error(
      "Esta conta não possui saldo pendente.",
    );
  }

  if (
    amount >
    remainingBeforePayment + 0.001
  ) {
    throw new Error(
      "O valor do pagamento é maior que o saldo restante.",
    );
  }

  const nextPaidAmount =
    roundCurrency(
      currentPaid + amount,
    );

  const fullyPaid =
    nextPaidAmount >=
    total - 0.001;

  const remaining = fullyPaid
    ? 0
    : roundCurrency(
        total - nextPaidAmount,
      );

  const now =
    new Date().toISOString();

  const updatedAccount: StoredFinancialAccount = {
    ...account,

    paidAmount: fullyPaid
      ? total
      : nextPaidAmount,

    status: fullyPaid
      ? "PAID"
      : "PARTIALLY_PAID",

    paymentDate:
      paymentDate ?? now,

    updatedBy: paidBy,

    updatedAt: now,
  };

  return {
    account:
      updatedAccount,

    fullyPaid,

    remaining,
  };
}