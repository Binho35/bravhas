"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { financialAccounts as mockFinancialAccounts } from "../mocks/financialAccounts";

import {
  getStoredFinancialAccounts,
  type StoredFinancialAccount,
} from "../storage/financialStorage";

import type { FinancialAccountView } from "../types/FinancialAccountView";

function convertStoredAccount(
  account: StoredFinancialAccount,
): FinancialAccountView {
  return {
    ...account,
    source: "stored",
  };
}

function convertMockAccount(
  account: (typeof mockFinancialAccounts)[number],
): FinancialAccountView {
  return {
    id: account.id,

    companyId: account.companyId,

    branchId: account.branchId,

    costCenterId:
      account.costCenterId ?? null,

    categoryId:
      account.categoryId ?? null,

    supplierId:
      account.supplierId ?? null,

    customerId:
      account.customerId ?? null,

    bankAccountId:
      account.bankAccountId ?? null,

    type: account.type,

    status: account.status,

    description:
      account.description,

    documentNumber:
      account.documentNumber ?? null,

    issueDate:
      account.issueDate.toISOString(),

    dueDate:
      account.dueDate.toISOString(),

    paymentDate:
      account.paymentDate
        ? account.paymentDate.toISOString()
        : null,

    amount: account.amount,

    paidAmount:
      account.paidAmount,

    discount:
      account.discount,

    interest:
      account.interest,

    fine: account.fine,

    notes:
      account.notes ?? null,

    createdBy:
      account.createdBy,

    updatedBy:
      account.updatedBy ?? null,

    createdAt:
      account.createdAt.toISOString(),

    updatedAt:
      account.updatedAt.toISOString(),

    source: "mock",
  };
}

export function useFinancialAccount(
  accountId: string,
) {
  const [
    account,
    setAccount,
  ] =
    useState<FinancialAccountView | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const loadAccount =
    useCallback(() => {
      setLoading(true);

      setNotFound(false);

      const stored =
        getStoredFinancialAccounts();

      const storedMatch =
        stored.find(
          (item) =>
            item.id === accountId,
        );

      if (storedMatch) {
        setAccount(
          convertStoredAccount(
            storedMatch,
          ),
        );

        setLoading(false);

        return;
      }

      const mockMatch =
        mockFinancialAccounts.find(
          (item) =>
            item.id === accountId,
        );

      if (mockMatch) {
        setAccount(
          convertMockAccount(
            mockMatch,
          ),
        );

        setLoading(false);

        return;
      }

      setAccount(null);

      setNotFound(true);

      setLoading(false);
    }, [accountId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const total =
    useMemo(() => {
      if (!account) {
        return 0;
      }

      return (
        account.amount -
        account.discount +
        account.interest +
        account.fine
      );
    }, [account]);

  const remaining =
    useMemo(() => {
      if (!account) {
        return 0;
      }

      return Math.max(
        0,
        total -
          account.paidAmount,
      );
    }, [
      account,
      total,
    ]);

  const isReadOnly =
    account?.source ===
      "mock";

  const isClosed =
    account?.status ===
      "PAID" ||
    account?.status ===
      "CANCELED";

  const isOverdue =
    useMemo(() => {
      if (!account) {
        return false;
      }

      if (
        account.status ===
          "PAID" ||
        account.status ===
          "CANCELED"
      ) {
        return false;
      }

      return (
        new Date(
          account.dueDate,
        ).getTime() <
        Date.now()
      );
    }, [account]);

  function handleAccountUpdated(
    updatedAccount: FinancialAccountView,
  ) {
    setAccount(
      updatedAccount,
    );
  }

  return {
    account,

    loading,

    notFound,

    total,

    remaining,

    isReadOnly,

    isClosed,

    isOverdue,

    reload:
      loadAccount,

    onAccountUpdated:
      handleAccountUpdated,
  };
}