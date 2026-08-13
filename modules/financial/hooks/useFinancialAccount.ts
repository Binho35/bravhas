"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FinancialAccountView,
} from "../types/FinancialAccountView";

interface FinancialAccountApiResponse {
  success: boolean;

  account?: FinancialAccountView;

  message?: string;
}

export function useFinancialAccount(
  accountId: string,
) {
  const [
    account,
    setAccount,
  ] =
    useState<
      FinancialAccountView | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    notFound,
    setNotFound,
  ] =
    useState(false);

  const loadAccount =
    useCallback(
      async () => {
        if (!accountId) {
          setAccount(null);
          setNotFound(true);
          setLoading(false);

          return;
        }

        setLoading(true);
        setNotFound(false);

        try {
          const response =
            await fetch(
              `/api/financeiro/contas/${accountId}`,
            );

          if (
            response.status ===
            404
          ) {
            setAccount(null);
            setNotFound(true);

            return;
          }

          if (!response.ok) {
            throw new Error(
              "Não foi possível carregar a conta financeira.",
            );
          }

          const data =
            (await response.json()) as FinancialAccountApiResponse;

          if (
            !data.success ||
            !data.account
          ) {
            throw new Error(
              data.message ??
                "Resposta inválida ao carregar a conta financeira.",
            );
          }

          setAccount({
            ...data.account,

            source:
              "stored",
          });
        } catch (error) {
          console.error(
            "Erro ao carregar conta financeira:",
            error,
          );

          setAccount(null);
          setNotFound(true);
        } finally {
          setLoading(false);
        }
      },
      [accountId],
    );

  useEffect(() => {
    void loadAccount();
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
    false;

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