import type {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

export interface UpdateFinancialAccountInput {
  account: FinancialAccount;
}

export class UpdateFinancialAccountUseCase {
  constructor(
    private readonly repository: FinancialAccountRepository,
  ) {}

  async execute(
    input: UpdateFinancialAccountInput,
  ): Promise<FinancialAccount> {
    if (!input.account) {
      throw new Error(
        "A conta financeira é obrigatória.",
      );
    }

    const account =
      input.account;

    if (!account.data.id.trim()) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    if (
      !account.data.description.trim()
    ) {
      throw new Error(
        "A descrição da conta financeira é obrigatória.",
      );
    }

    if (
      !Number.isFinite(
        account.data.amount,
      ) ||
      account.data.amount <= 0
    ) {
      throw new Error(
        "O valor da conta financeira deve ser maior que zero.",
      );
    }

    if (
      account.data.dueDate.getTime() <
      account.data.issueDate.getTime()
    ) {
      throw new Error(
        "A data de vencimento não pode ser anterior à data de emissão.",
      );
    }

    const existing =
      await this.repository.findById(
        account.data.id,
      );

    if (!existing) {
      throw new Error(
        "Conta financeira não encontrada.",
      );
    }

    return this.repository.update(
      account,
    );
  }
}