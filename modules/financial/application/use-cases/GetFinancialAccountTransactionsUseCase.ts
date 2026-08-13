import type {
  FinancialTransaction,
} from "../../types/FinancialTransaction";

import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

export interface GetFinancialAccountTransactionsInput {
  accountId: string;
}

export class GetFinancialAccountTransactionsUseCase {
  constructor(
    private readonly repository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: GetFinancialAccountTransactionsInput,
  ): Promise<FinancialTransaction[]> {
    const accountId =
      input.accountId.trim();

    if (!accountId) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    return this.repository.findAllByAccount(
      accountId,
    );
  }
}