import { NextRequest, NextResponse } from "next/server";

import {
  GetFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/GetFinancialAccountUseCase";

import {
  UpdateFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/UpdateFinancialAccountUseCase";

import {
  DeleteFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/DeleteFinancialAccountUseCase";

import {
  PrismaFinancialAccountRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const repository =
  new PrismaFinancialAccountRepository();

const getFinancialAccountUseCase =
  new GetFinancialAccountUseCase(
    repository,
  );

const updateFinancialAccountUseCase =
  new UpdateFinancialAccountUseCase(
    repository,
  );

const deleteFinancialAccountUseCase =
  new DeleteFinancialAccountUseCase(
    repository,
  );

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const account =
      await getFinancialAccountUseCase.execute({
        id,
      });

    if (!account) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Conta financeira não encontrada.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      account:
        account.data,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a conta financeira.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const accountId =
      id.trim();

    if (!accountId) {
      throw new Error(
        "O identificador da conta financeira é obrigatório.",
      );
    }

    const existingAccount =
      await repository.findById(
        accountId,
      );

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Conta financeira não encontrada.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      await request.json();

    const description =
      String(
        body.description ??
          existingAccount.data.description,
      ).trim();

    if (!description) {
      throw new Error(
        "A descrição da conta financeira é obrigatória.",
      );
    }

    const issueDate =
      body.issueDate !== undefined
        ? new Date(body.issueDate)
        : existingAccount.data.issueDate;

    const dueDate =
      body.dueDate !== undefined
        ? new Date(body.dueDate)
        : existingAccount.data.dueDate;

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

    const amount =
      body.amount !== undefined
        ? Number(body.amount)
        : existingAccount.data.amount;

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "O valor da conta financeira deve ser maior que zero.",
      );
    }

    const updatedBy =
      body.updatedBy !== undefined
        ? String(
            body.updatedBy,
          ).trim()
        : existingAccount.data.updatedBy;

    const updatedAccount =
      existingAccount.update({
        branchId:
          body.branchId !== undefined
            ? String(
                body.branchId,
              ).trim()
            : existingAccount.data.branchId,

        costCenterId:
          body.costCenterId !== undefined
            ? body.costCenterId
            : existingAccount.data.costCenterId,

        categoryId:
          body.categoryId !== undefined
            ? body.categoryId
            : existingAccount.data.categoryId,

        supplierId:
          body.supplierId !== undefined
            ? body.supplierId
            : existingAccount.data.supplierId,

        customerId:
          body.customerId !== undefined
            ? body.customerId
            : existingAccount.data.customerId,

        bankAccountId:
          body.bankAccountId !== undefined
            ? body.bankAccountId
            : existingAccount.data.bankAccountId,

        type:
          body.type !== undefined
            ? body.type
            : existingAccount.data.type,

        description,

        documentNumber:
          body.documentNumber !== undefined
            ? body.documentNumber
            : existingAccount.data.documentNumber,

        issueDate,

        dueDate,

        amount,

        discount:
          body.discount !== undefined
            ? Number(body.discount)
            : existingAccount.data.discount,

        interest:
          body.interest !== undefined
            ? Number(body.interest)
            : existingAccount.data.interest,

        fine:
          body.fine !== undefined
            ? Number(body.fine)
            : existingAccount.data.fine,

        notes:
          body.notes !== undefined
            ? body.notes
            : existingAccount.data.notes,

        updatedBy:
          updatedBy || null,

        updatedAt:
          new Date(),
      });

    const account =
      await updateFinancialAccountUseCase.execute({
        account:
          updatedAccount,
      });

    return NextResponse.json({
      success: true,

      account:
        account.data,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a conta financeira.",
      },
      {
        status: 400,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    await deleteFinancialAccountUseCase.execute({
      id,
    });

    return NextResponse.json({
      success: true,

      message:
        "Conta financeira excluída com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao excluir conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a conta financeira.",
      },
      {
        status: 400,
      },
    );
  }
}