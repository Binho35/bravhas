import { NextResponse } from "next/server";

import { logServerFailure, safeErrorMessage } from "@/lib/serverErrors";
import { RegisterReceiptUseCase } from "@/modules/financial/application/use-cases/RegisterReceiptUseCase";
import { PrismaFinancialAccountRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";
import { PrismaFinancialTransactionRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

const SAFE_ERRORS = [
  "A data do recebimento é inválida.",
  "A conta financeira é obrigatória.",
  "O responsável pelo recebimento é obrigatório.",
  "O valor do recebimento deve ser maior que zero.",
  "Conta financeira não encontrada.",
  "Este lançamento não é uma conta a receber.",
  "Esta conta não permite um novo recebimento.",
  "Esta conta não possui saldo pendente.",
  "O valor do recebimento é maior que o saldo restante.",
] as const;

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
    logServerFailure("Erro ao registrar recebimento", error);
    return NextResponse.json(
      {
        success: false,
        message: safeErrorMessage(error, SAFE_ERRORS, "Não foi possível registrar o recebimento."),
      },
      { status: 400 },
    );
  }
}
