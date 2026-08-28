import { NextResponse } from "next/server";

import { ReversePaymentUseCase } from "@/modules/financial/application/use-cases/ReversePaymentUseCase";
import { PrismaFinancialAccountRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";
import { PrismaFinancialTransactionRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const amount =
      body.amount === undefined || body.amount === null || body.amount === ""
        ? undefined
        : typeof body.amount === "number"
          ? body.amount
          : Number(body.amount);
    const reversalDate =
      typeof body.reversalDate === "string" && body.reversalDate.trim()
        ? new Date(body.reversalDate)
        : undefined;

    if (reversalDate && Number.isNaN(reversalDate.getTime())) {
      throw new Error("A data do estorno é inválida.");
    }

    const { actor } = await requireFinancialAccount(accountId);
    const useCase = new ReversePaymentUseCase(
      new PrismaFinancialAccountRepository(),
      new PrismaFinancialTransactionRepository(),
    );

    const result = await useCase.execute({
      accountId: accountId.trim(),
      amount,
      reversedBy: actor.id,
      reversalDate,
    });

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      reversedAmount: result.reversedAmount,
      remainingPaidAmount: result.remainingPaidAmount,
    });
  } catch (error) {
    console.error("Erro ao registrar estorno:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Não foi possível registrar o estorno.",
      },
      { status: 400 },
    );
  }
}
