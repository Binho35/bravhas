import type {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

export interface GetFinancialAccountInput {
  id: string;
}

export class GetFinancialAccountUseCase {
  constructor(
    private readonly repository: FinancialAccountRepository,
  ) {}

  async execute(
    input: GetFinancialAccountInput,
  ): Promise<FinancialAccount | null> {
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    return this.repository.findById(
      id,
    );
  }
}