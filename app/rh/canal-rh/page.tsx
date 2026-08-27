import { ModulePage } from "@/components/hrdp/ModulePage";

export default function HrChannelPage() {
  return <ModulePage eyebrow="RH · Canal RH" title="Canal RH" description="Atendimento humano e privado ao colaborador, com protocolo, responsável, histórico e acompanhamento." metrics={[{label:"Abertos",value:"—"},{label:"Aguardando RH",value:"—"},{label:"Aguardando colaborador",value:"—"},{label:"Resolvidos no mês",value:"—"}]} items={["Colaborador abre solicitação","Sistema gera protocolo","RH assume o atendimento","Mensagens e anexos ficam registrados","RH resolve ou encaminha internamente","Conversa é encerrada com histórico preservado"]} />;
}
