"use client";

import { type FormEvent, useEffect, useState, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareText,
  PlaySquare,
  ShieldCheck,
  Sparkles,
  UsersRound,
  UtensilsCrossed,
  WalletCards,
  X,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

type ResourceCard = {
  title: string;
  description: string;
  icon: ElementType;
};

type EcosystemCard = {
  name: string;
  description: string;
  icon: ElementType;
};

const resources: ResourceCard[] = [
  {
    title: "Financeiro",
    description: "Contas, compromissos, acompanhamento e visão gerencial em uma rotina única.",
    icon: WalletCards,
  },
  {
    title: "Pessoas",
    description: "Informações e rotinas administrativas relacionadas às equipes e à estrutura da empresa.",
    icon: UsersRound,
  },
  {
    title: "RH e Departamento Pessoal",
    description: "Organização de processos, admissões e obrigações relacionadas às pessoas.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Documentos",
    description: "Centralização documental com acesso controlado e histórico da operação.",
    icon: FileCheck2,
  },
  {
    title: "Obrigações",
    description: "Prazos, responsabilidades, prioridades e acompanhamento do que precisa ser executado.",
    icon: ClipboardCheck,
  },
  {
    title: "Indicadores",
    description: "Informações consolidadas para apoiar a leitura gerencial e a tomada de decisão.",
    icon: BarChart3,
  },
];

const ecosystem: EcosystemCard[] = [
  {
    name: "BravAcademy",
    description: "Capacitação e Universidade Corporativa.",
    icon: GraduationCap,
  },
  {
    name: "BravMsg",
    description: "Comunicação, atendimento e relacionamento.",
    icon: MessageSquareText,
  },
  {
    name: "BravVideo",
    description: "Produção e automação de conteúdo audiovisual.",
    icon: PlaySquare,
  },
  {
    name: "BravHOS",
    description: "Gestão especializada de pessoas e RH.",
    icon: BookOpenCheck,
  },
  {
    name: "BravOS",
    description: "Operação e gestão para restaurantes.",
    icon: UtensilsCrossed,
  },
];

const benefits = [
  "Menos controles espalhados",
  "Mais visibilidade da operação",
  "Informações centralizadas",
  "Redução de retrabalho",
  "Acompanhamento de prazos",
  "Gestão orientada por dados",
];

function BravHasWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div>
      <div className={`text-xl font-black tracking-[-0.04em] ${inverse ? "text-white" : "text-[#0B2947]"}`}>
        Brav<span className="text-[#3B91C8]">HAS</span>
      </div>
      <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${inverse ? "text-white/55" : "text-[#64748B]"}`}>
        by BravSystems
      </p>
    </div>
  );
}

function ProductPreview({ compact = false }: { compact?: boolean }) {
  const cards = [
    { label: "Contas a pagar", detail: "Acompanhamento financeiro", icon: WalletCards },
    { label: "Contas a receber", detail: "Visão de compromissos", icon: BarChart3 },
    { label: "Obrigações críticas", detail: "Prioridades da operação", icon: ClipboardCheck },
    { label: "Próximos 7 dias", detail: "Prazos e responsáveis", icon: CheckCircle2 },
  ];

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/15 bg-white shadow-2xl shadow-slate-950/20">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#154B7A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#8CC4EA]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Interface BravHAS</span>
      </div>

      <div className="grid min-h-[320px] grid-cols-[84px_1fr] bg-[#F7F9FC] sm:grid-cols-[118px_1fr]">
        <div className="bg-[#0B2947] p-3 sm:p-4">
          <div className="mb-5 text-sm font-black text-white sm:text-base">
            Brav<span className="text-[#8CC4EA]">HAS</span>
          </div>
          <div className="space-y-2">
            {["Centro", "Financeiro", "Pessoas", "Obrigações", "Indicadores"].map((item, index) => (
              <div
                key={item}
                className={`rounded-lg px-2 py-2 text-[9px] font-semibold sm:text-[10px] ${
                  index === 0 ? "bg-[#154B7A] text-white" : "text-white/55"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Visão executiva</p>
            <h3 className="mt-1 text-base font-black text-[#0B2947] sm:text-lg">Centro de Controle</h3>
            <p className="mt-1 text-[10px] text-[#64748B] sm:text-xs">Dados da organização são exibidos somente após autenticação.</p>
          </div>

          <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4"}`}>
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
                  <Icon size={14} className="text-[#154B7A]" aria-hidden="true" />
                  <p className="mt-3 text-[10px] font-bold leading-4 text-[#0F172A] sm:text-xs">{card.label}</p>
                  <p className="mt-1 text-[9px] leading-4 text-[#94A3B8] sm:text-[10px]">{card.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
              <p className="text-[10px] font-bold text-[#0B2947]">Atenções prioritárias</p>
              <div className="mt-3 space-y-2">
                {["Obrigações e prazos", "Compromissos financeiros", "Rotinas administrativas"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-2 py-2">
                    <span className="text-[9px] font-semibold text-[#475569] sm:text-[10px]">{item}</span>
                    <span className="h-1.5 w-8 rounded-full bg-[#CFE5F4]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm sm:block">
              <p className="text-[10px] font-bold text-[#0B2947]">Áreas monitoradas</p>
              <div className="mt-3 space-y-3">
                {["Financeiro", "RH", "DP"].map((item) => (
                  <div key={item}>
                    <p className="text-[9px] font-semibold text-[#64748B]">{item}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-[#EAF3FB]">
                      <div className="h-1.5 w-2/3 rounded-full bg-[#154B7A]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { authenticated, loading, error, signIn } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace("/");
    }
  }, [authenticated, loading, router]);

  useEffect(() => {
    if (loading || authenticated || window.location.hash !== "#login") {
      return;
    }

    document.getElementById("login")?.scrollIntoView({ block: "start" });
  }, [authenticated, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const success = await signIn({ loginId, password });
    if (success) {
      router.replace("/");
      return;
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-center">
          <BravHasWordmark />
          <p className="mt-4 text-sm font-medium text-[#64748B]">Carregando ambiente seguro...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#0F172A]">
      <header className="sticky top-0 z-50 border-b border-[#E2E8F0]/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="#visao-geral" aria-label="BravHAS - início">
            <BravHasWordmark />
          </a>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação comercial">
            <a href="#visao-geral" className="text-sm font-semibold text-[#475569] transition hover:text-[#154B7A]">Visão geral</a>
            <a href="#recursos" className="text-sm font-semibold text-[#475569] transition hover:text-[#154B7A]">Recursos</a>
            <a href="#solucoes" className="text-sm font-semibold text-[#475569] transition hover:text-[#154B7A]">Soluções</a>
            <a href="#ecossistema" className="text-sm font-semibold text-[#475569] transition hover:text-[#154B7A]">Ecossistema BravSystems</a>
            <a href="#login" className="rounded-xl bg-[#154B7A] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#103D65]">Entrar</a>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <a href="#login" className="rounded-xl bg-[#154B7A] px-4 py-2.5 text-xs font-bold text-white">Entrar</a>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#154B7A]"
            >
              {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-[#E2E8F0] bg-white px-5 py-4 lg:hidden" aria-label="Navegação comercial mobile">
            <div className="mx-auto grid max-w-7xl gap-1">
              {[
                ["Visão geral", "#visao-geral"],
                ["Recursos", "#recursos"],
                ["Soluções", "#solucoes"],
                ["Ecossistema BravSystems", "#ecossistema"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <section id="visao-geral" className="relative overflow-hidden bg-[#0B2947] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(140,196,234,0.20),transparent_35%),radial-gradient(circle_at_85%_70%,rgba(59,145,200,0.16),transparent_30%)]" />
        <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8CC4EA]/30 bg-[#8CC4EA]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#B7DDF5]">
              <Sparkles size={13} aria-hidden="true" />
              BravHAS • Gestão Administrativa
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Controle administrativo real para financeiro, pessoas e obrigações.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">
              Centralize financeiro, RH, DP, documentos, obrigações e indicadores em um ambiente único para reduzir retrabalho e aumentar o controle da gestão.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#recursos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-[#0B2947] transition hover:bg-[#F0F7FC]">
                Conhecer o BravHAS
                <ChevronRight size={16} aria-hidden="true" />
              </a>
              <a href="#login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-bold text-white transition hover:bg-white/10">
                Acessar minha conta
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-white/55">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#8CC4EA]" /> Acesso por permissões</span>
              <span className="inline-flex items-center gap-2"><Building2 size={15} className="text-[#8CC4EA]" /> Ambiente por organização</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole size={15} className="text-[#8CC4EA]" /> Sessão autenticada</span>
            </div>
          </div>

          <div className="lg:pl-4">
            <ProductPreview compact />
          </div>
        </div>
      </section>

      <section id="login" className="scroll-mt-20 bg-[#F7F9FC] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B91C8]">Acesso de clientes</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0B2947] sm:text-4xl">Acesse sua operação</h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-[#64748B]">
              Entre com suas credenciais para acessar o ambiente da sua organização.
            </p>
            <div className="mt-7 space-y-3">
              {[
                "Autenticação preservada sem atalhos de acesso",
                "Permissões aplicadas conforme o perfil do usuário",
                "Dados organizados por empresa e contexto operacional",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-[#475569]">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#16A34A]" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#94A3B8]">Acesso corporativo</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-[#0B2947]">Entrar no BravHAS</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FB] text-[#154B7A]">
                <LockKeyhole size={19} aria-hidden="true" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7">
              <div>
                <label htmlFor="loginId" className="mb-2 block text-xs font-bold text-[#334155]">Usuário ou e-mail</label>
                <input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="Digite seu acesso corporativo"
                  className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#154B7A] focus:ring-4 focus:ring-[#154B7A]/10"
                />
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-[#334155]">Senha</label>
                  <span className="text-[11px] font-semibold text-[#94A3B8]">Ambiente seguro</span>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    className="h-12 w-full rounded-xl border border-[#CBD5E1] bg-white px-4 pr-12 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#154B7A] focus:ring-4 focus:ring-[#154B7A]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#154B7A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#154B7A]/30"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
                  <p className="text-xs font-bold leading-5 text-[#DC2626]">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#154B7A] text-sm font-black text-white shadow-sm transition hover:bg-[#103D65] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#154B7A]/20 disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
              >
                {submitting ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 border-t border-[#E2E8F0] pt-5 text-[11px] font-semibold text-[#64748B]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
              Acesso protegido pela arquitetura de autenticação do BravHAS
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B91C8]">Recursos BravHAS</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0B2947] sm:text-4xl">Uma base única para organizar a administração.</h2>
            <p className="mt-4 text-base leading-7 text-[#64748B]">Capacidades já presentes no produto reunidas em uma experiência administrativa consistente.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <article key={resource.title} className="group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#CFE5F4] hover:shadow-lg hover:shadow-slate-950/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FB] text-[#154B7A]">
                    <Icon size={19} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-[#0B2947]">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">{resource.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="solucoes" className="bg-[#F7F9FC] py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B91C8]">Visão integrada</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0B2947] sm:text-4xl">Veja sua administração em uma única visão.</h2>
            <p className="mt-4 text-base leading-7 text-[#64748B]">A interface abaixo reproduz a organização real do Centro de Controle, sem números fictícios ou indicadores fabricados para divulgação.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#334155] shadow-sm">
                  <CheckCircle2 size={17} className="shrink-0 text-[#3B91C8]" aria-hidden="true" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="ecossistema" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B91C8]">Ecossistema BravSystems</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0B2947] sm:text-4xl">Mais soluções para sua empresa.</h2>
              <p className="mt-4 text-base leading-7 text-[#64748B]">Conheça outras frentes do ecossistema BravSystems. O acesso a cada solução depende de sua disponibilidade e contratação próprias.</p>
            </div>
            <a href="https://bravsystems.com.br" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-5 text-sm font-black text-[#154B7A] transition hover:border-[#8CC4EA] hover:bg-[#F8FBFD]">
              Conhecer a BravSystems
              <ChevronRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {ecosystem.map((product) => {
              const Icon = product.icon;
              return (
                <article key={product.name} className="flex min-h-[220px] flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2947] text-[#8CC4EA]">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-black text-[#0B2947]">{product.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#64748B]">{product.description}</p>
                  <a href="https://bravsystems.com.br" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-black text-[#154B7A] transition hover:text-[#103D65]">
                    Conhecer solução
                    <ChevronRight size={14} aria-hidden="true" />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0B2947] py-14 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            [ShieldCheck, "Acesso por permissões", "Perfis controlam o que cada usuário pode acessar."],
            [Building2, "Gestão centralizada", "Áreas administrativas reunidas no mesmo ambiente."],
            [LayoutDashboard, "Dados organizados", "Informações estruturadas para acompanhamento da gestão."],
            [Sparkles, "Tecnologia BravSystems", "Produto desenvolvido dentro do ecossistema BravSystems."],
          ].map(([Icon, title, description]) => {
            const TrustIcon = Icon as ElementType;
            return (
              <div key={title as string} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <TrustIcon size={20} className="text-[#8CC4EA]" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-black">{title as string}</h3>
                <p className="mt-2 text-xs leading-5 text-white/55">{description as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] bg-[#EAF3FB] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12 lg:py-12">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B91C8]">BravHAS by BravSystems</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#0B2947] sm:text-4xl">Sua administração pode trabalhar de forma mais organizada.</h2>
              <p className="mt-4 text-base leading-7 text-[#64748B]">Conheça a proposta do BravHAS ou acesse sua operação se você já é cliente.</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col xl:flex-row">
              <a href="#recursos" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B2947] px-5 text-sm font-black text-white transition hover:bg-[#154B7A]">Conhecer o BravHAS</a>
              <a href="https://bravsystems.com.br" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#B8D7EA] bg-white px-5 text-sm font-black text-[#154B7A] transition hover:bg-[#F8FBFD]">Falar com a BravSystems</a>
              <a href="#login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-transparent px-5 text-sm font-black text-[#154B7A] transition hover:bg-white/70">Já sou cliente — entrar</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E2E8F0] bg-white py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BravHasWordmark />
          <p className="text-xs font-semibold text-[#94A3B8]">Gestão administrativa com tecnologia BravSystems.</p>
        </div>
      </footer>
    </main>
  );
}
