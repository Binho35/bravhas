import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { requireFinancialActor } from "@/modules/financial/server/financialAuth";

export default async function FinancialLayout({ children }: { children: ReactNode }) {
  try {
    await requireFinancialActor();
  } catch (error) {
    if (error instanceof Error && ["Sessão inválida ou expirada.", "Usuário sem permissão para esta operação.", "Autenticação financeira indisponível."].includes(error.message)) {
      notFound();
    }
    throw error;
  }

  return children;
}
