import { NextResponse } from "next/server";

import {
  PrismaFinancialAccountRepository,
} from "@/modules/financial/infrastructure/repositories/PrismaFinancialAccountRepository";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

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

    const repository =
      new PrismaFinancialAccountRepository();

    const account =
      await repository.findById(
        accountId,
      );

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conta financeira não encontrada.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      account:
        account.data,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar conta financeira:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a conta financeira.",
      },
      {
        status: 500,
      },
    );
  }
}