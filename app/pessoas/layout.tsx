import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { requireServerRole } from "@/modules/auth/server/session";

export default async function PessoasLayout({ children }: { children: ReactNode }) {
  try {
    await requireServerRole(["OWNER", "ADMIN"]);
  } catch (error) {
    if (error instanceof Error && ["Sessão inválida ou expirada.", "Usuário sem permissão para esta operação."].includes(error.message)) {
      notFound();
    }
    throw error;
  }

  return children;
}
