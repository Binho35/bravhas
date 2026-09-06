import { NextResponse } from "next/server";

import { logServerFailure, safeErrorMessage, serverErrorStatus } from "@/lib/serverErrors";
import { FINANCIAL_OPERATION_ID_INVALID, FINANCIAL_OPERATION_ID_REUSED } from "@/modules/financial/application/financialIdempotency";
import { RegisterReceiptUseCase } from "@/modules/financial/application/use-cases/RegisterReceiptUseCase";
import { FINANCIAL_CONCURRENCY_MESSAGE, runFinancialTransaction } from "@/modules/financial/infrastructure/financialTransaction";
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
  FINANCIAL_OPERATION_ID_INVALID,
  FINANCIAL_OPERATION_ID_REUSED,
  FINANCIAL_CONCURRENCY_MESSAGE,
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const operationId = typeof body.operationId === "string" ? body.operationId : undefined;
    const receiptDate =
      typeof body.receiptDate === "string" && body.receiptDate.trim()
        ? new Date(body.receiptDate)
        : undefined;

    if (receiptDate && Number.isNaN(receiptDate.getTime())) throw new Error("A data do recebimento é inválida.");

    const { actor } = await requireFinancialAccount(accountId);
    const result = await runFinancialTransaction(({ accountRepository, transactionRepository }) =>
      new RegisterReceiptUseCase(accountRepository, transactionRepository).execute({
        accountId: accountId.trim(),
        amount,
        receivedBy: actor.id,
        receiptDate,
        operationId,
      }),
    );

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      fullyReceived: result.fullyReceived,
      remaining: result.remaining,
    });
  } catch (error) {
    logServerFailure("Erro ao registrar recebimento", error);
    const validationError = error instanceof Error && SAFE_ERRORS.includes(error.message as (typeof SAFE_ERRORS)[number]);
    return NextResponse.json(
      { success: false, message: safeErrorMessage(error, SAFE_ERRORS, "Não foi possível registrar o recebimento.") },
      { status: validationError ? (serverErrorStatus(error) === 409 ? 409 : 400) : serverErrorStatus(error) },
    );
  }
}
