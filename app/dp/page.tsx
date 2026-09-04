import Link from "next/link";

const modules = [
  ["Ponto e Jornada", "Ocorrências, tratamento, conferência e fechamento", "/dp/ponto"],
  ["Férias", "Período aquisitivo, programação, aprovação e documentos", "/dp/ferias"],
  ["Benefícios", "VT, VR/VA, inclusão, exclusão e custos", "/dp/beneficios"],
  ["Folha", "Variáveis, conferência e fechamento da competência", "/dp/folha"],
  ["Afastamentos", "Atestados, licenças, retorno e histórico", "/dp/afastamentos"],
  ["Medidas disciplinares", "Advertências, suspensões e histórico", "/dp/medidas-disciplinares"],
  ["Desligamentos", "Checklist, documentos, benefícios e encerramentos", "/dp/desligamentos"],
];

export default function DpPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">BravHAS Pessoas</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Departamento Pessoal</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Rotinas trabalhistas, jornada, benefícios, afastamentos e fechamento operacional.</p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Módulos de Departamento Pessoal">
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
