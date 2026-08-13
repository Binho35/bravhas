import type {
  FinancialTransaction,
} from "../../types/FinancialTransaction";

import type {
  FinancialTransactionRepository,
  FindFinancialTransactionsFilters,
} from "../repositories/FinancialTransactionRepository";

export class ListFinancialTransactionsUseCase {
  constructor(
    private readonly repository: FinancialTransactionRepository,
  ) {}

  async execute(
    filters: FindFinancialTransactionsFilters = {},
  ): Promise<FinancialTransaction[]> {
    if (
      filters.accountId !== undefined &&
      !filters.accountId.trim()
    ) {
      throw new Error(
        "O identificador da conta financeira é inválido.",
      );
    }

    if (
      filters.performedBy !== undefined &&
      !filters.performedBy.trim()
    ) {
      throw new Error(
        "O responsável pela transação é inválido.",
      );
    }

    if (
      filters.performedAtFrom &&
      filters.performedAtTo &&
      filters.performedAtFrom.getTime() >
        filters.performedAtTo.getTime()
    ) {
      throw new Error(
        "A data inicial não pode ser posterior à data final.",
      );
    }

    return this.repository.findAll(
      filters,
    );
  }
}