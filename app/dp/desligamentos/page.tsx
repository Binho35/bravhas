import { ModulePage } from "@/components/hrdp/ModulePage";

export default function TerminationsPage() {
  return <ModulePage eyebrow="DP · Desligamentos" title="Desligamentos" description="Fluxo completo de solicitação, aprovação, documentação, benefícios, acessos e encerramento do vínculo." metrics={[{label:"Em andamento",value:"—"},{label:"Pendentes",value:"—"},{label:"Concluídos no mês",value:"—"},{label:"Acessos a encerrar",value:"—"}]} items={["Solicitar e aprovar desligamento","Definir data e motivo","Preparar checklist documental","Encerrar benefícios e acessos","Registrar devolução de equipamentos","Arquivar evento e finalizar dossiê"]} />;
}
