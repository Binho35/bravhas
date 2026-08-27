import { ModulePage } from "@/components/hrdp/ModulePage";

export default function LeavesPage() {
  return <ModulePage eyebrow="DP · Afastamentos" title="Afastamentos" description="Atestados, licenças, afastamentos previdenciários, retorno e histórico funcional." metrics={[{label:"Ativos",value:"—"},{label:"Atestados no mês",value:"—"},{label:"Retornos próximos",value:"—"},{label:"Pendências",value:"—"}]} items={["Receber documento ou solicitação","Classificar tipo e período","Conferir documentação","Registrar afastamento","Acompanhar retorno e pendências","Arquivar no dossiê com auditoria"]} />;
}
