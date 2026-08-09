import type {
  StoredFinancialAccount,
} from "../storage/financialStorage";

import type {
  FinancialTransaction,
} from "../types/FinancialTransaction";

import {
  roundCurrency,
} from "../utils/currency";

export interface CashFlowBucket {
  date: string;

  inflow: number;

  outflow: number;

  net: number;

  projectedBalance: number;
}

export interface CashFlowSummary {
  totalReceivable: number;

  totalPayable: number;

  totalReceived: number;

  totalPaid: number;

  projectedBalance: number;

  overdueReceivable: number;

  overduePayable: number;

  buckets: CashFlowBucket[];
}

export interface CalculateCashFlowInput {
  accounts: StoredFinancialAccount[];

  transactions: FinancialTransaction[];

  openingBalance?: number;

  startDate?: string;

  endDate?: string;
}

function normalizeDate(
  value: string | Date,
): Date {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function toDateKey(
  value: string | Date,
): string {
  const date =
    normalizeDate(value);

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1,
    ).padStart(2, "0"),
    String(
      date.getDate(),
    ).padStart(2, "0"),
  ].join("-");
}

function getAccountTotal(
  account: StoredFinancialAccount,
): number {
  return roundCurrency(
    account.amount -
      account.discount +
      account.interest +
      account.fine,
  );
}

function getAccountRemaining(
  account: StoredFinancialAccount,
): number {
  return Math.max(
    0,
    roundCurrency(
      getAccountTotal(account) -
        account.paidAmount,
    ),
  );
}

function isActiveAccount(
  account: StoredFinancialAccount,
): boolean {
  return (
    account.status !== "PAID" &&
    account.status !== "CANCELED"
  );
}

export function calculateCashFlow({
  accounts,
  transactions,
  openingBalance = 0,
  startDate,
  endDate,
}: CalculateCashFlowInput): CashFlowSummary {
  const today =
    normalizeDate(
      new Date(),
    );

  const activeAccounts =
    accounts.filter(
      isActiveAccount,
    );

  const payableAccounts =
    activeAccounts.filter(
      (account) =>
        account.type === "PAYABLE",
    );

  const receivableAccounts =
    activeAccounts.filter(
      (account) =>
        account.type === "RECEIVABLE",
    );

  const totalPayable =
    roundCurrency(
      payableAccounts.reduce(
        (total, account) =>
          total +
          getAccountRemaining(
            account,
          ),
        0,
      ),
    );

  const totalReceivable =
    roundCurrency(
      receivableAccounts.reduce(
        (total, account) =>
          total +
          getAccountRemaining(
            account,
          ),
        0,
      ),
    );

  const totalPaid =
    roundCurrency(
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "PAYMENT",
        )
        .reduce(
          (total, transaction) =>
            total +
            transaction.amount,
          0,
        ),
    );

  const totalReceived =
    roundCurrency(
      transactions
        .filter(
          (transaction) =>
            transaction.type ===
            "RECEIPT",
        )
        .reduce(
          (total, transaction) =>
            total +
            transaction.amount,
          0,
        ),
    );

  const overduePayable =
    roundCurrency(
      payableAccounts
        .filter(
          (account) =>
            normalizeDate(
              account.dueDate,
            ).getTime() <
            today.getTime(),
        )
        .reduce(
          (total, account) =>
            total +
            getAccountRemaining(
              account,
            ),
          0,
        ),
    );

  const overdueReceivable =
    roundCurrency(
      receivableAccounts
        .filter(
          (account) =>
            normalizeDate(
              account.dueDate,
            ).getTime() <
            today.getTime(),
        )
        .reduce(
          (total, account) =>
            total +
            getAccountRemaining(
              account,
            ),
          0,
        ),
    );

  const projectedBalance =
    roundCurrency(
      openingBalance +
        totalReceivable -
        totalPayable,
    );

  const effectiveStart =
    startDate
      ? normalizeDate(
          startDate,
        )
      : today;

  const effectiveEnd =
    endDate
      ? normalizeDate(
          endDate,
        )
      : new Date(
          effectiveStart.getFullYear(),
          effectiveStart.getMonth(),
          effectiveStart.getDate() +
            30,
        );

  const bucketMap =
    new Map<
      string,
      {
        inflow: number;
        outflow: number;
      }
    >();

  function ensureBucket(
    dateKey: string,
  ) {
    if (
      !bucketMap.has(dateKey)
    ) {
      bucketMap.set(
        dateKey,
        {
          inflow: 0,
          outflow: 0,
        },
      );
    }

    return bucketMap.get(
      dateKey,
    )!;
  }

  for (
    const account
    of activeAccounts
  ) {
    const dueDate =
      normalizeDate(
        account.dueDate,
      );

    if (
      dueDate.getTime() <
        effectiveStart.getTime() ||
      dueDate.getTime() >
        effectiveEnd.getTime()
    ) {
      continue;
    }

    const dateKey =
      toDateKey(
        dueDate,
      );

    const bucket =
      ensureBucket(
        dateKey,
      );

    const remaining =
      getAccountRemaining(
        account,
      );

    if (
      account.type ===
      "RECEIVABLE"
    ) {
      bucket.inflow =
        roundCurrency(
          bucket.inflow +
            remaining,
        );
    } else {
      bucket.outflow =
        roundCurrency(
          bucket.outflow +
            remaining,
        );
    }
  }

  const buckets: CashFlowBucket[] =
    [];

  let runningBalance =
    roundCurrency(
      openingBalance,
    );

  for (
    let date =
      new Date(
        effectiveStart,
      );
    date.getTime() <=
    effectiveEnd.getTime();
    date.setDate(
      date.getDate() + 1,
    )
  ) {
    const dateKey =
      toDateKey(date);

    const bucket =
      bucketMap.get(
        dateKey,
      ) ?? {
        inflow: 0,
        outflow: 0,
      };

    const net =
      roundCurrency(
        bucket.inflow -
          bucket.outflow,
      );

    runningBalance =
      roundCurrency(
        runningBalance +
          net,
      );

    buckets.push({
      date:
        dateKey,

      inflow:
        bucket.inflow,

      outflow:
        bucket.outflow,

      net,

      projectedBalance:
        runningBalance,
    });
  }

  return {
    totalReceivable,

    totalPayable,

    totalReceived,

    totalPaid,

    projectedBalance,

    overdueReceivable,

    overduePayable,

    buckets,
  };
}