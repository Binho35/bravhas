import { prisma } from "@/lib/prisma";

import {
  FinancialAccount,
  type FinancialAccountStatus,
  type FinancialAccountType,
} from "../../domain/entities/FinancialAccount";

import type {
  FinancialAccountRepository,
  FindFinancialAccountsFilters,
} from "../../application/repositories/FinancialAccountRepository";

export class PrismaFinancialAccountRepository
  implements FinancialAccountRepository
{
  async create(
    account: FinancialAccount,
  ): Promise<FinancialAccount> {
    const data = account.data;

    const created =
      await prisma.financialAccount.create({
        data: {
          id: data.id,
          companyId: data.companyId,
          branchId: data.branchId,

          costCenterId:
            data.costCenterId ?? null,

          categoryId:
            data.categoryId ?? null,

          supplierId:
            data.supplierId ?? null,

          customerId:
            data.customerId ?? null,

          bankAccountId:
            data.bankAccountId ?? null,

          type: data.type,
          status: data.status,

          description:
            data.description,

          documentNumber:
            data.documentNumber ?? null,

          issueDate:
            data.issueDate,

          dueDate:
            data.dueDate,

          paymentDate:
            data.paymentDate ?? null,

          amount:
            data.amount,

          paidAmount:
            data.paidAmount,

          discount:
            data.discount,

          interest:
            data.interest,

          fine:
            data.fine,

          notes:
            data.notes ?? null,

          createdBy:
            data.createdBy,

          updatedBy:
            data.updatedBy ?? null,

          createdAt:
            data.createdAt,

          updatedAt:
            data.updatedAt,
        },
      });

    return this.toDomain(created);
  }

  async findById(
    id: string,
  ): Promise<FinancialAccount | null> {
    const account =
      await prisma.financialAccount.findUnique({
        where: {
          id,
        },
      });

    if (!account) {
      return null;
    }

    return this.toDomain(account);
  }

  async findAll(
    filters: FindFinancialAccountsFilters,
  ): Promise<FinancialAccount[]> {
    const accounts =
      await prisma.financialAccount.findMany({
        where: {
          companyId:
            filters.companyId,

          ...(filters.branchId
            ? {
                branchId:
                  filters.branchId,
              }
            : {}),

          ...(filters.type
            ? {
                type:
                  filters.type,
              }
            : {}),

          ...(filters.status
            ? {
                status:
                  filters.status,
              }
            : {}),

          ...(filters.supplierId
            ? {
                supplierId:
                  filters.supplierId,
              }
            : {}),

          ...(filters.customerId
            ? {
                customerId:
                  filters.customerId,
              }
            : {}),

          ...(filters.categoryId
            ? {
                categoryId:
                  filters.categoryId,
              }
            : {}),

          ...(filters.costCenterId
            ? {
                costCenterId:
                  filters.costCenterId,
              }
            : {}),

          ...(filters.bankAccountId
            ? {
                bankAccountId:
                  filters.bankAccountId,
              }
            : {}),

          ...(filters.dueDateFrom ||
          filters.dueDateTo
            ? {
                dueDate: {
                  ...(filters.dueDateFrom
                    ? {
                        gte:
                          filters.dueDateFrom,
                      }
                    : {}),

                  ...(filters.dueDateTo
                    ? {
                        lte:
                          filters.dueDateTo,
                      }
                    : {}),
                },
              }
            : {}),
        },

        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

    return accounts.map(
      (account) =>
        this.toDomain(account),
    );
  }

  async update(
    account: FinancialAccount,
  ): Promise<FinancialAccount> {
    const data = account.data;

    const updated =
      await prisma.financialAccount.update({
        where: {
          id: data.id,
        },

        data: {
          companyId:
            data.companyId,

          branchId:
            data.branchId,

          costCenterId:
            data.costCenterId ?? null,

          categoryId:
            data.categoryId ?? null,

          supplierId:
            data.supplierId ?? null,

          customerId:
            data.customerId ?? null,

          bankAccountId:
            data.bankAccountId ?? null,

          type:
            data.type,

          status:
            data.status,

          description:
            data.description,

          documentNumber:
            data.documentNumber ?? null,

          issueDate:
            data.issueDate,

          dueDate:
            data.dueDate,

          paymentDate:
            data.paymentDate ?? null,

          amount:
            data.amount,

          paidAmount:
            data.paidAmount,

          discount:
            data.discount,

          interest:
            data.interest,

          fine:
            data.fine,

          notes:
            data.notes ?? null,

          createdBy:
            data.createdBy,

          updatedBy:
            data.updatedBy ?? null,

          updatedAt:
            data.updatedAt,
        },
      });

    return this.toDomain(updated);
  }

  async delete(
    id: string,
  ): Promise<void> {
    await prisma.financialAccount.delete({
      where: {
        id,
      },
    });
  }

  private toDomain(
    account: {
      id: string;
      companyId: string;
      branchId: string;
      costCenterId: string | null;
      categoryId: string | null;
      supplierId: string | null;
      customerId: string | null;
      bankAccountId: string | null;
      type: string;
      status: string;
      description: string;
      documentNumber: string | null;
      issueDate: Date;
      dueDate: Date;
      paymentDate: Date | null;
      amount: unknown;
      paidAmount: unknown;
      discount: unknown;
      interest: unknown;
      fine: unknown;
      notes: string | null;
      createdBy: string;
      updatedBy: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): FinancialAccount {
    return new FinancialAccount({
      id: account.id,

      companyId:
        account.companyId,

      branchId:
        account.branchId,

      costCenterId:
        account.costCenterId,

      categoryId:
        account.categoryId,

      supplierId:
        account.supplierId,

      customerId:
        account.customerId,

      bankAccountId:
        account.bankAccountId,

      type:
        account.type as FinancialAccountType,

      status:
        account.status as FinancialAccountStatus,

      description:
        account.description,

      documentNumber:
        account.documentNumber,

      issueDate:
        account.issueDate,

      dueDate:
        account.dueDate,

      paymentDate:
        account.paymentDate,

      amount:
        Number(account.amount),

      paidAmount:
        Number(account.paidAmount),

      discount:
        Number(account.discount),

      interest:
        Number(account.interest),

      fine:
        Number(account.fine),

      notes:
        account.notes,

      createdBy:
        account.createdBy,

      updatedBy:
        account.updatedBy,

      createdAt:
        account.createdAt,

      updatedAt:
        account.updatedAt,
    });
  }
}