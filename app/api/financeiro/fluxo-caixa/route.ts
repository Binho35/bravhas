import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure } from "@/lib/serverErrors";
import { requireFinancialActor } from "@/modules/financial/server/financialAuth";

export async function GET() {
  try {
    const actor = await requireFinancialActor();

    const accounts = await prisma.financialAccount.findMany({
      where: {
        companyId: actor.companyId,
      },
      select: {
        id: true,
        type: true,
        status: true,
        dueDate: true,
        amount: true,
        paidAmount: true,
        discount: true,
        interest: true,
        fine: true,
        transactions: {
          select: {
            id: true,
            accountId: true,
            performedBy: true,
            type: true,
            amount: true,
            performedAt: true,
            notes: true,
          },
          orderBy: {
            performedAt: "desc",
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      accounts: accounts.map((account) => ({
        ...account,
        dueDate: account.dueDate.toISOString(),
        amount: Number(account.amount),
        paidAmount: Number(account.paidAmount),
        discount: Number(account.discount),
        interest: Number(account.interest),
        fine: Number(account.fine),
        transactions: account.transactions.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
          performedAt: transaction.performedAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    logServerFailure("Erro ao carregar fluxo de caixa agregado", error);
    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível carregar o fluxo de caixa.",
      },
      { status: 400 },
    );
  }
}
