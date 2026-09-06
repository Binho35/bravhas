import { NextResponse } from "next/server";

import { logServerFailure, safeErrorMessage, serverErrorStatus } from "@/lib/serverErrors";
import { CancelFinancialAccountUseCase } from "@/modules/financial/application/use-cases/CancelFinancialAccountUseCase";
import { runFinancialTransaction } from "@/modules/financial/infrastructure/financialTransaction";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

const SAFE_ERRORS = [
  "A data do cancelamento é inválida.",
  "A conta financeira é obrigatória.",
  "O responsável pelo cancelamento é obrigatório.",
  "Conta financeira não encontrada.",
  "Esta conta já está cancelada.",
  "Uma conta já liquidada não pode ser cancelada.",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const cancellationDate =
      typeof body.cancellationDate === "string" && body.cancellationDate.trim()
        ? new Date(body.cancellationDate)
        : undefined;

    if (cancellationDate && Number.isNaN(cancellationDate.getTime())) {
      throw new Error("A data do cancelamento é inválida.");
    }

    const { actor } = await requireFinancialAccount(accountId);
    const result = await runFinancialTransaction(({ accountRepository, transactionRepository }) =>
      new CancelFinancialAccountUseCase(accountRepository, transactionRepository).execute({
        accountId: accountId.trim(),
        canceledBy: actor.id,
        cancellationDate,
      }),
    );

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      canceledAt: result.canceledAt,
    });
  } catch (error) {
    logServerFailure("Erro ao cancelar conta financeira", error);
    const validationError = error instanceof Error && SAFE_ERRORS.includes(error.message as (typeof SAFE_ERRORS)[number]);
    return NextResponse.json(
      {
        success: false,
        message: safeErrorMessage(error, SAFE_ERRORS, "Não foi possível cancelar a conta financeira."),
      },
      { status: validationError ? 400 : serverErrorStatus(error) },
    );
  }
}
