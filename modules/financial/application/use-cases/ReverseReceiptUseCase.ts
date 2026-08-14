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

export interface ReverseReceiptInput {
  accountId: string;

  amount?: number;

  reversedBy: string;

  reversalDate?: Date;
}

export interface ReverseReceiptResult {
  account: FinancialAccount;

  transactionId: string;

  reversedAmount: number;

  remainingReceivedAmount: number;
}

export class ReverseReceiptUseCase {
  constructor(
    private readonly accountRepository: FinancialAccountRepository,

    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: ReverseReceiptInput,
  ): Promise<ReverseReceiptResult> {
    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "A conta financeira é obrigatória.",
      );
    }

    const reversedBy =
      input.reversedBy.trim();

    if (!reversedBy) {
      throw new Error(
        "O responsável pelo estorno é obrigatório.",
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
      account.data.type !==
      "RECEIVABLE"
    ) {
      throw new Error(
        "Este lançamento não é uma conta a receber.",
      );
    }

    if (
      account.data.status ===
      "CANCELED"
    ) {
      throw new Error(
        "Não é possível estornar uma conta cancelada.",
      );
    }

    const currentReceivedAmount =
      roundCurrency(
        account.data.paidAmount,
      );

    if (
      currentReceivedAmount <= 0
    ) {
      throw new Error(
        "Esta conta não possui valor recebido para estorno.",
      );
    }

    const reversedAmount =
      input.amount === undefined
        ? currentReceivedAmount
        : roundCurrency(
            input.amount,
          );

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
      currentReceivedAmount +
        0.001
    ) {
      throw new Error(
        "O valor do estorno é maior que o valor já recebido.",
      );
    }

    const remainingReceivedAmount =
      roundCurrency(
        currentReceivedAmount -
          reversedAmount,
      );

    const reversalDate =
      input.reversalDate ??
      new Date();

    const updatedAccount =
      account.update({
        paidAmount:
          remainingReceivedAmount,

        status:
          remainingReceivedAmount <= 0
            ? "OPEN"
            : "PARTIALLY_PAID",

        paymentDate:
          remainingReceivedAmount <= 0
            ? null
            : account.data.paymentDate,

        updatedAt:
          reversalDate,
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
            "REVERSAL",

          amount:
            reversedAmount,

          performedBy:
            reversedBy,

          performedAt:
            reversalDate.toISOString(),

          notes:
            input.amount === undefined
              ? "Estorno integral do recebimento financeiro."
              : "Estorno parcial do recebimento financeiro.",
        },
      );

    return {
      account:
        savedAccount,

      transactionId:
        transaction.id,

      reversedAmount,

      remainingReceivedAmount,
    };
  }
}