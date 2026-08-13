import { NextResponse } from "next/server";

import {
  RegisterPaymentUseCase,
} from "@/modules/financial/application/use-cases/RegisterPaymentUseCase";

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

    const paidBy =
      typeof body.paidBy === "string"
        ? body.paidBy
        : "";

    const paymentDate =
      typeof body.paymentDate === "string" &&
      body.paymentDate.trim()
        ? new Date(body.paymentDate)
        : undefined;

    if (
      paymentDate &&
      Number.isNaN(
        paymentDate.getTime(),
      )
    ) {
      throw new Error(
        "A data do pagamento é inválida.",
      );
    }

    const useCase =
      new RegisterPaymentUseCase();

    const result =
      await useCase.execute({
        accountId,

        amount,

        paidBy,

        paymentDate,
      });

    return NextResponse.json({
      success: true,

      account:
        result.account.data,

      transactionId:
        result.transactionId,

      fullyPaid:
        result.fullyPaid,

      remaining:
        result.remaining,
    });
  } catch (error) {
    console.error(
      "Erro ao registrar pagamento:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o pagamento.",
      },
      {
        status: 400,
      },
    );
  }
}