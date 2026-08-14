import { NextResponse } from "next/server";

import {
  ListFinancialTransactionsUseCase,
} from "@/modules/financial/application/use-cases/ListFinancialTransactionsUseCase";

import {
  PrismaFinancialTransactionRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialTransactionRepository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const repository =
  new PrismaFinancialTransactionRepository();

const listFinancialTransactionsUseCase =
  new ListFinancialTransactionsUseCase(
    repository,
  );

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } =
      await context.params;

    const accountId =
      id.trim();

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "O identificador da conta é obrigatório.",
        },
        {
          status: 400,
        },
      );
    }

    const transactions =
      await listFinancialTransactionsUseCase.execute({
        accountId,
      });

    return NextResponse.json({
      success: true,

      transactions,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar histórico financeiro:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar o histórico financeiro.",
      },
      {
        status: 500,
      },
    );
  }
}