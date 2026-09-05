import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logServerFailure, safeErrorMessage, serverErrorStatus } from "@/lib/serverErrors";
import { requireFinancialActor } from "@/modules/financial/server/financialAuth";

const OPENING_BALANCE_SAFE_ERRORS = [
  "Informe um saldo inicial válido.",
  "Informe uma data-base válida para o saldo inicial.",
] as const;

type OpeningBalanceRow = {
  amount: unknown;
  asOfDate: Date;
  updatedAt: Date;
};

async function loadOpeningBalance(companyId: string) {
  const rows = await prisma.$queryRaw<OpeningBalanceRow[]>`
    SELECT "amount", "asOfDate", "updatedAt"
    FROM "CashFlowOpeningBalance"
    WHERE "companyId" = ${companyId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;
  return {
    amount: Number(row.amount),
    asOfDate: row.asOfDate.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const actor = await requireFinancialActor();

    const [accounts, openingBalance] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { companyId: actor.companyId },
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
            orderBy: { performedAt: "desc" },
          },
        },
        orderBy: { dueDate: "asc" },
      }),
      loadOpeningBalance(actor.companyId),
    ]);

    return NextResponse.json({
      success: true,
      openingBalance,
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
      { success: false, message: "Não foi possível carregar o fluxo de caixa." },
      { status: serverErrorStatus(error) },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireFinancialActor();
    const body = await request.json();
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const asOfDate = typeof body.asOfDate === "string" ? body.asOfDate.trim() : "";
    const parsedDate = asOfDate ? new Date(`${asOfDate}T12:00:00Z`) : new Date(Number.NaN);

    if (!Number.isFinite(amount)) throw new Error("Informe um saldo inicial válido.");
    if (!asOfDate || Number.isNaN(parsedDate.getTime())) throw new Error("Informe uma data-base válida para o saldo inicial.");

    await prisma.$executeRaw`
      INSERT INTO "CashFlowOpeningBalance" ("companyId", "amount", "asOfDate", "updatedBy", "createdAt", "updatedAt")
      VALUES (${actor.companyId}, ${amount}, CAST(${asOfDate} AS DATE), ${actor.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("companyId") DO UPDATE SET
        "amount" = EXCLUDED."amount",
        "asOfDate" = EXCLUDED."asOfDate",
        "updatedBy" = EXCLUDED."updatedBy",
        "updatedAt" = CURRENT_TIMESTAMP
    `;

    const openingBalance = await loadOpeningBalance(actor.companyId);
    return NextResponse.json({ success: true, openingBalance });
  } catch (error) {
    logServerFailure("Erro ao salvar saldo inicial do fluxo de caixa", error);
    const validationError = error instanceof Error && OPENING_BALANCE_SAFE_ERRORS.includes(error.message as (typeof OPENING_BALANCE_SAFE_ERRORS)[number]);
    return NextResponse.json(
      { success: false, message: safeErrorMessage(error, OPENING_BALANCE_SAFE_ERRORS, "Não foi possível salvar o saldo inicial.") },
      { status: validationError ? 400 : serverErrorStatus(error) },
    );
  }
}
