import type {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
  FindFinancialAccountsFilters,
} from "../repositories/FinancialAccountRepository";

export interface ListFinancialAccountsInput
  extends FindFinancialAccountsFilters {}

export interface ListFinancialAccountsResult {
  accounts: FinancialAccount[];

  total: number;
}

export class ListFinancialAccountsUseCase {
  constructor(
    private readonly repository: FinancialAccountRepository,
  ) {}

  async execute(
    input: ListFinancialAccountsInput,
  ): Promise<ListFinancialAccountsResult> {
    const companyId =
      input.companyId.trim();

    if (!companyId) {
      throw new Error(
        "A empresa é obrigatória.",
      );
    }

    const accounts =
      await this.repository.findAll({
        companyId,

        branchId:
          input.branchId?.trim() ||
          undefined,

        type:
          input.type,

        status:
          input.status,

        supplierId:
          input.supplierId?.trim() ||
          undefined,

        customerId:
          input.customerId?.trim() ||
          undefined,

        categoryId:
          input.categoryId?.trim() ||
          undefined,

        costCenterId:
          input.costCenterId?.trim() ||
          undefined,

        bankAccountId:
          input.bankAccountId?.trim() ||
          undefined,

        dueDateFrom:
          input.dueDateFrom,

        dueDateTo:
          input.dueDateTo,
      });

    return {
      accounts,

      total:
        accounts.length,
    };
  }
}