import { prisma } from "@/lib/prisma";
import { requireServerRole } from "@/modules/auth/server/session";

const FINANCIAL_ROLES = ["OWNER", "ADMIN", "FINANCIAL"] as const;

export async function requireFinancialActor() {
  const actor = await requireServerRole([...FINANCIAL_ROLES]);
  if (!actor) throw new Error("Autenticação financeira indisponível.");
  return actor;
}

export async function requireFinancialAccount(accountId: string) {
  const actor = await requireFinancialActor();
  const id = accountId.trim();
  if (!id) throw new Error("O identificador da conta financeira é obrigatório.");

  const account = await prisma.financialAccount.findFirst({
    where: { id, companyId: actor.companyId },
    select: { id: true, companyId: true },
  });

  if (!account) throw new Error("Conta financeira não encontrada.");
  return { actor, account };
}

export async function assertFinancialReferences(
  companyId: string,
  refs: {
    branchId?: string | null;
    costCenterId?: string | null;
    categoryId?: string | null;
    supplierId?: string | null;
    customerId?: string | null;
    bankAccountId?: string | null;
  },
) {
  const checks: Promise<unknown>[] = [];
  const labels: string[] = [];

  const add = (label: string, promise: Promise<unknown>) => {
    labels.push(label);
    checks.push(promise);
  };

  if (refs.branchId) add("Unidade", prisma.branch.findFirst({ where: { id: refs.branchId, companyId, active: true }, select: { id: true } }));
  if (refs.costCenterId) add("Centro de custo", prisma.costCenter.findFirst({ where: { id: refs.costCenterId, companyId, active: true }, select: { id: true } }));
  if (refs.categoryId) add("Categoria", prisma.financialCategory.findFirst({ where: { id: refs.categoryId, companyId, active: true }, select: { id: true } }));
  if (refs.supplierId) add("Fornecedor", prisma.supplier.findFirst({ where: { id: refs.supplierId, companyId, active: true }, select: { id: true } }));
  if (refs.customerId) add("Cliente", prisma.customer.findFirst({ where: { id: refs.customerId, companyId, active: true }, select: { id: true } }));
  if (refs.bankAccountId) add("Conta bancária", prisma.bankAccount.findFirst({ where: { id: refs.bankAccountId, companyId, active: true }, select: { id: true } }));

  const results = await Promise.all(checks);
  const invalidIndex = results.findIndex((result) => !result);
  if (invalidIndex >= 0) {
    throw new Error(`${labels[invalidIndex]} inválido(a) para a empresa autenticada.`);
  }
}
