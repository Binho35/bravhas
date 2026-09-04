import { NextResponse } from "next/server";

import { logServerFailure } from "@/lib/serverErrors";
import { ListFinancialTransactionsUseCase } from "@/modules/financial/application/use-cases/ListFinancialTransactionsUseCase";
import { PrismaFinancialTransactionRepository } from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";
import { requireFinancialAccount } from "@/modules/financial/server/financialAuth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const repository = new PrismaFinancialTransactionRepository();
const listFinancialTransactionsUseCase = new ListFinancialTransactionsUseCase(repository);

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const accountId = id.trim();
    await requireFinancialAccount(accountId);

    const transactions = await listFinancialTransactionsUseCase.execute({ accountId });
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    logServerFailure("Erro ao buscar histórico financeiro", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível consultar o histórico financeiro." },
      { status: 400 },
    );
  }
}
