import type {
  FinancialTransaction,
  FinancialTransactionType,
} from "../../types/FinancialTransaction";

export interface FindFinancialTransactionsFilters {
  accountId?: string;

  performedBy?: string;

  type?: FinancialTransactionType;

  performedAtFrom?: Date;

  performedAtTo?: Date;
}

export interface FinancialTransactionRepository {
  create(
    transaction: FinancialTransaction,
  ): Promise<FinancialTransaction>;

  findById(
    id: string,
  ): Promise<FinancialTransaction | null>;

  findAll(
    filters?: FindFinancialTransactionsFilters,
  ): Promise<FinancialTransaction[]>;

  findAllByAccount(
    accountId: string,
  ): Promise<FinancialTransaction[]>;

  delete(
    id: string,
  ): Promise<void>;
}