import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

export interface DeleteFinancialAccountInput {
  id: string;
}

export class DeleteFinancialAccountUseCase {
  constructor(
    private readonly repository: FinancialAccountRepository,
  ) {}

  async execute(
    input: DeleteFinancialAccountInput,
  ): Promise<void> {
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    const account =
      await this.repository.findById(
        id,
      );

    if (!account) {
      throw new Error(
        "Conta financeira não encontrada.",
      );
    }

    if (
      account.data.status ===
      "PAID"
    ) {
      throw new Error(
        "Uma conta quitada não pode ser excluída.",
      );
    }

    if (
      account.data.status ===
      "CANCELED"
    ) {
      throw new Error(
        "Uma conta cancelada não pode ser excluída.",
      );
    }

    if (
      account.data.paidAmount > 0
    ) {
      throw new Error(
        "Uma conta com pagamentos registrados não pode ser excluída.",
      );
    }

    await this.repository.delete(
      id,
    );
  }
}