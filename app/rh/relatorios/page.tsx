import { ModulePage } from "@/components/hrdp/ModulePage";

export default function HrReportsPage() {
  return <ModulePage eyebrow="RH · Relatórios" title="Indicadores de Pessoas" description="Visão executiva de headcount, turnover, absenteísmo, horas extras, férias, admissões, desligamentos e desenvolvimento." metrics={[{label:"Headcount",value:"—"},{label:"Turnover",value:"—"},{label:"Absenteísmo",value:"—"},{label:"Horas extras",value:"—"}]} items={["Consolidar dados por empresa, unidade e setor","Comparar períodos e tendências","Identificar desvios e pendências","Gerar visão por gestor","Exportar bases de conferência","Preservar filtros e trilha de auditoria"]} />;
}
