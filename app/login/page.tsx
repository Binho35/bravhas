"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

const benefits = [
  { label: "Financeiro sob controle", icon: WalletCards },
  { label: "Pessoas e rotinas organizadas", icon: UsersRound },
  { label: "Documentos e obrigações centralizados", icon: FileCheck2 },
  { label: "Indicadores para decisões mais rápidas", icon: BarChart3 },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { authenticated, loading, error, signIn } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && authenticated) {
      router.replace("/");
    }
  }, [authenticated, loading, router]);

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
      <main className="flex min-h-dvh items-center justify-center bg-[#F3F7FB] px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE6F0] bg-white px-5 py-4 shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2C7DB6]" />
          <p className="text-sm font-semibold text-[#486178]">Carregando BravHAS...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#F3F7FB]">
      <div className="grid min-h-dvh xl:grid-cols-[1.12fr_0.88fr]">
        <section
          className="relative overflow-hidden px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14 xl:px-16 xl:py-14"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 14%, rgba(140, 196, 234, 0.24), transparent 32%), radial-gradient(circle at 86% 78%, rgba(44, 125, 182, 0.24), transparent 30%), linear-gradient(135deg, #071827 0%, #0B2947 52%, #154B7A 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-24 top-14 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-6 top-32 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col justify-between gap-10 xl:mx-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-black tracking-[-0.04em] sm:text-[2rem]">
                  Brav<span className="text-[#8CC4EA]">HAS</span>
                </div>
                <p className="mt-1.5 text-xs font-medium tracking-wide text-white/55">
                  Head Administration System
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold text-white/70 sm:flex">
                <ShieldCheck size={14} aria-hidden="true" />
                Ambiente empresarial
              </div>
            </div>

            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9ED4F5] sm:text-xs">
                BRAVHAS • GESTÃO ADMINISTRATIVA
              </p>
              <h1 className="mt-4 max-w-3xl text-[2.15rem] font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl xl:text-[3.35rem]">
                Controle administrativo real para financeiro, pessoas e obrigações.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
                Centralize rotinas administrativas, financeiro, RH, DP, documentos e indicadores em um ambiente criado para reduzir retrabalho e dar mais clareza à gestão.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.label}
                      className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8CC4EA]/15 text-[#A9DBF7]">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold leading-5 text-white/90">{benefit.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/48 sm:flex-row sm:items-center sm:justify-between">
              <span>Gestão administrativa com mais contexto, ritmo e governança.</span>
              <span className="flex items-center gap-2 font-medium text-white/60">
                <CheckCircle2 size={14} aria-hidden="true" />
                BravSystems
              </span>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#DDEFFC]/65 blur-3xl" />
          <div className="relative z-10 w-full max-w-[520px]">
            <div className="mb-5 flex items-center gap-3 xl:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0B2947] text-sm font-black text-white shadow-sm">
                B
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B2947]">BravHAS</p>
                <p className="text-[11px] text-[#7A8DA0]">Gestão Administrativa</p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[#DCE6F0] bg-white p-6 shadow-[0_30px_80px_-42px_rgba(11,41,71,0.45)] sm:p-8 lg:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E8498]">
                    ACESSO CORPORATIVO
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#0B2947]">
                    Acesse sua operação
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#667B8F]">
                    Entre com suas credenciais para acessar o ambiente da sua organização.
                  </p>
                </div>
                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#154B7A] sm:flex">
                  <LockKeyhole size={19} aria-hidden="true" />
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-8">
                <div>
                  <label htmlFor="loginId" className="mb-2 block text-xs font-bold text-[#334E68]">
                    Login de acesso
                  </label>
                  <input
                    id="loginId"
                    type="text"
                    autoComplete="username"
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    placeholder="Digite seu login corporativo"
                    className="h-13 w-full rounded-2xl border border-[#D8E3ED] bg-[#FBFCFE] px-4 text-sm text-[#102A43] outline-none transition placeholder:text-[#A8B7C5] focus:border-[#2C7DB6] focus:bg-white focus:ring-4 focus:ring-[#2C7DB6]/10"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-[#8B9DAC]">
                    Use o identificador fornecido pela sua organização.
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="text-xs font-bold text-[#334E68]">
                      Senha
                    </label>
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#7890A5]">
                      <ShieldCheck size={13} aria-hidden="true" />
                      Ambiente seguro
                    </span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    className="h-13 w-full rounded-2xl border border-[#D8E3ED] bg-[#FBFCFE] px-4 text-sm text-[#102A43] outline-none transition placeholder:text-[#A8B7C5] focus:border-[#2C7DB6] focus:bg-white focus:ring-4 focus:ring-[#2C7DB6]/10"
                  />
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3" role="alert" aria-live="polite">
                    <p className="text-xs font-semibold leading-5 text-[#C2413B]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#154B7A] px-5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(21,75,122,0.8)] transition hover:bg-[#103D65] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2C7DB6]/20 disabled:cursor-not-allowed disabled:bg-[#8DA2B5]"
                >
                  {submitting ? "Entrando..." : "Entrar"}
                  {!submitting && <ArrowRight size={16} aria-hidden="true" />}
                </button>
              </form>

              <div className="mt-7 border-t border-[#E6EDF4] pt-5">
                <div className="flex items-start gap-3 rounded-2xl bg-[#F6F9FC] px-4 py-3.5">
                  <ShieldCheck className="mt-0.5 shrink-0 text-[#2C7DB6]" size={16} aria-hidden="true" />
                  <p className="text-[11px] leading-5 text-[#7890A5]">
                    Seu acesso é validado no ambiente protegido do BravHAS e respeita as permissões definidas para sua organização.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] font-medium text-[#8A9CAC]">
              BravHAS • Gestão Administrativa • BravSystems
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
