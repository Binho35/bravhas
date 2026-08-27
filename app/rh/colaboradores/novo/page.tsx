import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FileText,
  Save,
  UserRound,
} from "lucide-react";

const Field = ({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) => (
  <label className="block">
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    <input type={type} placeholder={placeholder} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
  </label>
);

export default function NewEmployeePage() {
  return (
    <main className="px-4 py-6 text-slate-950 md:px-7 md:py-8">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/rh/colaboradores" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#154b7a]">
          <ArrowLeft className="h-4 w-4" /> Voltar para colaboradores
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#154b7a]">People Core</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0b2947]">Novo colaborador</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Cadastro único para RH e DP. Os dados desta ficha formarão o dossiê funcional do colaborador.</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">Rascunho seguro · nenhuma alteração salva ainda</div>
        </div>

        <form className="mt-7 space-y-5">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><UserRound className="h-5 w-5" /></div>
              <div><h2 className="font-bold">Dados pessoais</h2><p className="text-xs text-slate-500">Identificação e contato do colaborador.</p></div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2 xl:col-span-2"><Field label="Nome completo" placeholder="Nome conforme documento" /></div>
              <Field label="CPF" placeholder="000.000.000-00" />
              <Field label="Data de nascimento" placeholder="" type="date" />
              <Field label="E-mail pessoal" placeholder="nome@email.com" type="email" />
              <Field label="Telefone" placeholder="(11) 99999-9999" />
              <Field label="RG" placeholder="Documento de identidade" />
              <Field label="Estado civil" placeholder="Selecione" />
              <Field label="Nome social" placeholder="Opcional" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><BriefcaseBusiness className="h-5 w-5" /></div>
              <div><h2 className="font-bold">Vínculo e contrato</h2><p className="text-xs text-slate-500">Dados admissionais, cargo e jornada contratada.</p></div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Data de admissão" placeholder="" type="date" />
              <Field label="Tipo de contrato" placeholder="CLT, experiência, estágio..." />
              <Field label="Matrícula" placeholder="Gerada ou informada pelo DP" />
              <Field label="Salário base" placeholder="R$ 0,00" />
              <Field label="Carga horária semanal" placeholder="44h" />
              <Field label="Regime de trabalho" placeholder="Presencial, híbrido ou remoto" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf3fb] text-[#154b7a]"><Building2 className="h-5 w-5" /></div>
              <div><h2 className="font-bold">Estrutura organizacional</h2><p className="text-xs text-slate-500">Posição do colaborador na empresa e cadeia de liderança.</p></div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Unidade" placeholder="Selecione a unidade" />
              <Field label="Departamento" placeholder="Selecione o departamento" />
              <Field label="Cargo" placeholder="Selecione o cargo" />
              <Field label="Gestor imediato" placeholder="Selecione o responsável" />
              <Field label="Centro de custo" placeholder="Opcional" />
              <Field label="Local de trabalho" placeholder="Unidade / endereço" />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-7">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-[#154b7a]" /><div><h2 className="font-bold">Documentos admissionais</h2><p className="text-xs text-slate-500">Checklist para conferência e composição do dossiê.</p></div></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Documento de identidade", "CPF", "Comprovante de residência", "Carteira de trabalho", "Dados bancários", "Documentos de dependentes"].map((item) => (
                  <label key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"><input type="checkbox" className="h-4 w-4 rounded" />{item}</label>
                ))}
              </div>
            </article>

            <aside className="rounded-3xl border border-blue-100 bg-[#eef6fc] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#154b7a] shadow-sm"><BadgeCheck className="h-5 w-5" /></div>
              <h3 className="mt-4 font-bold text-[#0b2947]">Conferência antes de admitir</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">O fluxo definitivo validará campos obrigatórios, documentos, vínculo, jornada e responsável antes de concluir a admissão.</p>
            </aside>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 pb-8 sm:flex-row">
            <Link href="/rh/colaboradores" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600">Cancelar</Link>
            <button type="button" disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#0b2947] px-5 text-sm font-semibold text-white opacity-60" title="Será habilitado com a persistência do People Core"><Save className="h-4 w-4" />Salvar colaborador</button>
          </div>
        </form>
      </div>
    </main>
  );
}
