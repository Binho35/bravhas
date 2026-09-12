import Link from "next/link";
import { notFound } from "next/navigation";

import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";
import { assertEmployeeScope } from "@/modules/auth/server/rbacPolicy";

function isScopeDenial(error: unknown) {
  if (!(error instanceof Error)) return false;
  return [
    "Colaborador fora do escopo autorizado.",
    "Usuário operacional sem vínculo funcional configurado.",
    "Colaborador fora da equipe autorizada para este gestor.",
  ].includes(error.message);
}

export default async function EmployeeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ employeeId: string }>;
}>) {
  await hrdpPermission.colaboradores("view");
  const { employeeId } = await params;

  try {
    await assertEmployeeScope(employeeId);
  } catch (error) {
    if (isScopeDenial(error)) notFound();
    throw error;
  }

  let canEdit = true;
  try {
    await hrdpPermission.colaboradores("edit");
  } catch {
    canEdit = false;
  }

  return (
    <>
      <nav aria-label="Navegação do dossiê" className="border-b border-slate-200 bg-white px-4 py-3 md:px-7">
        <div className="mx-auto flex max-w-[1360px] flex-wrap gap-2 text-xs font-semibold">
          <Link href={`/rh/colaboradores/${employeeId}`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:border-blue-200 hover:text-[#154b7a]">Dossiê</Link>
          <Link href={`/rh/colaboradores/${employeeId}/documentos`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:border-blue-200 hover:text-[#154b7a]">Documentos</Link>
          {canEdit ? <Link href={`/rh/colaboradores/${employeeId}/editar`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:border-blue-200 hover:text-[#154b7a]">Editar cadastro</Link> : null}
          <Link href={`/rh/colaboradores/${employeeId}/historico`} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:border-blue-200 hover:text-[#154b7a]">Histórico auditável</Link>
        </div>
      </nav>
      {children}
    </>
  );
}
