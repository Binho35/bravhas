import { NextResponse } from "next/server";

import {
  RegisterReceiptUseCase,
} from "@/modules/financial/application/use-cases/RegisterReceiptUseCase";

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
      typeof body.amount === "number"
        ? body.amount
        : Number(body.amount);

    const receivedBy =
      typeof body.receivedBy === "string"
        ? body.receivedBy
        : "";

    const receiptDate =
      typeof body.receiptDate === "string" &&
      body.receiptDate.trim()
        ? new Date(body.receiptDate)
        : undefined;

    if (
      receiptDate &&
      Number.isNaN(
        receiptDate.getTime(),
      )
    ) {
      throw new Error(
        "A data do recebimento é inválida.",
      );
    }

    const useCase =
      new RegisterReceiptUseCase();

    const result =
      await useCase.execute({
        accountId,

        amount,

        receivedBy,

        receiptDate,
      });

    return NextResponse.json({
      success: true,

      account:
        result.account.data,

      transactionId:
        result.transactionId,

      fullyReceived:
        result.fullyReceived,

      remaining:
        result.remaining,
    });
  } catch (error) {
    console.error(
      "Erro ao registrar recebimento:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o recebimento.",
      },
      {
        status: 400,
      },
    );
  }
}