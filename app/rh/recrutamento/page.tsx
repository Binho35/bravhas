import { ModulePage } from "@/components/hrdp/ModulePage";

export default function RecruitmentPage() {
  return <ModulePage eyebrow="RH · Recrutamento" title="Recrutamento e Seleção" description="Gestão de vagas, candidatos, entrevistas, proposta e conversão para admissão." metrics={[{label:"Vagas abertas",value:"—"},{label:"Candidatos",value:"—"},{label:"Entrevistas",value:"—"},{label:"Propostas",value:"—"}]} items={["Abrir e aprovar vaga","Receber e triar candidatos","Agendar entrevistas","Registrar pareceres","Emitir proposta","Converter candidato aprovado em pré-admissão"]} />;
}
