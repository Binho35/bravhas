import { NextResponse } from "next/server";

import { logServerFailure, safeErrorMessage, serverErrorStatus } from "@/lib/serverErrors";
import { FINANCIAL_OPERATION_ID_INVALID, FINANCIAL_OPERATION_ID_REUSED } from "@/modules/financial/application/financialIdempotency";
import { ReversePaymentUseCase } from "@/modules/financial/application/use-cases/ReversePaymentUseCase";
import { ReverseReceiptUseCase } from "@/modules/financial/application/use-cases/ReverseReceiptUseCase";
import { FINANCIAL_CONCURRENCY_MESSAGE, runFinancialTransaction } from "@/modules/financial/infrastructure/financialTransaction";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

const SAFE_ERRORS = [
  "A data do estorno é inválida.",
  "A conta financeira é obrigatória.",
  "O responsável pelo estorno é obrigatório.",
  "Conta financeira não encontrada.",
  "Este lançamento não é uma conta a pagar.",
  "Este lançamento não é uma conta a receber.",
  "Não é possível estornar uma conta cancelada.",
  "Esta conta não possui valor liquidado para estorno.",
  "Esta conta não possui valor recebido para estorno.",
  "O valor do estorno deve ser maior que zero.",
  "O valor do estorno é maior que o valor já liquidado.",
  "O valor do estorno é maior que o valor já recebido.",
  FINANCIAL_OPERATION_ID_INVALID,
  FINANCIAL_OPERATION_ID_REUSED,
  FINANCIAL_CONCURRENCY_MESSAGE,
] as const;

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
    const operationId = typeof body.operationId === "string" ? body.operationId : undefined;
    const reversalDate =
      typeof body.reversalDate === "string" && body.reversalDate.trim()
        ? new Date(body.reversalDate)
        : undefined;

    if (reversalDate && Number.isNaN(reversalDate.getTime())) throw new Error("A data do estorno é inválida.");

    const { actor, account } = await requireFinancialAccount(accountId);
    const result = await runFinancialTransaction(({ accountRepository, transactionRepository }) =>
      account.type === "PAYABLE"
        ? new ReversePaymentUseCase(accountRepository, transactionRepository).execute({
            accountId: accountId.trim(),
            amount,
            reversedBy: actor.id,
            reversalDate,
            operationId,
          })
        : new ReverseReceiptUseCase(accountRepository, transactionRepository).execute({
            accountId: accountId.trim(),
            amount,
            reversedBy: actor.id,
            reversalDate,
            operationId,
          }),
    );

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      reversedAmount: result.reversedAmount,
      ...("remainingPaidAmount" in result
        ? { remainingPaidAmount: result.remainingPaidAmount }
        : { remainingReceivedAmount: result.remainingReceivedAmount }),
    });
  } catch (error) {
    logServerFailure("Erro ao registrar estorno", error);
    const validationError = error instanceof Error && SAFE_ERRORS.includes(error.message as (typeof SAFE_ERRORS)[number]);
    return NextResponse.json(
      { success: false, message: safeErrorMessage(error, SAFE_ERRORS, "Não foi possível registrar o estorno.") },
      { status: validationError ? (serverErrorStatus(error) === 409 ? 409 : 400) : serverErrorStatus(error) },
    );
  }
}
