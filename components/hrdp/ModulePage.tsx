import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  ShieldCheck,
} from "lucide-react";

type Metric = {
  label: string;
  value: string;
  detail?: string;
};

type Action = {
  label: string;
  href: string;
};

type ModulePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: Metric[];
  actions?: Action[];
  items?: string[];
};

export function ModulePage({
  eyebrow,
  title,
  description,
  metrics = [],
  actions = [],
  items = [],
}: ModulePageProps) {
  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/pessoas" className="transition hover:text-[#154b7a]">Pessoas</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700">{eyebrow}</span>
        </div>

        <header className="mt-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#0b2947] via-[#103d65] to-[#154b7a] px-6 py-7 text-white shadow-[0_18px_50px_rgba(11,41,71,0.18)] md:px-8 md:py-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                <CircleDot className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100 md:text-[15px]">{description}</p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-xs text-blue-100">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Processo rastreável e auditável
            </div>
          </div>
        </header>

        {metrics.length > 0 ? (
          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                    <strong className="mt-2 block text-2xl font-bold tracking-tight text-[#0b2947]">{metric.value}</strong>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]">
                    <CheckCircle2 className="h-[18px] w-[18px]" />
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-slate-400">{metric.detail ?? "Atualização conforme dados operacionais"}</p>
              </article>
            ))}
          </section>
        ) : null}

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_390px]">
          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Operação</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Fluxo operacional</h2>
              </div>
              <Clock3 className="h-5 w-5 text-slate-300" />
            </div>

            {items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <CircleDot className="h-5 w-5" />
                </div>
                <p className="mt-4 font-semibold text-slate-700">Fluxo preparado</p>
                <p className="mt-2 text-sm text-slate-500">Este módulo está pronto para receber os dados reais da operação.</p>
              </div>
            ) : (
              <ol className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <li key={item} className="group flex gap-4 px-6 py-5 transition hover:bg-slate-50/80">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3fb] text-xs font-bold text-[#154b7a]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-6 text-slate-700">{item}</p>
                      <p className="mt-1 text-[11px] text-slate-400">Etapa controlada pelo fluxo do módulo</p>
                    </div>
                    <ArrowUpRight className="mt-2 h-4 w-4 text-slate-300 transition group-hover:text-[#154b7a]" />
                  </li>
                ))}
              </ol>
            )}
          </article>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Ações rápidas</p>
              <h2 className="mt-1 text-lg font-bold">O que você precisa fazer?</h2>
              <div className="mt-5 space-y-2.5">
                {actions.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">As ações transacionais serão liberadas conforme os registros forem conectados ao banco.</p>
                ) : (
                  actions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-[#f4f9fd] hover:text-[#0b2947]"
                    >
                      {action.label}
                      <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#154b7a]" />
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">Governança</p>
              <h3 className="mt-2 font-bold text-[#0b2947]">Histórico preservado</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Movimentações críticas devem manter responsável, data, justificativa e documentos vinculados ao registro.</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
