import type { RbacAction, RbacResource } from "./rbac";

export type ProfessionalProfileName = "CEO"|"Head Administrativo"|"Gestor RH/DP"|"Analista de RH"|"Analista de DP"|"Assistente RH/DP"|"Gestor de Setor"|"Auditoria / Consulta";

export const MASTER_PROFILES: ProfessionalProfileName[] = ["CEO","Head Administrativo"];

export const SENSITIVE_RESOURCES: RbacResource[] = ["folha","medidas-disciplinares","desligamentos","auditoria","configuracoes"];

export const RBAC_ACTION_LABELS: Record<RbacAction,string> = {
  view:"Visualizar", create:"Criar", edit:"Editar", approve:"Aprovar", delete:"Excluir", export:"Exportar",
};

export const RBAC_RESOURCE_LABELS: Record<RbacResource,string> = {
  colaboradores:"Colaboradores", admissoes:"Admissões", recrutamento:"Recrutamento", desempenho:"Desempenho", "canal-rh":"Canal RH", ponto:"Ponto e jornada", ferias:"Férias", beneficios:"Benefícios", afastamentos:"Afastamentos", "medidas-disciplinares":"Medidas disciplinares", desligamentos:"Desligamentos", folha:"Folha", organizacao:"Estrutura organizacional", relatorios:"Relatórios", auditoria:"Auditoria", configuracoes:"Configurações e segurança",
};
