import type {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

import {
  roundCurrency,
} from "../../utils/currency";

export interface RegisterReceiptInput {
  accountId: string;

  amount: number;

  receivedBy: string;

  receiptDate?: Date;
}

export interface RegisterReceiptResult {
  account: FinancialAccount;

  transactionId: string;

  fullyReceived: boolean;

  remaining: number;
}

export class RegisterReceiptUseCase {
  constructor(
    private readonly accountRepository: FinancialAccountRepository,

    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: RegisterReceiptInput,
  ): Promise<RegisterReceiptResult> {
    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "A conta financeira é obrigatória.",
      );
    }

    const receivedBy =
      input.receivedBy.trim();

    if (!receivedBy) {
      throw new Error(
        "O responsável pelo recebimento é obrigatório.",
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        "O valor do recebimento deve ser maior que zero.",
      );
    }

    const account =
      await this.accountRepository.findById(
        accountId,
      );

    if (!account) {
      throw new Error(
        "Conta financeira não encontrada.",
      );
    }

    if (
      account.data.type !== "RECEIVABLE"
    ) {
      throw new Error(
        "Este lançamento não é uma conta a receber.",
      );
    }

    if (
      account.data.status === "PAID" ||
      account.data.status === "CANCELED"
    ) {
      throw new Error(
        "Esta conta não permite um novo recebimento.",
      );
    }

    const total =
      roundCurrency(
        account.data.amount -
          account.data.discount +
          account.data.interest +
          account.data.fine,
      );

    const currentReceived =
      roundCurrency(
        account.data.paidAmount,
      );

    const remainingBeforeReceipt =
      roundCurrency(
        total -
          currentReceived,
      );

    if (
      remainingBeforeReceipt <= 0
    ) {
      throw new Error(
        "Esta conta não possui saldo pendente.",
      );
    }

    const normalizedAmount =
      roundCurrency(
        input.amount,
      );

    if (
      normalizedAmount >
      remainingBeforeReceipt +
        0.001
    ) {
      throw new Error(
        "O valor do recebimento é maior que o saldo restante.",
      );
    }

    const nextReceivedAmount =
      roundCurrency(
        currentReceived +
          normalizedAmount,
      );

    const fullyReceived =
      nextReceivedAmount >=
      total - 0.001;

    const receiptDate =
      input.receiptDate ??
      new Date();

    const updatedAccount =
      account.update({
        paidAmount:
          fullyReceived
            ? total
            : nextReceivedAmount,

        paymentDate:
          receiptDate,

        status:
          fullyReceived
            ? "PAID"
            : "PARTIALLY_PAID",

        updatedAt:
          receiptDate,
      });

    const savedAccount =
      await this.accountRepository.update(
        updatedAccount,
      );

    const transaction =
      await this.transactionRepository.create(
        {
          id:
            crypto.randomUUID(),

          accountId:
            accountId,

          type:
            "RECEIPT",

          amount:
            normalizedAmount,

          performedBy:
            receivedBy,

          performedAt:
            receiptDate.toISOString(),

          notes:
            fullyReceived
              ? "Recebimento integral registrado."
              : "Recebimento parcial registrado.",
        },
      );

    const remaining =
      fullyReceived
        ? 0
        : roundCurrency(
            total -
              nextReceivedAmount,
          );

    return {
      account:
        savedAccount,

      transactionId:
        transaction.id,

      fullyReceived,

      remaining,
    };
  }
}