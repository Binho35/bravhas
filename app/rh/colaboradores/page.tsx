import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Search,
  UserPlus,
  Users,
} from "lucide-react";

const cards = [
  {
    title: "Colaboradores ativos",
    description: "Base central de pessoas, vínculo, setor, gestor e situação funcional.",
    icon: Users,
  },
  {
    title: "Pré-admissão",
    description: "Pessoas em preparação documental antes do início do vínculo.",
    icon: UserPlus,
  },
  {
    title: "Dossiê digital",
    description: "Documentos, alterações, ocorrências e histórico funcional em uma única linha do tempo.",
    icon: FileText,
  },
  {
    title: "Conferência cadastral",
    description: "Pendências de dados e documentos que precisam de validação do RH/DP.",
    icon: BadgeCheck,
  },
];

export default function EmployeesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/rh"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para RH
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              People Core
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Colaboradores
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Núcleo único para cadastro, vínculo, documentos, gestor, jornada e histórico do colaborador.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white opacity-60"
            title="Será habilitado junto com a persistência do People Core"
          >
            <UserPlus className="h-4 w-4" />
            Novo colaborador
          </button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold">Base de colaboradores</h2>
              <p className="mt-1 text-sm text-slate-500">
                A listagem será conectada ao banco na etapa de persistência do People Core.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                disabled
                placeholder="Buscar colaborador"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="px-6 py-14 text-center">
            <Users className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-4 font-semibold text-slate-700">People Core preparado</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Próximo passo técnico: persistir departamento, cargo, gestor, vínculo e colaborador, mantendo auditoria e segregação por empresa/unidade.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
