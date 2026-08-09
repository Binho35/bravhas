import type {
  FinancialAccountStatus,
  FinancialAccountType,
} from "../domain/entities/FinancialAccount";

export interface FinancialAccountView {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type: FinancialAccountType;

  status: FinancialAccountStatus;

  description: string;

  documentNumber?: string | null;

  issueDate: string;

  dueDate: string;

  paymentDate?: string | null;

  amount: number;

  paidAmount: number;

  discount: number;

  interest: number;

  fine: number;

  notes?: string | null;

  createdBy: string;

  updatedBy?: string | null;

  createdAt: string;

  updatedAt: string;

  source: "mock" | "stored";
}