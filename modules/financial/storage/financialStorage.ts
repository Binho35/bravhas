import type {
  FinancialAccountStatus,
  FinancialAccountType,
} from "../domain/entities/FinancialAccount";

export interface StoredFinancialAccount {
  id: string;

  companyId: string;

  branchId: string;

  costCenterId?: string | null;

  categoryId?: string | null;

  supplierId?: string | null;

  customerId?: string | null;

  bankAccountId?: string | null;

  type: FinancialAccountType;

  status: FinancialAccountStatus;

  description: string;

  documentNumber?: string | null;

  issueDate: string;

  dueDate: string;

  paymentDate?: string | null;

  amount: number;

  paidAmount: number;

  discount: number;

  interest: number;

  fine: number;

  notes?: string | null;

  createdBy: string;

  updatedBy?: string | null;

  createdAt: string;

  updatedAt: string;
}

const STORAGE_KEY =
  "bravhas_financial_accounts";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredFinancialAccounts(): StoredFinancialAccount[] {
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
      ) as StoredFinancialAccount[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveStoredFinancialAccounts(
  accounts: StoredFinancialAccount[],
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(accounts),
  );
}

export function addStoredFinancialAccount(
  account: StoredFinancialAccount,
): void {
  const accounts =
    getStoredFinancialAccounts();

  saveStoredFinancialAccounts([
    ...accounts,
    account,
  ]);
}

export function updateStoredFinancialAccount(
  account: StoredFinancialAccount,
): void {
  const accounts =
    getStoredFinancialAccounts();

  const updated =
    accounts.map((item) =>
      item.id === account.id
        ? account
        : item,
    );

  saveStoredFinancialAccounts(
    updated,
  );
}

export function removeStoredFinancialAccount(
  accountId: string,
): void {
  const accounts =
    getStoredFinancialAccounts();

  const updated =
    accounts.filter(
      (item) =>
        item.id !== accountId,
    );

  saveStoredFinancialAccounts(
    updated,
  );
}

export function clearStoredFinancialAccounts(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  );
}