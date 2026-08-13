import {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

export interface CreateFinancialAccountInput {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type: "PAYABLE" | "RECEIVABLE";

  description: string;

  documentNumber?: string | null;

  issueDate: Date;

  dueDate: Date;

  amount: number;

  discount?: number;

  interest?: number;

  fine?: number;

  notes?: string | null;

  createdBy: string;
}

export class CreateFinancialAccountUseCase {
  constructor(
    private readonly repository: FinancialAccountRepository,
  ) {}

  async execute(
    input: CreateFinancialAccountInput,
  ): Promise<FinancialAccount> {
    const description =
      input.description.trim();

    if (!description) {
      throw new Error(
        "A descrição da conta financeira é obrigatória.",
      );
    }

    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      throw new Error(
        "O valor da conta financeira deve ser maior que zero.",
      );
    }

    if (
      input.dueDate.getTime() <
      input.issueDate.getTime()
    ) {
      throw new Error(
        "A data de vencimento não pode ser anterior à data de emissão.",
      );
    }

    const now =
      new Date();

    const account =
      new FinancialAccount({
        id: input.id,

        companyId:
          input.companyId,

        branchId:
          input.branchId,

        costCenterId:
          input.costCenterId ?? null,

        categoryId:
          input.categoryId ?? null,

        supplierId:
          input.supplierId ?? null,

        customerId:
          input.customerId ?? null,

        bankAccountId:
          input.bankAccountId ?? null,

        type:
          input.type,

        status:
          "OPEN",

        description,

        documentNumber:
          input.documentNumber?.trim() ||
          null,

        issueDate:
          input.issueDate,

        dueDate:
          input.dueDate,

        paymentDate:
          null,

        amount:
          input.amount,

        paidAmount:
          0,

        discount:
          input.discount ?? 0,

        interest:
          input.interest ?? 0,

        fine:
          input.fine ?? 0,

        notes:
          input.notes?.trim() ||
          null,

        createdBy:
          input.createdBy,

        updatedBy:
          null,

        createdAt:
          now,

        updatedAt:
          now,
      });

    return this.repository.create(
      account,
    );
  }
}