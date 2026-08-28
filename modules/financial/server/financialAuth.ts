import { prisma } from "@/lib/prisma";
import { requireServerRole } from "@/modules/auth/server/session";

const FINANCIAL_ROLES = ["OWNER", "ADMIN", "FINANCIAL"] as const;

export async function requireFinancialActor() {
  const actor = await requireServerRole([...FINANCIAL_ROLES]);
  if (!actor) {
    throw new Error("Autenticação financeira indisponível.");
  }
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
