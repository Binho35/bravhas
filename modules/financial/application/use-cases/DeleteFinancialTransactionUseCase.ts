import type {
  FinancialTransactionRepository,
} from "../repositories/FinancialTransactionRepository";

export interface DeleteFinancialTransactionInput {
  id: string;
}

export class DeleteFinancialTransactionUseCase {
  constructor(
    private readonly repository: FinancialTransactionRepository,
  ) {}

  async execute(
    input: DeleteFinancialTransactionInput,
  ): Promise<void> {
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da transação financeira é obrigatório.",
      );
    }

    const transaction =
      await this.repository.findById(
        id,
      );

    if (!transaction) {
      throw new Error(
        "Transação financeira não encontrada.",
      );
    }

    await this.repository.delete(
      id,
    );
  }
}