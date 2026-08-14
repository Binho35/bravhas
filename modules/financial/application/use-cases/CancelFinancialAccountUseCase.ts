import type {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

export interface CancelFinancialAccountInput {
  accountId: string;

  canceledBy: string;

  cancellationDate?: Date;
}

export interface CancelFinancialAccountResult {
  account: FinancialAccount;

  transactionId: string;

  canceledAt: Date;
}

export class CancelFinancialAccountUseCase {
  constructor(
    private readonly accountRepository: FinancialAccountRepository,

    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: CancelFinancialAccountInput,
  ): Promise<CancelFinancialAccountResult> {
    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "A conta financeira é obrigatória.",
      );
    }

    const canceledBy =
      input.canceledBy.trim();

    if (!canceledBy) {
      throw new Error(
        "O responsável pelo cancelamento é obrigatório.",
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
        "Esta conta já está cancelada.",
      );
    }

    if (
      account.data.status ===
      "PAID"
    ) {
      throw new Error(
        "Uma conta já liquidada não pode ser cancelada.",
      );
    }

    const canceledAt =
      input.cancellationDate ??
      new Date();

    const updatedAccount =
      account.cancel();

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
            "CANCELLATION",

          amount:
            0,

          performedBy:
            canceledBy,

          performedAt:
            canceledAt.toISOString(),

          notes:
            "Conta cancelada.",
        },
      );

    return {
      account:
        savedAccount,

      transactionId:
        transaction.id,

      canceledAt,
    };
  }
}