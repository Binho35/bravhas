import { ModulePage } from "@/components/hrdp/ModulePage";

export default function PayrollPage() {
  return <ModulePage eyebrow="DP · Folha" title="Folha e Fechamento" description="Preparação, conferência e fechamento das variáveis que alimentam a folha, sem substituir inicialmente o motor de cálculo contábil." metrics={[{label:"Competência",value:"Aberta"},{label:"Variáveis pendentes",value:"—"},{label:"Conferências",value:"—"},{label:"Fechamento",value:"—"}]} items={["Consolidar ponto, HE, faltas e afastamentos","Conferir benefícios e descontos","Registrar variáveis manuais autorizadas","Gerar base de conferência","Aprovar fechamento da competência","Arquivar evidências e histórico"]} />;
}
