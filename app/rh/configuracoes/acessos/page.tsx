import { revalidatePath } from "next/cache";
import { UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccessProfiles } from "@/modules/auth/server/rbac";
import { requireMasterAccess } from "@/modules/auth/server/masterAccess";
import { auditAccessChange } from "@/modules/auth/server/rbacAudit";

async function assignProfile(formData:FormData){
  "use server";
  const actor=await requireMasterAccess();
  const userId=String(formData.get("userId")??"");
  const profileId=String(formData.get("profileId")??"");
  const [user,profile]=await Promise.all([
    prisma.user.findFirst({where:{id:userId,companyId:actor.companyId,active:true},select:{id:true}}),
    prisma.accessProfile.findFirst({where:{id:profileId,companyId:actor.companyId,active:true},select:{id:true,name:true}}),
  ]);
  if(!user||!profile)throw new Error("Usuário ou perfil inválido.");
  await prisma.userAccessProfile.upsert({
    where:{userId},
    update:{profileId},
    create:{userId,profileId},
  });
  await auditAccessChange({companyId:actor.companyId,actorUserId:actor.id,action:"ACCESS_PROFILE_ASSIGNED",entityId:userId,metadata:{profileId,profileName:profile.name}});
  revalidatePath("/rh/configuracoes/acessos");
}

export default async function UserAccessPage(){
  const actor=await requireMasterAccess();
  await ensureDefaultAccessProfiles(actor.companyId);
  const [profiles,users]=await Promise.all([
    prisma.accessProfile.findMany({
      where:{companyId:actor.companyId,active:true},
      orderBy:[{master:"desc"},{name:"asc"}],
      select:{id:true,name:true,master:true},
    }),
    prisma.user.findMany({
      where:{companyId:actor.companyId,active:true},
      orderBy:{name:"asc"},
      select:{
        id:true,name:true,email:true,role:true,
        accessProfile:{select:{profileId:true,profile:{select:{name:true}}}},
      },
    }),
  ]);
  return <main className="px-4 py-6 md:px-7 md:py-8"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><UsersRound/></div><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#154b7a]">Segurança · Usuários</p><h1 className="text-3xl font-bold text-[#0b2947]">Acessos dos profissionais</h1><p className="mt-1 text-sm text-slate-500">Atribua a cada profissional um perfil. CEO e Head Administrativo operam como MASTER de negócio; OWNER/ADMIN permanecem MASTER técnicos.</p></div></div><section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{users.map(user=>{const profileId=user.accessProfile?.profileId??"";const profileName=user.accessProfile?.profile.name??null;return <form key={user.id} action={assignProfile} className="grid gap-3 p-5 md:grid-cols-[1fr_220px_110px] md:items-center"><input type="hidden" name="userId" value={user.id}/><div><p className="font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email} · papel técnico {user.role}{profileName?` · ${profileName}`:""}</p></div><select name="profileId" defaultValue={profileId} required className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Selecione o perfil</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}{p.master?" · MASTER":""}</option>)}</select><button className="h-10 rounded-xl bg-[#0b2947] text-xs font-semibold text-white">Aplicar</button></form>})}</div></section></div></main>;
}
