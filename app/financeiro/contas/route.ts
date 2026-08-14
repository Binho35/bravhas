import { NextRequest, NextResponse } from "next/server";

import {
  CreateFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/CreateFinancialAccountUseCase";

import {
  ListFinancialAccountsUseCase,
} from "@/modules/financial/application/use-cases/ListFinancialAccountsUseCase";

import {
  PrismaFinancialAccountRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";

const repository =
  new PrismaFinancialAccountRepository();

const createFinancialAccountUseCase =
  new CreateFinancialAccountUseCase(
    repository,
  );

const listFinancialAccountsUseCase =
  new ListFinancialAccountsUseCase(
    repository,
  );

export async function GET(
  request: NextRequest,
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const companyId =
      searchParams.get("companyId") ?? "";

    const accounts =
      await listFinancialAccountsUseCase.execute({
        companyId,

        branchId:
          searchParams.get("branchId") ??
          undefined,

        type:
          (searchParams.get("type") as
            | "PAYABLE"
            | "RECEIVABLE"
            | null) ??
          undefined,

        status:
          (searchParams.get("status") as
            | "OPEN"
            | "PARTIALLY_PAID"
            | "PAID"
            | "OVERDUE"
            | "CANCELED"
            | null) ??
          undefined,

        supplierId:
          searchParams.get("supplierId") ??
          undefined,

        customerId:
          searchParams.get("customerId") ??
          undefined,

        categoryId:
          searchParams.get("categoryId") ??
          undefined,

        costCenterId:
          searchParams.get("costCenterId") ??
          undefined,

        bankAccountId:
          searchParams.get("bankAccountId") ??
          undefined,

        dueDateFrom:
          searchParams.get("dueDateFrom")
            ? new Date(
                searchParams.get(
                  "dueDateFrom",
                )!,
              )
            : undefined,

        dueDateTo:
          searchParams.get("dueDateTo")
            ? new Date(
                searchParams.get(
                  "dueDateTo",
                )!,
              )
            : undefined,
      });

    return NextResponse.json({
      success: true,

      ...accounts,
    });
  } catch (error) {
    console.error(
      "Erro ao listar contas financeiras:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível listar as contas financeiras.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const companyId =
      String(
        body.companyId ?? "",
      ).trim();

    const branchId =
      String(
        body.branchId ?? "",
      ).trim();

    const description =
      String(
        body.description ?? "",
      ).trim();

    const createdBy =
      String(
        body.createdBy ?? "",
      ).trim();

    if (!companyId) {
      throw new Error(
        "A empresa é obrigatória.",
      );
    }

    if (!branchId) {
      throw new Error(
        "A filial é obrigatória.",
      );
    }

    if (!createdBy) {
      throw new Error(
        "O responsável pela criação é obrigatório.",
      );
    }

    if (!description) {
      throw new Error(
        "A descrição da conta financeira é obrigatória.",
      );
    }

    const issueDate =
      new Date(
        body.issueDate,
      );

    const dueDate =
      new Date(
        body.dueDate,
      );

    if (
      Number.isNaN(
        issueDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de emissão é inválida.",
      );
    }

    if (
      Number.isNaN(
        dueDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de vencimento é inválida.",
      );
    }

    const account =
      await createFinancialAccountUseCase.execute({
        id:
          crypto.randomUUID(),

        companyId,

        branchId,

        costCenterId:
          body.costCenterId ?? null,

        categoryId:
          body.categoryId ?? null,

        supplierId:
          body.supplierId ?? null,

        customerId:
          body.customerId ?? null,

        bankAccountId:
          body.bankAccountId ?? null,

        type:
          body.type,

        description,

        documentNumber:
          body.documentNumber ?? null,

        issueDate,

        dueDate,

        amount:
          Number(
            body.amount,
          ),

        discount:
          Number(
            body.discount ?? 0,
          ),

        interest:
          Number(
            body.interest ?? 0,
          ),

        fine:
          Number(
            body.fine ?? 0,
          ),

        notes:
          body.notes ?? null,

        createdBy,
      });

    return NextResponse.json(
      {
        success: true,

        account:
          account.data,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Erro ao criar conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível criar a conta financeira.",
      },
      {
        status: 400,
      },
    );
  }
}