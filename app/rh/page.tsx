import Link from "next/link";

const modules = [
  ["Colaboradores", "Dossiê, vínculo e histórico funcional", "/rh/colaboradores"],
  ["Admissões", "Checklist, documentos e onboarding", "/rh/admissoes"],
  ["Recrutamento", "Vagas, candidatos e etapas", "/rh/recrutamento"],
  ["Desempenho", "Avaliações, feedback, 1:1 e PDI", "/rh/desempenho"],
  ["Canal RH", "Atendimento humano e privado ao colaborador", "/rh/canal-rh"],
  ["Relatórios", "Headcount, turnover, absenteísmo e indicadores", "/rh/relatorios"],
];

export default function RhPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">BravHAS Pessoas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">RH</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Gestão de pessoas, desenvolvimento, comunicação e experiência do colaborador.</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de Recursos Humanos">
          {modules.map(([title, description, href]) => (
            <Link
              key={href}
              href={href}
              className="group min-h-44 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 sm:p-6"
            >
              <h2 className="text-lg font-bold group-hover:text-blue-800">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <div className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Abrir módulo →</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
