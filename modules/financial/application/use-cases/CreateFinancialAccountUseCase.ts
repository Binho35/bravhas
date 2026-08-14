import {
  FinancialAccount,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
} from "../repositories/FinancialAccountRepository";

import {
  roundCurrency,
} from "../../utils/currency";

export interface CreateFinancialAccountInput {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type:
    | "PAYABLE"
    | "RECEIVABLE";

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
    const id =
      input.id.trim();

    if (!id) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    const companyId =
      input.companyId.trim();

    if (!companyId) {
      throw new Error(
        "A empresa é obrigatória.",
      );
    }

    const branchId =
      input.branchId.trim();

    if (!branchId) {
      throw new Error(
        "A filial é obrigatória.",
      );
    }

    const createdBy =
      input.createdBy.trim();

    if (!createdBy) {
      throw new Error(
        "O responsável pela criação é obrigatório.",
      );
    }

    if (
      input.type !== "PAYABLE" &&
      input.type !== "RECEIVABLE"
    ) {
      throw new Error(
        "O tipo da conta financeira é inválido.",
      );
    }

    const description =
      input.description.trim();

    if (!description) {
      throw new Error(
        "A descrição da conta financeira é obrigatória.",
      );
    }

    if (
      !Number.isFinite(
        input.amount,
      ) ||
      input.amount <= 0
    ) {
      throw new Error(
        "O valor da conta financeira deve ser maior que zero.",
      );
    }

    if (
      !Number.isFinite(
        input.discount ?? 0,
      ) ||
      (input.discount ?? 0) < 0
    ) {
      throw new Error(
        "O desconto não pode ser negativo.",
      );
    }

    if (
      !Number.isFinite(
        input.interest ?? 0,
      ) ||
      (input.interest ?? 0) < 0
    ) {
      throw new Error(
        "Os juros não podem ser negativos.",
      );
    }

    if (
      !Number.isFinite(
        input.fine ?? 0,
      ) ||
      (input.fine ?? 0) < 0
    ) {
      throw new Error(
        "A multa não pode ser negativa.",
      );
    }

    if (
      !Number.isFinite(
        input.issueDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de emissão é inválida.",
      );
    }

    if (
      !Number.isFinite(
        input.dueDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de vencimento é inválida.",
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
        id,

        companyId,

        branchId,

        costCenterId:
          input.costCenterId?.trim() ||
          null,

        categoryId:
          input.categoryId?.trim() ||
          null,

        supplierId:
          input.supplierId?.trim() ||
          null,

        customerId:
          input.customerId?.trim() ||
          null,

        bankAccountId:
          input.bankAccountId?.trim() ||
          null,

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
          roundCurrency(
            input.amount,
          ),

        paidAmount:
          0,

        discount:
          roundCurrency(
            input.discount ?? 0,
          ),

        interest:
          roundCurrency(
            input.interest ?? 0,
          ),

        fine:
          roundCurrency(
            input.fine ?? 0,
          ),

        notes:
          input.notes?.trim() ||
          null,

        createdBy,

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