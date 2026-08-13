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
  PrismaFinancialAccountRepository,
} from "../../infrastructure/repositories/PrismaFinancialAccountRepository";

import {
  PrismaFinancialTransactionRepository,
} from "../../infrastructure/repositories/PrismaFinancialTransactionRepository";

import {
  roundCurrency,
} from "../../utils/currency";

export interface ReversePaymentInput {
  accountId: string;

  amount?: number;

  reversedBy: string;

  reversalDate?: Date;
}

export interface ReversePaymentResult {
  account: FinancialAccount;

  transactionId: string;

  reversedAmount: number;

  remainingPaidAmount: number;
}

export class ReversePaymentUseCase {
  constructor(
    private readonly accountRepository: FinancialAccountRepository =
      new PrismaFinancialAccountRepository(),

    private readonly transactionRepository: FinancialTransactionRepository =
      new PrismaFinancialTransactionRepository(),
  ) {}

  async execute(
    input: ReversePaymentInput,
  ): Promise<ReversePaymentResult> {
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
      account.data.status ===
      "CANCELED"
    ) {
      throw new Error(
        "Não é possível estornar uma conta cancelada.",
      );
    }

    const currentPaidAmount =
      roundCurrency(
        account.data.paidAmount,
      );

    if (
      currentPaidAmount <= 0
    ) {
      throw new Error(
        "Esta conta não possui valor liquidado para estorno.",
      );
    }

    const reversedAmount =
      input.amount === undefined
        ? currentPaidAmount
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
      currentPaidAmount +
        0.001
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

    const reversalDate =
      input.reversalDate ??
      new Date();

    const updatedAccount =
      account.update({
        paidAmount:
          remainingPaidAmount,

        status:
          remainingPaidAmount <= 0
            ? "OPEN"
            : "PARTIALLY_PAID",

        paymentDate:
          remainingPaidAmount <= 0
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
              ? "Estorno integral da baixa financeira."
              : "Estorno parcial da baixa financeira.",
        },
      );

    return {
      account:
        savedAccount,

      transactionId:
        transaction.id,

      reversedAmount,

      remainingPaidAmount,
    };
  }
}