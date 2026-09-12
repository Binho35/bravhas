import type { FinancialTransactionRepository } from "./repositories/FinancialTransactionRepository";
import type { FinancialTransaction, FinancialTransactionType } from "../types/FinancialTransaction";
import { roundCurrency } from "../utils/currency";

export const FINANCIAL_OPERATION_ID_INVALID = "Identificador da operação financeira inválido.";
export const FINANCIAL_OPERATION_ID_REUSED = "Identificador de operação financeira já utilizado com dados diferentes.";

export function normalizeFinancialOperationId(operationId?: string): string | undefined {
  if (operationId === undefined) return undefined;
  const normalized = operationId.trim();
  if (!normalized || normalized.length > 128) throw new Error(FINANCIAL_OPERATION_ID_INVALID);
  return normalized;
}

export async function findExistingFinancialOperation(
  repository: FinancialTransactionRepository,
  operationId: string | undefined,
  expected: {
    accountId: string;
    type: FinancialTransactionType;
    amount?: number;
  },
): Promise<FinancialTransaction | null> {
  if (!operationId) return null;
  const existing = await repository.findById(operationId);
  if (!existing) return null;

  const amountMatches =
    expected.amount === undefined || roundCurrency(existing.amount) === roundCurrency(expected.amount);
  if (existing.accountId !== expected.accountId || existing.type !== expected.type || !amountMatches) {
    throw new Error(FINANCIAL_OPERATION_ID_REUSED);
  }
  return existing;
}
