const modules = [
  ["Ponto e Jornada", "Ocorrências, tratamento, conferência e fechamento"],
  ["Férias", "Período aquisitivo, programação, aprovação e documentos"],
  ["Benefícios", "VT, VR/VA, inclusão, exclusão e custos"],
  ["Folha", "Variáveis, conferência e fechamento da competência"],
  ["Afastamentos", "Atestados, licenças, retorno e histórico"],
  ["Desligamentos", "Checklist, documentos, benefícios e encerramentos"],
];

export default function DpPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">BravHAS Pessoas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Departamento Pessoal</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Rotinas trabalhistas, jornada, benefícios, afastamentos e fechamento operacional.</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Em construção</div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
