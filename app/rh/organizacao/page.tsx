import { ModulePage } from "@/components/hrdp/ModulePage";

export default function OrganizationPage() {
  return <ModulePage eyebrow="RH · Organização" title="Estrutura Organizacional" description="Empresas, unidades, departamentos, cargos, centros de custo, gestores e organograma." metrics={[{label:"Empresas",value:"—"},{label:"Unidades",value:"—"},{label:"Setores",value:"—"},{label:"Cargos",value:"—"}]} items={["Cadastrar estrutura empresarial","Definir departamentos e centros de custo","Cadastrar cargos e faixas","Vincular responsáveis e gestores","Montar hierarquia organizacional","Aplicar escopo de acesso por estrutura"]} />;
}
