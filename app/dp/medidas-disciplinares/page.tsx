import { ModulePage } from "@/components/hrdp/ModulePage";

export default function DisciplinaryPage() {
  return <ModulePage eyebrow="DP · Medidas disciplinares" title="Medidas disciplinares" description="Advertências, suspensões, reincidências, anexos, ciência do colaborador e trilha de auditoria." metrics={[{label:"Em análise",value:"—"},{label:"Aplicadas no mês",value:"—"},{label:"Aguardando ciência",value:"—"},{label:"Reincidências",value:"—"}]} items={["Registrar ocorrência e evidências","Validar histórico funcional","Definir medida adequada","Gerar documento e colher ciência","Registrar eventual recusa/testemunhas","Arquivar no dossiê e manter histórico"]} />;
}
