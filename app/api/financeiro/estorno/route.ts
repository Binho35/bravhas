import { NextResponse } from "next/server";

import {
  ReversePaymentUseCase,
} from "@/modules/financial/application/use-cases/ReversePaymentUseCase";

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

    const amount =
      body.amount === undefined ||
      body.amount === null ||
      body.amount === ""
        ? undefined
        : typeof body.amount === "number"
          ? body.amount
          : Number(body.amount);

    const reversedBy =
      typeof body.reversedBy === "string"
        ? body.reversedBy
        : "";

    const reversalDate =
      typeof body.reversalDate === "string" &&
      body.reversalDate.trim()
        ? new Date(body.reversalDate)
        : undefined;

    if (
      reversalDate &&
      Number.isNaN(
        reversalDate.getTime(),
      )
    ) {
      throw new Error(
        "A data do estorno é inválida.",
      );
    }

    const useCase =
      new ReversePaymentUseCase();

    const result =
      await useCase.execute({
        accountId,

        amount,

        reversedBy,

        reversalDate,
      });

    return NextResponse.json({
      success: true,

      account:
        result.account.data,

      transactionId:
        result.transactionId,

      reversedAmount:
        result.reversedAmount,

      remainingPaidAmount:
        result.remainingPaidAmount,
    });
  } catch (error) {
    console.error(
      "Erro ao registrar estorno:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o estorno.",
      },
      {
        status: 400,
      },
    );
  }
}