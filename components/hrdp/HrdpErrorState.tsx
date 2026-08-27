"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export function HrdpErrorState({
  error,
  reset,
  area = "RH/DP",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  area?: string;
}) {
  const isDatabaseError = /P10\d\d|Prisma|database|ECONNREFUSED|Can't reach database/i.test(
    error.message,
  );

  return (
    <main className="min-h-[70vh] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">
          BravHAS · {area}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0b2947]">
          Não foi possível concluir esta operação.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {isDatabaseError
            ? "A aplicação não conseguiu acessar a base de dados neste momento. Seus dados não foram apagados. Verifique a conexão do ambiente e tente novamente."
            : "O BravHAS encontrou uma falha inesperada nesta tela. A operação foi interrompida para preservar a integridade dos dados."}
        </p>

        {error.digest ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
            Referência: {error.digest}
          </p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white transition hover:bg-[#154b7a]"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
