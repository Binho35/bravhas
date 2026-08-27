import { ModulePage } from "@/components/hrdp/ModulePage";

export default function PerformancePage() {
  return <ModulePage eyebrow="RH · Desempenho" title="Desempenho e Desenvolvimento" description="Avaliações, feedbacks, 1:1, PDI e acompanhamento do desenvolvimento individual." metrics={[{label:"Avaliações abertas",value:"—"},{label:"1:1 pendentes",value:"—"},{label:"PDIs ativos",value:"—"},{label:"Concluídos",value:"—"}]} items={["Definir ciclo e público","Aplicar avaliação","Consolidar resultado","Realizar feedback","Criar PDI e metas","Acompanhar evolução e treinamentos"]} />;
}
