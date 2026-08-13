import type {
  FinancialAccount,
  FinancialAccountStatus,
  FinancialAccountType,
} from "../../domain/entities/FinancialAccount";

export interface FindFinancialAccountsFilters {
  companyId: string;

  branchId?: string;

  type?: FinancialAccountType;

  status?: FinancialAccountStatus;

  supplierId?: string;

  customerId?: string;

  categoryId?: string;

  costCenterId?: string;

  bankAccountId?: string;

  dueDateFrom?: Date;

  dueDateTo?: Date;
}

export interface FinancialAccountRepository {
  create(
    account: FinancialAccount,
  ): Promise<FinancialAccount>;

  findById(
    id: string,
  ): Promise<FinancialAccount | null>;

  findAll(
    filters: FindFinancialAccountsFilters,
  ): Promise<FinancialAccount[]>;

  update(
    account: FinancialAccount,
  ): Promise<FinancialAccount>;

  delete(
    id: string,
  ): Promise<void>;
}