import type {
  FinancialTransaction,
} from "../../types/FinancialTransaction";

import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

export interface GetFinancialTransactionInput {
  id: string;
}

export class GetFinancialTransactionUseCase {
  constructor(
    private readonly repository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: GetFinancialTransactionInput,
  ): Promise<FinancialTransaction | null> {
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da transação financeira é obrigatório.",
      );
    }

    return this.repository.findById(
      id,
    );
  }
}