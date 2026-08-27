import Link from "next/link";

type Metric = {
  label: string;
  value: string;
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
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/rh" className="font-semibold text-blue-700 hover:text-blue-900">
            RH
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/dp" className="font-semibold text-blue-700 hover:text-blue-900">
            DP
          </Link>
        </div>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
        </header>

        {metrics.length > 0 ? (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{metric.label}</p>
                <strong className="mt-2 block text-2xl">{metric.value}</strong>
              </article>
            ))}
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Fluxo operacional</h2>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Estrutura preparada para receber dados reais da operação.</p>
            ) : (
              <ol className="mt-5 space-y-3">
                {items.map((item, index) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-1">{item}</span>
                  </li>
                ))}
              </ol>
            )}
          </article>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Ações</h2>
            <div className="mt-5 space-y-3">
              {actions.length === 0 ? (
                <p className="text-sm text-slate-500">As ações transacionais serão habilitadas conforme cada módulo for conectado ao banco.</p>
              ) : (
                actions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                  >
                    {action.label}
                  </Link>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
