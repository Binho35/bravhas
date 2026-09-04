import { revalidatePath } from "next/cache";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccessProfiles, RBAC_RESOURCES } from "@/modules/auth/server/rbac";
import { requireMasterAccess } from "@/modules/auth/server/masterAccess";
import { auditAccessChange } from "@/modules/auth/server/rbacAudit";

type Permission = { profileId:string; resource:string; canView:boolean; canCreate:boolean; canEdit:boolean; canApprove:boolean; canDelete:boolean; canExport:boolean };

async function savePermissions(formData: FormData) {
  "use server";
  const actor = await requireMasterAccess();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await prisma.accessProfile.findFirst({
    where: { id: profileId, companyId: actor.companyId },
    select: { id: true, name: true, description: true, master: true, active: true },
  });
  if (!profile) throw new Error("Perfil não encontrado.");
  if (profile.master) throw new Error("Perfis MASTER possuem acesso integral e não podem ser restringidos.");

  await prisma.$transaction(
    RBAC_RESOURCES.map((resource) => {
      const flag = (action:string) => formData.get(`${resource}:${action}`) === "on";
      return prisma.accessPermission.upsert({
        where: { profileId_resource: { profileId, resource } },
        update: {
          canView: flag("view"),
          canCreate: flag("create"),
          canEdit: flag("edit"),
          canApprove: flag("approve"),
          canDelete: flag("delete"),
          canExport: flag("export"),
        },
        create: {
          profileId,
          resource,
          canView: flag("view"),
          canCreate: flag("create"),
          canEdit: flag("edit"),
          canApprove: flag("approve"),
          canDelete: flag("delete"),
          canExport: flag("export"),
        },
      });
    }),
  );

  await auditAccessChange({
    companyId: actor.companyId,
    actorUserId: actor.id,
    action: "ACCESS_PERMISSIONS_UPDATED",
    entityId: profileId,
    metadata: { profileName: profile.name },
  });

  revalidatePath("/rh/configuracoes/perfis");
}

export default async function AccessProfilesPage() {
  const actor = await requireMasterAccess();
  await ensureDefaultAccessProfiles(actor.companyId);
  const profiles = await prisma.accessProfile.findMany({
    where: { companyId: actor.companyId },
    orderBy: [{ master: "desc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, master: true, active: true },
  });
  const permissions: Permission[] = await prisma.accessPermission.findMany({
    where: { profile: { companyId: actor.companyId } },
    select: { profileId: true, resource: true, canView: true, canCreate: true, canEdit: true, canApprove: true, canDelete: true, canExport: true },
  });

  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-[1400px]"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><ShieldCheck /></div><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Segurança · RBAC</p><h1 className="text-3xl font-bold text-[#0b2947]">Perfis e Permissões</h1><p className="mt-1 text-sm text-slate-500">CEO e Head Administrativo são MASTER. Os demais perfis podem ser configurados por módulo e ação.</p></div></div><div className="mt-7 space-y-5">{profiles.map(profile => <form key={profile.id} action={savePermissions} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><input type="hidden" name="profileId" value={profile.id}/><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-[#0b2947]">{profile.name}</h2><p className="text-xs text-slate-500">{profile.description}</p></div>{profile.master ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">MASTER</span> : <button className="rounded-xl bg-[#0b2947] px-4 py-2 text-xs font-semibold text-white">Salvar permissões</button>}</div>{profile.master ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Acesso integral a todos os módulos e ações.</p> : <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-slate-500"><th className="p-2">Módulo</th>{["Ver","Criar","Editar","Aprovar","Excluir","Exportar"].map(x=><th key={x} className="p-2 text-center">{x}</th>)}</tr></thead><tbody>{RBAC_RESOURCES.map(resource=>{const p=permissions.find(x=>x.profileId===profile.id&&x.resource===resource);return <tr key={resource} className="border-t border-slate-100"><td className="p-2 font-semibold capitalize text-slate-700">{resource.replaceAll("-"," ")}</td>{(["view","create","edit","approve","delete","export"] as const).map(action=><td key={action} className="p-2 text-center"><input type="checkbox" name={`${resource}:${action}`} defaultChecked={p?.[`can${action[0].toUpperCase()}${action.slice(1)}` as keyof Permission] === true}/></td>)}</tr>})}</tbody></table></div>}</form>)}</div></div></main>;
}
