const modules = [
  ["Colaboradores", "Dossiê, vínculo e histórico funcional"],
  ["Admissões", "Checklist, documentos e onboarding"],
  ["Recrutamento", "Vagas, candidatos e etapas"],
  ["Desempenho", "Avaliações, feedback, 1:1 e PDI"],
  ["Canal RH", "Atendimento humano e privado ao colaborador"],
  ["Relatórios", "Headcount, turnover, absenteísmo e indicadores"],
];

export default function RhPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">BravHAS Pessoas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">RH</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Gestão de pessoas, desenvolvimento, comunicação e experiência do colaborador.</p>
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
