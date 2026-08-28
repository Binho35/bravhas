import { requirePermission, type RbacAction, type RbacResource } from "./rbac";

export async function authorizeHrdp(resource: RbacResource, action: RbacAction) {
  return requirePermission(resource, action);
}

export const hrdpPermission = {
  colaboradores: (action: RbacAction) => authorizeHrdp("colaboradores", action),
  admissoes: (action: RbacAction) => authorizeHrdp("admissoes", action),
  recrutamento: (action: RbacAction) => authorizeHrdp("recrutamento", action),
  desempenho: (action: RbacAction) => authorizeHrdp("desempenho", action),
  canalRh: (action: RbacAction) => authorizeHrdp("canal-rh", action),
  ponto: (action: RbacAction) => authorizeHrdp("ponto", action),
  ferias: (action: RbacAction) => authorizeHrdp("ferias", action),
  beneficios: (action: RbacAction) => authorizeHrdp("beneficios", action),
  afastamentos: (action: RbacAction) => authorizeHrdp("afastamentos", action),
  medidasDisciplinares: (action: RbacAction) => authorizeHrdp("medidas-disciplinares", action),
  desligamentos: (action: RbacAction) => authorizeHrdp("desligamentos", action),
  folha: (action: RbacAction) => authorizeHrdp("folha", action),
  organizacao: (action: RbacAction) => authorizeHrdp("organizacao", action),
  relatorios: (action: RbacAction) => authorizeHrdp("relatorios", action),
  auditoria: (action: RbacAction) => authorizeHrdp("auditoria", action),
  configuracoes: (action: RbacAction) => authorizeHrdp("configuracoes", action),
};
