import { NextResponse } from "next/server";

import { logServerFailure, safeErrorMessage } from "@/lib/serverErrors";
import { RegisterPaymentUseCase } from "@/modules/financial/application/use-cases/RegisterPaymentUseCase";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

const SAFE_ERRORS = [
  "A data do pagamento é inválida.",
  "A conta financeira é obrigatória.",
  "O responsável pelo pagamento é obrigatório.",
  "O valor do pagamento deve ser maior que zero.",
  "Conta financeira não encontrada.",
  "Este lançamento não é uma conta a pagar.",
  "Esta conta não permite um novo pagamento.",
  "Esta conta não possui saldo pendente.",
  "O valor do pagamento é maior que o saldo restante.",
] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accountId = typeof body.accountId === "string" ? body.accountId : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const paymentDate =
      typeof body.paymentDate === "string" && body.paymentDate.trim()
        ? new Date(body.paymentDate)
        : undefined;

    if (paymentDate && Number.isNaN(paymentDate.getTime())) {
      throw new Error("A data do pagamento é inválida.");
    }

    const { actor } = await requireFinancialAccount(accountId);
    const result = await new RegisterPaymentUseCase().execute({
      accountId: accountId.trim(),
      amount,
      paidBy: actor.id,
      paymentDate,
    });

    return NextResponse.json({
      success: true,
      account: result.account.data,
      transactionId: result.transactionId,
      fullyPaid: result.fullyPaid,
      remaining: result.remaining,
    });
  } catch (error) {
    logServerFailure("Erro ao registrar pagamento", error);
    return NextResponse.json(
      {
        success: false,
        message: safeErrorMessage(error, SAFE_ERRORS, "Não foi possível registrar o pagamento."),
      },
      { status: 400 },
    );
  }
}
