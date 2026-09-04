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

type PermissionRow = {
  master: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
};

const actionColumn: Record<RbacAction, keyof PermissionRow> = {
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

  const rows = await prisma.$queryRaw<PermissionRow[]>`
    SELECT
      p."master",
      a."canView",
      a."canCreate",
      a."canEdit",
      a."canApprove",
      a."canDelete",
      a."canExport"
    FROM "UserAccessProfile" u
    JOIN "AccessProfile" p ON p."id" = u."profileId"
    LEFT JOIN "AccessPermission" a
      ON a."profileId" = p."id" AND a."resource" = ${resource}
    WHERE u."userId" = ${user.id}
      AND p."companyId" = ${user.companyId}
      AND p."active" = true
    LIMIT 1
  `;

  const permission = rows[0];
  if (!permission || (!permission.master && !permission[actionColumn[action]])) {
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
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "AccessProfile" (
        "id", "companyId", "name", "description", "master", "system", "active", "updatedAt"
      )
      VALUES (
        ${id}, ${companyId}, ${profile.name}, ${profile.description}, ${profile.master}, true, true, NOW()
      )
      ON CONFLICT ("companyId", "name") DO NOTHING
    `;
  }
}
