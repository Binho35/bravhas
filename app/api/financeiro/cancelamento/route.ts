import { NextResponse } from "next/server";

import {
  CancelFinancialAccountUseCase,
} from "@/modules/financial/application/use-cases/CancelFinancialAccountUseCase";

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

    const useCase =
      new CancelFinancialAccountUseCase();

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
        result.canceledAt.toISOString(),
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