import type {
  FinancialTransaction,
} from "../types/FinancialTransaction";

const STORAGE_KEY =
  "bravhas_financial_transactions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getFinancialTransactions(): FinancialTransaction[] {
  if (!isBrowser()) {
    return [];
  }

  const storedValue =
    window.localStorage.getItem(
      STORAGE_KEY,
    );

  if (!storedValue) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        storedValue,
      ) as FinancialTransaction[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveFinancialTransactions(
  transactions: FinancialTransaction[],
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(transactions),
  );
}

export function addFinancialTransaction(
  transaction: FinancialTransaction,
): void {
  const transactions =
    getFinancialTransactions();

  saveFinancialTransactions([
    ...transactions,
    transaction,
  ]);
}

export function getFinancialTransactionsByAccount(
  accountId: string,
): FinancialTransaction[] {
  return getFinancialTransactions()
    .filter(
      (transaction) =>
        transaction.accountId ===
        accountId,
    )
    .sort(
      (a, b) =>
        new Date(
          b.performedAt,
        ).getTime() -
        new Date(
          a.performedAt,
        ).getTime(),
    );
}

export function removeFinancialTransactionsByAccount(
  accountId: string,
): void {
  const transactions =
    getFinancialTransactions();

  const updated =
    transactions.filter(
      (transaction) =>
        transaction.accountId !==
        accountId,
    );

  saveFinancialTransactions(
    updated,
  );
}

export function clearFinancialTransactions(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  );
}