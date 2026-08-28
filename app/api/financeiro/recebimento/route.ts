import { NextResponse } from "next/server";

import { RegisterReceiptUseCase } from "@/modules/financial/application/use-cases/RegisterReceiptUseCase";
import { PrismaFinancialAccountRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";
import { PrismaFinancialTransactionRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const receiptDate =
      typeof body.receiptDate === "string" && body.receiptDate.trim()
        ? new Date(body.receiptDate)
        : undefined;

    if (receiptDate && Number.isNaN(receiptDate.getTime())) {
      throw new Error("A data do recebimento é inválida.");
    }

    const { actor } = await requireFinancialAccount(accountId);
    const useCase = new RegisterReceiptUseCase(
      new PrismaFinancialAccountRepository(),
      new PrismaFinancialTransactionRepository(),
    );

    const result = await useCase.execute({
      accountId: accountId.trim(),
      amount,
      receivedBy: actor.id,
      receiptDate,
    });

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      fullyReceived: result.fullyReceived,
      remaining: result.remaining,
    });
  } catch (error) {
    console.error("Erro ao registrar recebimento:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Não foi possível registrar o recebimento.",
      },
      { status: 400 },
    );
  }
}
