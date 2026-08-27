import { ModulePage } from "@/components/hrdp/ModulePage";

export default function VacationsPage() {
  return (
    <ModulePage
      eyebrow="DP · Férias"
      title="Férias"
      description="Controle de períodos aquisitivos, programação, aprovações, avisos e histórico do colaborador."
      metrics={[
        { label: "A vencer", value: "—" },
        { label: "Programadas", value: "—" },
        { label: "Em aprovação", value: "—" },
        { label: "Em férias", value: "—" },
      ]}
      items={[
        "Calcular e acompanhar período aquisitivo",
        "Receber solicitação ou programação do gestor",
        "Validar disponibilidade e regras internas",
        "Aprovar e registrar período de gozo",
        "Gerar checklist documental",
        "Arquivar evento no dossiê funcional",
      ]}
    />
  );
}
