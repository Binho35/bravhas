import type {
  FinancialTransaction,
} from "../../types/FinancialTransaction";

import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

export interface CreateFinancialTransactionInput {
  id: string;

  accountId: string;

  type:
    | "PAYMENT"
    | "RECEIPT"
    | "REVERSAL"
    | "CANCELLATION";

  amount: number;

  performedBy: string;

  performedAt?: string;

  notes?: string | null;
}

export class CreateFinancialTransactionUseCase {
  constructor(
    private readonly repository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: CreateFinancialTransactionInput,
  ): Promise<FinancialTransaction> {
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da transação financeira é obrigatório.",
      );
    }

    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "A conta financeira da transação é obrigatória.",
      );
    }

    const performedBy =
      input.performedBy.trim();

    if (!performedBy) {
      throw new Error(
        "O responsável pela transação é obrigatório.",
      );
    }

    if (
      !Number.isFinite(
        input.amount,
      ) ||
      input.amount < 0
    ) {
      throw new Error(
        "O valor da transação financeira é inválido.",
      );
    }

    const transaction: FinancialTransaction =
      {
        id,

        accountId,

        type:
          input.type,

        amount:
          input.amount,

        performedBy,

        performedAt:
          input.performedAt ??
          new Date().toISOString(),

        notes:
          input.notes?.trim() ||
          null,
      };

    return this.repository.create(
      transaction,
    );
  }
}