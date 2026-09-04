import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "./session";

export const RBAC_RESOURCES = [
  "colaboradores",
  "admissoes",
  "recrutamento",
  "desempenho",
  "canal-rh",
  "ponto",
  "ferias",
  "beneficios",
  "afastamentos",
  "medidas-disciplinares",
  "desligamentos",
  "folha",
  "organizacao",
  "relatorios",
  "auditoria",
  "configuracoes",
] as const;

export type RbacResource = (typeof RBAC_RESOURCES)[number];
export type RbacAction = "view" | "create" | "edit" | "approve" | "delete" | "export";

type PermissionFlags = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
};

const actionColumn: Record<RbacAction, keyof PermissionFlags> = {
  view: "canView",
  create: "canCreate",
  edit: "canEdit",
  approve: "canApprove",
  delete: "canDelete",
  export: "canExport",
};

export async function requirePermission(resource: RbacResource, action: RbacAction) {
  const user = await getServerAuthUser();
  if (!user) {
    throw new Error("Sessão inválida ou expirada.");
  }

  if (user.role === "OWNER" || user.role === "ADMIN") return user;

  const assignment = await prisma.userAccessProfile.findUnique({
    where: { userId: user.id },
    include: {
      profile: {
        include: {
          permissions: {
            where: { resource },
            take: 1,
          },
        },
      },
    },
  });

  const profile = assignment?.profile;
  if (!profile || profile.companyId !== user.companyId || !profile.active) {
    throw new Error("Usuário sem permissão para esta operação.");
  }

  if (profile.master) return user;

  const permission = profile.permissions[0];
  if (!permission || !permission[actionColumn[action]]) {
    throw new Error("Usuário sem permissão para esta operação.");
  }

  return user;
}

export async function ensureDefaultAccessProfiles(companyId: string) {
  const profiles = [
    { name: "CEO", description: "Acesso master integral", master: true },
    { name: "Head Administrativo", description: "Acesso master integral", master: true },
    { name: "Gestor RH/DP", description: "Gestão ampla de RH e Departamento Pessoal", master: false },
    { name: "Analista de RH", description: "Rotinas de pessoas, recrutamento, desempenho e atendimento", master: false },
    { name: "Analista de DP", description: "Rotinas trabalhistas, ponto, férias, benefícios e folha", master: false },
    { name: "Assistente RH/DP", description: "Acesso operacional sem aprovações sensíveis", master: false },
    { name: "Gestor de Setor", description: "Acesso restrito à gestão operacional da equipe", master: false },
    { name: "Auditoria / Consulta", description: "Consulta e exportação sem alteração", master: false },
  ];

  for (const profile of profiles) {
    await prisma.accessProfile.upsert({
      where: {
        companyId_name: {
          companyId,
          name: profile.name,
        },
      },
      update: {},
      create: {
        id: randomUUID(),
        companyId,
        name: profile.name,
        description: profile.description,
        master: profile.master,
        system: true,
        active: true,
      },
    });
  }
}
