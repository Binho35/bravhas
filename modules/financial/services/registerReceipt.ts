import type { StoredFinancialAccount } from "../storage/financialStorage";

import { createFinancialTransaction } from "./createFinancialTransaction";

import { roundCurrency } from "../utils/currency";

export interface RegisterReceiptInput {
  account: StoredFinancialAccount;

  amount: number;

  receivedBy: string;

  receiptDate?: string;
}

export interface RegisterReceiptResult {
  account: StoredFinancialAccount;

  fullyReceived: boolean;

  remaining: number;
}

export function registerReceipt({
  account,
  amount,
  receivedBy,
  receiptDate,
}: RegisterReceiptInput): RegisterReceiptResult {
  if (account.type !== "RECEIVABLE") {
    throw new Error(
      "Este lançamento não é uma conta a receber.",
    );
  }

  if (
    account.status === "PAID" ||
    account.status === "CANCELED"
  ) {
    throw new Error(
      "Esta conta não permite um novo recebimento.",
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "O valor do recebimento deve ser maior que zero.",
    );
  }

  if (!receivedBy.trim()) {
    throw new Error(
      "O responsável pelo recebimento é obrigatório.",
    );
  }

  const total =
    roundCurrency(
      account.amount -
        account.discount +
        account.interest +
        account.fine,
    );

  const currentReceived =
    roundCurrency(
      account.paidAmount,
    );

  const remainingBeforeReceipt =
    roundCurrency(
      total -
        currentReceived,
    );

  if (remainingBeforeReceipt <= 0) {
    throw new Error(
      "Esta conta não possui saldo pendente.",
    );
  }

  if (
    amount >
    remainingBeforeReceipt + 0.001
  ) {
    throw new Error(
      "O valor do recebimento é maior que o saldo restante.",
    );
  }

  const normalizedAmount =
    roundCurrency(amount);

  const nextReceivedAmount =
    roundCurrency(
      currentReceived +
        normalizedAmount,
    );

  const fullyReceived =
    nextReceivedAmount >=
    total - 0.001;

  const remaining =
    fullyReceived
      ? 0
      : roundCurrency(
          total -
            nextReceivedAmount,
        );

  const now =
    new Date().toISOString();

  const effectiveReceiptDate =
    receiptDate ?? now;

  const updatedAccount: StoredFinancialAccount =
    {
      ...account,

      paidAmount:
        fullyReceived
          ? total
          : nextReceivedAmount,

      status:
        fullyReceived
          ? "PAID"
          : "PARTIALLY_PAID",

      paymentDate:
        effectiveReceiptDate,

      updatedBy:
        receivedBy.trim(),

      updatedAt:
        now,
    };

  createFinancialTransaction({
    accountId:
      account.id,

    type:
      "RECEIPT",

    amount:
      normalizedAmount,

    performedBy:
      receivedBy.trim(),

    performedAt:
      effectiveReceiptDate,

    notes:
      fullyReceived
        ? "Recebimento integral registrado."
        : "Recebimento parcial registrado.",
  });

  return {
    account:
      updatedAccount,

    fullyReceived,

    remaining,
  };
}