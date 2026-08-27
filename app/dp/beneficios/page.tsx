import { ModulePage } from "@/components/hrdp/ModulePage";

export default function BenefitsPage() {
  return <ModulePage eyebrow="DP · Benefícios" title="Benefícios" description="Gestão de VT, VR/VA e demais benefícios, com movimentações, custos e conferência mensal." metrics={[{label:"Ativos",value:"—"},{label:"Inclusões",value:"—"},{label:"Exclusões",value:"—"},{label:"Custo mensal",value:"—"}]} items={["Cadastrar benefício e fornecedor","Vincular benefício ao colaborador","Controlar inclusões e exclusões","Conferir dias elegíveis e saldos","Gerar base mensal para compra","Registrar custo e histórico"]} />;
}
