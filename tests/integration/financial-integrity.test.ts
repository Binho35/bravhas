import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "../../lib/prisma";
import { RegisterPaymentUseCase } from "../../modules/financial/application/use-cases/RegisterPaymentUseCase";
import { RegisterReceiptUseCase } from "../../modules/financial/application/use-cases/RegisterReceiptUseCase";
import { ReversePaymentUseCase } from "../../modules/financial/application/use-cases/ReversePaymentUseCase";
import { ReverseReceiptUseCase } from "../../modules/financial/application/use-cases/ReverseReceiptUseCase";
import { CancelFinancialAccountUseCase } from "../../modules/financial/application/use-cases/CancelFinancialAccountUseCase";
import { runFinancialTransaction } from "../../modules/financial/infrastructure/financialTransaction";
import { calculateCashFlow, type CashFlowAccount } from "../../modules/financial/services/calculateCashFlow";
import type { FinancialTransaction } from "../../modules/financial/types/FinancialTransaction";

const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const companyId = `FIT-COMP-${suffix}`;
const branchId = `FIT-BRANCH-${suffix}`;
const userId = `FIT-USER-${suffix}`;
const accountIds: string[] = [];

async function setupTenant() {
  await prisma.company.create({ data: { id: companyId, prefix: `FIT-${suffix}`.slice(0, 48), name: "Financial Integrity Tenant" } });
  await prisma.branch.create({ data: { id: branchId, companyId, name: "Financial Integrity HQ" } });
  await prisma.user.create({
    data: {
      id: userId,
      companyId,
      branchId,
      companyPrefix: "fit",
      username: "owner",
      loginId: `fit-${suffix}`,
      name: "Financial Integrity Owner",
      email: `fit-${suffix}@example.test`,
      role: "OWNER",
    },
  });
}

async function createAccount(type: "PAYABLE" | "RECEIVABLE", amount = 100) {
  const id = `FIT-${type}-${accountIds.length}-${suffix}`;
  accountIds.push(id);
  return prisma.financialAccount.create({
    data: {
      id,
      companyId,
      branchId,
      type,
      status: "OPEN",
      description: `${type} integration account`,
      issueDate: new Date("2026-09-01T12:00:00.000Z"),
      dueDate: new Date("2026-09-20T12:00:00.000Z"),
      amount,
      paidAmount: 0,
      discount: 0,
      interest: 0,
      fine: 0,
      createdBy: userId,
    },
  });
}

async function readAccount(id: string) {
  return prisma.financialAccount.findUniqueOrThrow({ where: { id } });
}

async function transactions(id: string) {
  return prisma.financialTransaction.findMany({ where: { accountId: id }, orderBy: { performedAt: "asc" } });
}

async function cleanup() {
  await prisma.financialTransaction.deleteMany({ where: { accountId: { in: accountIds } } });
  await prisma.financialAccount.deleteMany({ where: { companyId } });
  await prisma.user.deleteMany({ where: { companyId } });
  await prisma.branch.deleteMany({ where: { companyId } });
  await prisma.company.deleteMany({ where: { id: companyId } });
}

async function payment(accountId: string, amount: number, operationId: string, paidBy = userId) {
  return runFinancialTransaction(({ accountRepository, transactionRepository }) =>
    new RegisterPaymentUseCase(accountRepository, transactionRepository).execute({
      accountId,
      amount,
      paidBy,
      paymentDate: new Date("2026-09-10T15:00:00.000Z"),
      operationId,
    }),
  );
}

async function receipt(accountId: string, amount: number, operationId: string, receivedBy = userId) {
  return runFinancialTransaction(({ accountRepository, transactionRepository }) =>
    new RegisterReceiptUseCase(accountRepository, transactionRepository).execute({
      accountId,
      amount,
      receivedBy,
      receiptDate: new Date("2026-09-11T15:00:00.000Z"),
      operationId,
    }),
  );
}

async function reversePayment(accountId: string, amount: number | undefined, operationId: string, reversedBy = userId) {
  return runFinancialTransaction(({ accountRepository, transactionRepository }) =>
    new ReversePaymentUseCase(accountRepository, transactionRepository).execute({
      accountId,
      amount,
      reversedBy,
      reversalDate: new Date("2026-09-12T15:00:00.000Z"),
      operationId,
    }),
  );
}

async function reverseReceipt(accountId: string, amount: number | undefined, operationId: string, reversedBy = userId) {
  return runFinancialTransaction(({ accountRepository, transactionRepository }) =>
    new ReverseReceiptUseCase(accountRepository, transactionRepository).execute({
      accountId,
      amount,
      reversedBy,
      reversalDate: new Date("2026-09-12T16:00:00.000Z"),
      operationId,
    }),
  );
}

async function cancel(accountId: string, operationId: string, canceledBy = userId) {
  return runFinancialTransaction(({ accountRepository, transactionRepository }) =>
    new CancelFinancialAccountUseCase(accountRepository, transactionRepository).execute({
      accountId,
      canceledBy,
      cancellationDate: new Date("2026-09-13T15:00:00.000Z"),
      operationId,
    }),
  );
}

function netSettlement(history: Array<{ type: string; amount: unknown }>, settlementType: "PAYMENT" | "RECEIPT") {
  const gross = history.filter((item) => item.type === settlementType).reduce((sum, item) => sum + Number(item.amount), 0);
  const reversed = history.filter((item) => item.type === "REVERSAL").reduce((sum, item) => sum + Number(item.amount), 0);
  return Number((gross - reversed).toFixed(2));
}

test("financial integrity: mutation and history are atomic, idempotent and concurrency-safe", async (t) => {
  await cleanup();
  await setupTenant();

  try {
    await t.test("payment supports partial/full settlement, idempotency and business guards", async () => {
      const account = await createAccount("PAYABLE", 100);
      const first = await payment(account.id, 40, `FIT-PAY-1-${suffix}`);
      assert.equal(first.account.data.paidAmount, 40);
      assert.equal(first.fullyPaid, false);
      assert.equal(first.remaining, 60);

      const repeated = await payment(account.id, 40, `FIT-PAY-1-${suffix}`);
      assert.equal(repeated.transactionId, first.transactionId);
      assert.equal(Number((await readAccount(account.id)).paidAmount), 40);
      assert.equal((await transactions(account.id)).filter((item) => item.type === "PAYMENT").length, 1);

      await assert.rejects(payment(account.id, 20, `FIT-PAY-1-${suffix}`), /já utilizado com dados diferentes/);
      await assert.rejects(payment(account.id, 70, `FIT-PAY-OVER-${suffix}`), /maior que o saldo restante/);
      assert.equal(Number((await readAccount(account.id)).paidAmount), 40);

      const full = await payment(account.id, 60, `FIT-PAY-2-${suffix}`);
      assert.equal(full.fullyPaid, true);
      assert.equal((await readAccount(account.id)).status, "PAID");
      await assert.rejects(payment(account.id, 1, `FIT-PAY-PAID-${suffix}`), /não permite um novo pagamento/);

      const canceled = await createAccount("PAYABLE", 50);
      await cancel(canceled.id, `FIT-CANCEL-BEFORE-PAY-${suffix}`);
      await assert.rejects(payment(canceled.id, 10, `FIT-PAY-CANCELED-${suffix}`), /não permite um novo pagamento/);
    });

    await t.test("payment history failure rolls the account mutation back", async () => {
      const account = await createAccount("PAYABLE", 100);
      await assert.rejects(payment(account.id, 25, `FIT-PAY-ROLLBACK-${suffix}`, `MISSING-USER-${suffix}`));
      const stored = await readAccount(account.id);
      assert.equal(Number(stored.paidAmount), 0);
      assert.equal(stored.status, "OPEN");
      assert.equal((await transactions(account.id)).length, 0);
    });

    await t.test("receipt is atomic/idempotent and history failure rolls back", async () => {
      const account = await createAccount("RECEIVABLE", 100);
      const first = await receipt(account.id, 100, `FIT-REC-1-${suffix}`);
      assert.equal(first.fullyReceived, true);
      const repeated = await receipt(account.id, 100, `FIT-REC-1-${suffix}`);
      assert.equal(repeated.transactionId, first.transactionId);
      assert.equal((await transactions(account.id)).filter((item) => item.type === "RECEIPT").length, 1);

      const rollback = await createAccount("RECEIVABLE", 80);
      await assert.rejects(receipt(rollback.id, 30, `FIT-REC-ROLLBACK-${suffix}`, `MISSING-USER-${suffix}`));
      const stored = await readAccount(rollback.id);
      assert.equal(Number(stored.paidAmount), 0);
      assert.equal(stored.status, "OPEN");
      assert.equal((await transactions(rollback.id)).length, 0);
    });

    await t.test("payment and receipt reversals stay atomic, idempotent and rollback-safe", async () => {
      const payable = await createAccount("PAYABLE", 100);
      await payment(payable.id, 100, `FIT-PAY-REV-BASE-${suffix}`);
      const payReversal = await reversePayment(payable.id, 40, `FIT-PAY-REV-${suffix}`);
      assert.equal(payReversal.remainingPaidAmount, 60);
      const payRepeated = await reversePayment(payable.id, 40, `FIT-PAY-REV-${suffix}`);
      assert.equal(payRepeated.transactionId, payReversal.transactionId);
      assert.equal(Number((await readAccount(payable.id)).paidAmount), 60);
      const beforePayRollback = (await transactions(payable.id)).length;
      await assert.rejects(reversePayment(payable.id, 20, `FIT-PAY-REV-ROLLBACK-${suffix}`, `MISSING-USER-${suffix}`));
      assert.equal(Number((await readAccount(payable.id)).paidAmount), 60);
      assert.equal((await transactions(payable.id)).length, beforePayRollback);

      const receivable = await createAccount("RECEIVABLE", 100);
      await receipt(receivable.id, 100, `FIT-REC-REV-BASE-${suffix}`);
      const recReversal = await reverseReceipt(receivable.id, 35, `FIT-REC-REV-${suffix}`);
      assert.equal(recReversal.remainingReceivedAmount, 65);
      const recRepeated = await reverseReceipt(receivable.id, 35, `FIT-REC-REV-${suffix}`);
      assert.equal(recRepeated.transactionId, recReversal.transactionId);
      assert.equal(Number((await readAccount(receivable.id)).paidAmount), 65);
      const beforeRecRollback = (await transactions(receivable.id)).length;
      await assert.rejects(reverseReceipt(receivable.id, 15, `FIT-REC-REV-ROLLBACK-${suffix}`, `MISSING-USER-${suffix}`));
      assert.equal(Number((await readAccount(receivable.id)).paidAmount), 65);
      assert.equal((await transactions(receivable.id)).length, beforeRecRollback);
    });

    await t.test("cancellation state and history commit or rollback together", async () => {
      const account = await createAccount("PAYABLE", 75);
      const result = await cancel(account.id, `FIT-CANCEL-${suffix}`);
      assert.equal(result.account.data.status, "CANCELED");
      assert.equal((await transactions(account.id)).filter((item) => item.type === "CANCELLATION").length, 1);
      const repeated = await cancel(account.id, `FIT-CANCEL-${suffix}`);
      assert.equal(repeated.transactionId, result.transactionId);
      assert.equal((await transactions(account.id)).filter((item) => item.type === "CANCELLATION").length, 1);

      const rollback = await createAccount("PAYABLE", 70);
      await assert.rejects(cancel(rollback.id, `FIT-CANCEL-ROLLBACK-${suffix}`, `MISSING-USER-${suffix}`));
      assert.equal((await readAccount(rollback.id)).status, "OPEN");
      assert.equal((await transactions(rollback.id)).length, 0);
    });

    await t.test("concurrent payments cannot produce a double financial effect", async () => {
      const account = await createAccount("PAYABLE", 100);
      const results = await Promise.allSettled([
        payment(account.id, 60, `FIT-CONCURRENT-A-${suffix}`),
        payment(account.id, 60, `FIT-CONCURRENT-B-${suffix}`),
      ]);
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      assert.equal(results.filter((result) => result.status === "rejected").length, 1);
      assert.equal(Number((await readAccount(account.id)).paidAmount), 60);
      assert.equal((await transactions(account.id)).filter((item) => item.type === "PAYMENT").length, 1);
    });

    await t.test("account history invariants and cash flow remain consistent after reversals", async () => {
      const payable = await createAccount("PAYABLE", 100);
      const receivable = await createAccount("RECEIVABLE", 200);
      await payment(payable.id, 100, `FIT-CASH-PAY-${suffix}`);
      await reversePayment(payable.id, 40, `FIT-CASH-PAY-REV-${suffix}`);
      await receipt(receivable.id, 150, `FIT-CASH-REC-${suffix}`);
      await reverseReceipt(receivable.id, 50, `FIT-CASH-REC-REV-${suffix}`);

      const payableStored = await readAccount(payable.id);
      const receivableStored = await readAccount(receivable.id);
      const payableHistory = await transactions(payable.id);
      const receivableHistory = await transactions(receivable.id);
      assert.equal(netSettlement(payableHistory, "PAYMENT"), Number(payableStored.paidAmount));
      assert.equal(netSettlement(receivableHistory, "RECEIPT"), Number(receivableStored.paidAmount));

      const cashAccounts: CashFlowAccount[] = [payableStored, receivableStored].map((account) => ({
        id: account.id,
        type: account.type,
        status: account.status,
        dueDate: account.dueDate.toISOString(),
        amount: Number(account.amount),
        paidAmount: Number(account.paidAmount),
        discount: Number(account.discount),
        interest: Number(account.interest),
        fine: Number(account.fine),
      }));
      const cashTransactions: FinancialTransaction[] = [...payableHistory, ...receivableHistory].map((item) => ({
        id: item.id,
        accountId: item.accountId,
        type: item.type,
        amount: Number(item.amount),
        performedBy: item.performedBy,
        performedAt: item.performedAt.toISOString(),
        notes: item.notes,
      }));
      const summary = calculateCashFlow({
        accounts: cashAccounts,
        transactions: cashTransactions,
        openingBalance: 0,
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      });
      assert.equal(summary.totalPaid, 60);
      assert.equal(summary.totalReceived, 100);
      assert.equal(summary.totalPayable, 40);
      assert.equal(summary.totalReceivable, 100);
      assert.equal(summary.projectedBalance, 60);
    });
  } finally {
    await cleanup();
  }
});
