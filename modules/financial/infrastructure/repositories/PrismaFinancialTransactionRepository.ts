import { prisma } from "@/lib/prisma";

import type {
  FinancialTransaction,
  FinancialTransactionType,
} from "../../types/FinancialTransaction";

import type {
  FinancialTransactionRepository,
  FindFinancialTransactionsFilters,
} from "../../application/repositories/FinancialTransactionRepository";

export class PrismaFinancialTransactionRepository
  implements FinancialTransactionRepository
{
  async create(
    transaction: FinancialTransaction,
  ): Promise<FinancialTransaction> {
    const created =
      await prisma.financialTransaction.create({
        data: {
          id: transaction.id,

          accountId:
            transaction.accountId,

          performedBy:
            transaction.performedBy,

          type:
            transaction.type,

          amount:
            transaction.amount,

          performedAt:
            new Date(
              transaction.performedAt,
            ),

          notes:
            transaction.notes ?? null,
        },
      });

    return this.toDomain(created);
  }

  async findById(
    id: string,
  ): Promise<FinancialTransaction | null> {
    const transaction =
      await prisma.financialTransaction.findUnique({
        where: {
          id,
        },
      });

    if (!transaction) {
      return null;
    }

    return this.toDomain(transaction);
  }

  async findAll(
    filters?: FindFinancialTransactionsFilters,
  ): Promise<FinancialTransaction[]> {
    const transactions =
      await prisma.financialTransaction.findMany({
        where: {
          ...(filters?.accountId
            ? {
                accountId:
                  filters.accountId,
              }
            : {}),

          ...(filters?.performedBy
            ? {
                performedBy:
                  filters.performedBy,
              }
            : {}),

          ...(filters?.type
            ? {
                type:
                  filters.type,
              }
            : {}),

          ...(filters?.performedAtFrom ||
          filters?.performedAtTo
            ? {
                performedAt: {
                  ...(filters?.performedAtFrom
                    ? {
                        gte:
                          filters.performedAtFrom,
                      }
                    : {}),

                  ...(filters?.performedAtTo
                    ? {
                        lte:
                          filters.performedAtTo,
                      }
                    : {}),
                },
              }
            : {}),
        },

        orderBy: {
          performedAt: "desc",
        },
      });

    return transactions.map(
      (transaction) =>
        this.toDomain(transaction),
    );
  }

  async findAllByAccount(
    accountId: string,
  ): Promise<FinancialTransaction[]> {
    const transactions =
      await prisma.financialTransaction.findMany({
        where: {
          accountId,
        },

        orderBy: {
          performedAt: "desc",
        },
      });

    return transactions.map(
      (transaction) =>
        this.toDomain(transaction),
    );
  }

  async delete(
    id: string,
  ): Promise<void> {
    await prisma.financialTransaction.delete({
      where: {
        id,
      },
    });
  }

  private toDomain(
    transaction: {
      id: string;
      accountId: string;
      performedBy: string;
      type: string;
      amount: unknown;
      performedAt: Date;
      notes: string | null;
    },
  ): FinancialTransaction {
    return {
      id:
        transaction.id,

      accountId:
        transaction.accountId,

      type:
        transaction.type as FinancialTransactionType,

      amount:
        Number(transaction.amount),

      performedBy:
        transaction.performedBy,

      performedAt:
        transaction.performedAt.toISOString(),

      notes:
        transaction.notes,
    };
  }
}