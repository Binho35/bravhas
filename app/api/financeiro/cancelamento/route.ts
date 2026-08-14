import { NextResponse } from "next/server";

import {
  CancelFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/CancelFinancialAccountUseCase";

import {
  PrismaFinancialAccountRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";

import {
  PrismaFinancialTransactionRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const accountId =
      typeof body.accountId === "string"
        ? body.accountId
        : "";

    const canceledBy =
      typeof body.canceledBy === "string"
        ? body.canceledBy
        : "";

    const cancellationDate =
      typeof body.cancellationDate === "string" &&
      body.cancellationDate.trim()
        ? new Date(body.cancellationDate)
        : undefined;

    if (
      cancellationDate &&
      Number.isNaN(
        cancellationDate.getTime(),
      )
    ) {
      throw new Error(
        "A data do cancelamento é inválida.",
      );
    }

    const accountRepository =
      new PrismaFinancialAccountRepository();

    const transactionRepository =
      new PrismaFinancialTransactionRepository();

    const useCase =
      new CancelFinancialAccountUseCase(
        accountRepository,
        transactionRepository,
      );

    const result =
      await useCase.execute({
        accountId,

        canceledBy,

        cancellationDate,
      });

    return NextResponse.json({
      success: true,

      account:
        result.account.data,

      transactionId:
        result.transactionId,

      canceledAt:
        result.canceledAt,
    });
  } catch (error) {
    console.error(
      "Erro ao cancelar conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível cancelar a conta financeira.",
      },
      {
        status: 400,
      },
    );
  }
}