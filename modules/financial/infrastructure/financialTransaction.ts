import { prisma } from "@/lib/prisma";

import { PrismaFinancialAccountRepository } from "./repositories/PrismaFinancialAccountRepository";
import { PrismaFinancialTransactionRepository } from "./repositories/PrismaFinancialTransactionRepository";

export type FinancialTransactionalRepositories = {
  accountRepository: PrismaFinancialAccountRepository;
  transactionRepository: PrismaFinancialTransactionRepository;
};

export async function runFinancialTransaction<T>(
  operation: (repositories: FinancialTransactionalRepositories) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) =>
    operation({
      accountRepository: new PrismaFinancialAccountRepository(tx),
      transactionRepository: new PrismaFinancialTransactionRepository(tx),
    }),
  );
}
