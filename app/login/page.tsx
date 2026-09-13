"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

function BravHasWordmark() {
  return (
    <div>
      <div className="text-xl font-black tracking-[-0.04em] text-[#0B2947]">
        Brav<span className="text-[#3B91C8]">HAS</span>
      </div>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
        by BravSystems
      </p>
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
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-5">
        <div className="text-center">
          <BravHasWordmark />
          <p className="mt-4 text-sm font-medium text-[#64748B]">Carregando ambiente seguro...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F7FB] px-5 py-10 text-[#0F172A]">
      <section className="w-full max-w-[442px] rounded-[28px] border border-[#DDE5EE] bg-white px-7 py-8 shadow-xl shadow-slate-950/5 sm:px-9 sm:py-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B2947] text-lg font-black text-white">
            H
          </div>
          <BravHasWordmark />
        </div>

        <div className="mt-7">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#3B91C8]">Acesso corporativo</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-[#0B2947]">Acesse sua operação</h1>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Entre com sua credencial. O BravHAS abre diretamente o ambiente autorizado para o seu perfil.
              </p>
            </div>
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FB] text-[#154B7A]">
              <LockKeyhole size={18} aria-hidden="true" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          <div>
            <label htmlFor="loginId" className="mb-2 block text-xs font-bold text-[#334155]">
              Usuário ou e-mail
            </label>
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
              <label htmlFor="password" className="text-xs font-bold text-[#334155]">
                Senha
              </label>
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
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#0B2947] text-sm font-black text-white shadow-sm transition hover:bg-[#154B7A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#154B7A]/20 disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] font-semibold text-[#94A3B8]">
          Operação segura · acesso por permissões · sessão autenticada
        </p>
      </section>
    </main>
  );
}
