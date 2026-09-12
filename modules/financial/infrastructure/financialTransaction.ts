import { prisma } from "@/lib/prisma";

import { PrismaFinancialAccountRepository } from "./repositories/PrismaFinancialAccountRepository";
import { PrismaFinancialTransactionRepository } from "./repositories/PrismaFinancialTransactionRepository";

export const FINANCIAL_CONCURRENCY_MESSAGE =
  "A operação financeira conflitou com outra atualização. Recarregue a conta e confirme o histórico antes de tentar novamente.";

export type FinancialTransactionalRepositories = {
  accountRepository: PrismaFinancialAccountRepository;
  transactionRepository: PrismaFinancialTransactionRepository;
};

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : undefined;
}

function financialConflictError() {
  const error = new Error(FINANCIAL_CONCURRENCY_MESSAGE) as Error & { code: string };
  error.code = "P2034";
  return error;
}

export async function runFinancialTransaction<T>(
  operation: (repositories: FinancialTransactionalRepositories) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) =>
        operation({
          accountRepository: new PrismaFinancialAccountRepository(tx),
          transactionRepository: new PrismaFinancialTransactionRepository(tx),
        }),
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    const code = errorCode(error);
    if (code === "P2034" || code === "P2002") throw financialConflictError();
    throw error;
  }
}
