import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { PeopleShell } from "@/components/hrdp/PeopleShell";
import { requireHrdpDepartment } from "@/modules/auth/server/rbac";

function isAccessDenial(error: unknown) {
  return error instanceof Error && ["Sessão inválida ou expirada.", "Usuário sem permissão para esta área."].includes(error.message);
}

export default async function DpLayout({ children }: { children: ReactNode }) {
  try {
    await requireHrdpDepartment("DP");
  } catch (error) {
    if (isAccessDenial(error)) notFound();
    throw error;
  }

  return <PeopleShell>{children}</PeopleShell>;
}
