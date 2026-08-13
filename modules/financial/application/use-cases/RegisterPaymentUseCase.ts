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

export interface RegisterPaymentInput {
  accountId: string;

  amount: number;

  paidBy: string;

  paymentDate?: Date;
}

export interface RegisterPaymentResult {
  account: FinancialAccount;

  transactionId: string;

  fullyPaid: boolean;

  remaining: number;
}

export class RegisterPaymentUseCase {
  constructor(
    private readonly accountRepository: FinancialAccountRepository =
      new PrismaFinancialAccountRepository(),

    private readonly transactionRepository: FinancialTransactionRepository =
      new PrismaFinancialTransactionRepository(),
  ) {}

  async execute(
    input: RegisterPaymentInput,
  ): Promise<RegisterPaymentResult> {
    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "A conta financeira é obrigatória.",
      );
    }

    const paidBy =
      input.paidBy.trim();

    if (!paidBy) {
      throw new Error(
        "O responsável pelo pagamento é obrigatório.",
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        "O valor do pagamento deve ser maior que zero.",
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
      account.data.type !== "PAYABLE"
    ) {
      throw new Error(
        "Este lançamento não é uma conta a pagar.",
      );
    }

    if (
      account.data.status === "PAID" ||
      account.data.status === "CANCELED"
    ) {
      throw new Error(
        "Esta conta não permite um novo pagamento.",
      );
    }

    const total =
      roundCurrency(
        account.data.amount -
          account.data.discount +
          account.data.interest +
          account.data.fine,
      );

    const currentPaid =
      roundCurrency(
        account.data.paidAmount,
      );

    const remainingBeforePayment =
      roundCurrency(
        total -
          currentPaid,
      );

    if (
      remainingBeforePayment <= 0
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
      remainingBeforePayment +
        0.001
    ) {
      throw new Error(
        "O valor do pagamento é maior que o saldo restante.",
      );
    }

    const nextPaidAmount =
      roundCurrency(
        currentPaid +
          normalizedAmount,
      );

    const fullyPaid =
      nextPaidAmount >=
      total - 0.001;

    const paymentDate =
      input.paymentDate ??
      new Date();

    const updatedAccount =
      account.registerPayment(
        normalizedAmount,
        paymentDate,
      );

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
            "PAYMENT",

          amount:
            normalizedAmount,

          performedBy:
            paidBy,

          performedAt:
            paymentDate.toISOString(),

          notes:
            fullyPaid
              ? "Pagamento integral registrado."
              : "Pagamento parcial registrado.",
        },
      );

    const remaining =
      fullyPaid
        ? 0
        : roundCurrency(
            total -
              nextPaidAmount,
          );

    return {
      account:
        savedAccount,

      transactionId:
        transaction.id,

      fullyPaid,

      remaining,
    };
  }
}