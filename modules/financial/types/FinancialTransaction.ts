export type FinancialTransactionType =
  | "PAYMENT"
  | "RECEIPT"
  | "REVERSAL"
  | "CANCELLATION";

export interface FinancialTransaction {
  id: string;

  accountId: string;

  type: FinancialTransactionType;

  amount: number;

  performedBy: string;

  performedAt: string;

  notes?: string | null;
}