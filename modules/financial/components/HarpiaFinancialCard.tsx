interface HarpiaFinancialCardProps {
  accountType: "PAYABLE" | "RECEIVABLE";

  status: string;

  remaining: number;
}

export function HarpiaFinancialCard({
  accountType,
  status,
  remaining,
}: HarpiaFinancialCardProps) {
  const suggestion =
    status === "PAID"
      ? "Esta conta já foi liquidada. Nenhuma ação financeira é necessária."
      : remaining <= 0
        ? "O saldo restante é zero. Revise apenas os documentos anexados."
        : accountType === "PAYABLE"
          ? "Existe saldo pendente. Avalie registrar um pagamento parcial ou quitar a conta."
          : "Existe saldo pendente para recebimento. Verifique a previsão do cliente e acompanhe a cobrança.";

  return (
    <div className="rounded-2xl bg-[#0B2947] p-5 text-white shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        Harpia
      </p>

      <h3 className="mt-2 text-lg font-bold">
        Assistente Financeira
      </h3>

      <p className="mt-4 text-sm leading-6 text-white/75">
        {suggestion}
      </p>

      <div className="mt-5 rounded-xl bg-white/10 p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">
          Próxima etapa
        </p>

        <p className="mt-2 text-sm font-medium leading-6">
          Após concluirmos a baixa financeira, a Harpia passará a sugerir
          automaticamente ações como antecipação de pagamentos, contas em
          atraso, recebimentos previstos e impactos no fluxo de caixa.
        </p>
      </div>
    </div>
  );
}