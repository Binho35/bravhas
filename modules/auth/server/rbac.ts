import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { AuthUserRole } from "../types/AuthUser";
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
export type HrdpDepartment = "RH" | "DP";

type PermissionFlags = {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
};

const RH_RESOURCES: readonly RbacResource[] = [
  "colaboradores",
  "admissoes",
  "recrutamento",
  "desempenho",
  "canal-rh",
  "organizacao",
  "relatorios",
  "auditoria",
  "configuracoes",
];

const DP_RESOURCES: readonly RbacResource[] = [
  "ponto",
  "ferias",
  "beneficios",
  "afastamentos",
  "medidas-disciplinares",
  "desligamentos",
  "folha",
];

const actionColumn: Record<RbacAction, keyof PermissionFlags> = {
  view: "canView",
  create: "canCreate",
  edit: "canEdit",
  approve: "canApprove",
  delete: "canDelete",
  export: "canExport",
};

function resourcesForDepartment(department: HrdpDepartment) {
  return department === "RH" ? RH_RESOURCES : DP_RESOURCES;
}

export function roleAllowsHrdpDepartment(role: AuthUserRole, department: HrdpDepartment): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  if (department === "RH") return role === "HR";
  return role === "PAYROLL";
}

export function roleAllowsHrdpResource(role: AuthUserRole, resource: RbacResource): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  if (role === "HR") return RH_RESOURCES.includes(resource);
  if (role === "PAYROLL") return DP_RESOURCES.includes(resource);
  return false;
}

async function operationalProfileAllowsDepartment(userId: string, companyId: string, department: HrdpDepartment) {
  const assignment = await prisma.userAccessProfile.findUnique({
    where: { userId },
    include: {
      profile: {
        include: {
          permissions: {
            where: { resource: { in: [...resourcesForDepartment(department)] }, canView: true },
            take: 1,
          },
        },
      },
    },
  });
  return Boolean(assignment?.profile.active && assignment.profile.companyId === companyId && assignment.profile.permissions.length > 0);
}

export async function requireHrdpDepartment(department: HrdpDepartment) {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");
  const role = user.role as AuthUserRole;

  if (roleAllowsHrdpDepartment(role, department)) return user;
  if (role === "OPERATIONAL" && await operationalProfileAllowsDepartment(user.id, user.companyId, department)) return user;

  throw new Error("Usuário sem permissão para esta área.");
}

export async function requirePermission(resource: RbacResource, action: RbacAction) {
  const user = await getServerAuthUser();
  if (!user) throw new Error("Sessão inválida ou expirada.");

  const role = user.role as AuthUserRole;
  if (role === "OWNER" || role === "ADMIN") return user;
  if (role === "FINANCIAL") throw new Error("Usuário sem permissão para esta operação.");
  if (role !== "OPERATIONAL" && !roleAllowsHrdpResource(role, resource)) {
    throw new Error("Usuário sem permissão para esta operação.");
  }

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
      where: { companyId_name: { companyId, name: profile.name } },
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
