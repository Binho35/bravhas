import { requireServerRole } from "@/modules/auth/server/session";

const OBLIGATION_ROLES = ["OWNER", "ADMIN", "FINANCIAL", "HR", "PAYROLL"] as const;

export async function requireObligationActor() {
  const actor = await requireServerRole([...OBLIGATION_ROLES]);
  if (!actor) throw new Error("Autenticação de obrigações indisponível.");
  return actor;
}
