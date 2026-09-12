import Link from "next/link";

import { hrdpPermission } from "@/modules/auth/server/hrdpPermissions";

export default async function OrganizationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await hrdpPermission.organizacao("view");
  return <>
    <nav aria-label="Cadastros organizacionais" className="border-b border-slate-200 bg-white px-4 py-3 md:px-7">
      <div className="mx-auto flex max-w-[1240px] flex-wrap gap-2 text-xs font-semibold">
        <Link href="/rh/organizacao" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Visão geral</Link>
        <Link href="/rh/organizacao/departamentos" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Editar departamentos</Link>
        <Link href="/rh/organizacao/cargos" className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:text-[#154b7a]">Editar cargos</Link>
      </div>
    </nav>
    {children}
  </>;
}
