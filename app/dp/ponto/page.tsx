import { ModulePage } from "@/components/hrdp/ModulePage";

export default function AttendancePage() {
  return (
    <ModulePage
      eyebrow="DP · Ponto e Jornada"
      title="Ponto e Jornada"
      description="Tratamento diário de ocorrências, conferência por gestor, pente-fino do RH e fechamento da competência."
      metrics={[
        { label: "Pendências hoje", value: "—" },
        { label: "Aguardando gestor", value: "—" },
        { label: "Aguardando RH", value: "—" },
        { label: "Competência", value: "Aberta" },
      ]}
      items={[
        "Importar ou integrar marcações",
        "Detectar faltas, atrasos e marcações incompletas",
        "Gestor trata somente sua equipe",
        "Colaborador apresenta justificativa quando exigida",
        "RH confere todas as regularizações",
        "DP fecha a competência com trilha de auditoria",
      ]}
    />
  );
}
