"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Eye,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Users2,
  WalletCards,
} from "lucide-react";

import { useAuth } from "@/modules/auth/hooks/useAuth";

function BravHasWordmark() {
  return (
    <div>
      <div className="text-xl font-black tracking-[-0.045em] text-[#102A43]">
        Brav<span className="text-[#3699CD]">HAS</span>
      </div>
      <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#7A8E9F]">
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
      <main className="bravhas-login-loading">
        <div className="text-center">
          <BravHasWordmark />
          <p className="mt-4 text-sm font-semibold text-[#6F8495]">
            Preparando seu ambiente...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bravhas-login-shell">
      <section className="bravhas-login-editorial" aria-label="BravHAS">
        <div className="bravhas-login-editorial-brand">
          <div className="bravhas-login-logo-mark">H</div>
          <BravHasWordmark />
        </div>

        <div className="bravhas-login-editorial-copy">
          <span className="bravhas-login-pill">
            <ShieldCheck size={14} aria-hidden="true" />
            Gestão com contexto
          </span>
          <h1>Administração sem ruído.</h1>
          <p>
            Financeiro, pessoas, obrigações e indicadores em uma visão executiva
            desenhada para decisão, acompanhamento e responsabilidade.
          </p>

          <div className="bravhas-login-capabilities">
            {[
              { icon: WalletCards, label: "Financeiro", detail: "Contas e fluxo de caixa" },
              { icon: Users2, label: "Pessoas", detail: "RH e departamento pessoal" },
              { icon: FileCheck2, label: "Obrigações", detail: "Prazos e responsáveis" },
              { icon: BarChart3, label: "Indicadores", detail: "Visão executiva consolidada" },
            ].map(({ icon: Icon, label, detail }) => (
              <div className="bravhas-login-capability" key={label}>
                <span>
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="bravhas-login-editorial-footer">
          Head Administration System · BravSystems
        </p>
      </section>

      <section className="bravhas-login-form-panel">
        <div className="bravhas-login-mobile-brand">
          <div className="bravhas-login-logo-mark">H</div>
          <BravHasWordmark />
        </div>

        <div className="bravhas-login-card">
          <div className="bravhas-login-card-icon">
            <LockKeyhole size={18} aria-hidden="true" />
          </div>

          <div className="bravhas-login-card-heading">
            <p>Acesso corporativo</p>
            <h1>Acesse sua operação</h1>
            <span>
              Sua credencial abre diretamente o ambiente e as permissões do seu perfil.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-8">
            <div>
              <label htmlFor="loginId" className="bravhas-login-label">
                Usuário ou e-mail
              </label>
              <input
                id="loginId"
                type="text"
                autoComplete="username"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="Digite seu acesso corporativo"
                className="bravhas-login-input"
              />
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="bravhas-login-label !mb-0">
                  Senha
                </label>
                <span className="text-[10px] font-bold text-[#91A1AE]">
                  Ambiente seguro
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className="bravhas-login-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="bravhas-login-eye"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3" role="alert">
                <p className="text-xs font-bold leading-5 text-[#C84753]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bravhas-login-submit"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="bravhas-login-assurance">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Permissões, sessão e contexto protegidos.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
