import { ModulePage } from "@/components/hrdp/ModulePage";

export default function AdmissionsPage() {
  return (
    <ModulePage
      eyebrow="RH · Admissões"
      title="Admissões"
      description="Pipeline completo da contratação até a liberação do colaborador para início das atividades."
      metrics={[
        { label: "Em pré-admissão", value: "—" },
        { label: "Documentos pendentes", value: "—" },
        { label: "Inícios próximos", value: "—" },
        { label: "Concluídas no mês", value: "—" },
      ]}
      items={[
        "Candidato aprovado e proposta aceita",
        "Coleta e conferência de documentos",
        "Cadastro de vínculo, cargo, jornada e gestor",
        "Inclusão de benefícios e acessos",
        "Onboarding e treinamentos obrigatórios",
        "Liberação final para início",
      ]}
    />
  );
}
