"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/modules/auth/hooks/useAuth";

import {
  seedInitialOwner,
} from "@/modules/auth/services/seedInitialOwner";

export default function LoginPage() {
  const router =
    useRouter();

  const {
    authenticated,
    loading,
    error,
    signIn,
  } = useAuth();

  const [
    loginId,
    setLoginId,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    seedInitialOwner();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      authenticated
    ) {
      router.replace("/");
    }
  }, [
    authenticated,
    loading,
    router,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);

    const success =
      await signIn({
        loginId,
        password,
      });

    if (success) {
      router.replace("/");
      return;
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <p className="text-sm font-medium text-[#64748B]">
          Carregando BravHAS...
        </p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* APRESENTAÇÃO */}
      <section className="relative hidden overflow-hidden bg-[#0B2947] px-12 py-10 text-white lg:flex">
        <div className="absolute -bottom-44 -right-28 h-[420px] w-[420px] rounded-full bg-[#8CC4EA]/10" />

        <div className="relative z-10 flex w-full flex-col justify-between">
          <div>
            <div className="text-3xl font-bold tracking-tight">
              Brav
              <span className="text-[#8CC4EA]">
                HAS
              </span>
            </div>

            <p className="mt-2 text-sm text-white/45">
              Head Administration System
            </p>
          </div>

          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8CC4EA]">
              Gestão em um único ambiente
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
              Informação para decidir.
              <br />
              Controle para executar.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
              Acesse o centro administrativo
              do BravHAS e acompanhe
              financeiro, obrigações,
              pessoas, indicadores e
              decisões da operação.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white">
                  Financeiro
                </p>

                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  Caixa e projeções
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white">
                  Operação
                </p>

                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  Obrigações e agenda
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-white">
                  Harpia
                </p>

                <p className="mt-1 text-[11px] leading-5 text-white/40">
                  Inteligência executiva
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/30">
            BravHAS • Ambiente Administrativo
          </p>
        </div>
      </section>

      {/* LOGIN */}
      <section className="flex items-center justify-center px-6 py-10 lg:px-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
                Acesso corporativo
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0B2947]">
                Entrar no BravHAS
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                Utilize o login corporativo
                fornecido pela sua empresa.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-7"
            >
              <div>
                <label
                  htmlFor="loginId"
                  className="mb-2 block text-xs font-semibold text-[#334155]"
                >
                  Login de acesso
                </label>

                <input
                  id="loginId"
                  type="text"
                  autoComplete="username"
                  value={
                    loginId
                  }
                  onChange={(
                    event,
                  ) =>
                    setLoginId(
                      event.target
                        .value,
                    )
                  }
                  placeholder="stoccoRobson35"
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />

                <p className="mt-2 text-[11px] leading-5 text-[#94A3B8]">
                  O login é formado pelo prefixo da empresa + identificador do usuário.
                </p>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-[#334155]"
                  >
                    Senha
                  </label>

                  <span className="text-[11px] font-medium text-[#94A3B8]">
                    Ambiente seguro
                  </span>
                </div>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Digite sua senha"
                  className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none transition placeholder:text-[#CBD5E1] focus:border-[#154B7A] focus:ring-2 focus:ring-[#154B7A]/10"
                />
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold leading-5 text-[#DC2626]">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#154B7A] text-sm font-bold text-white shadow-sm transition hover:bg-[#103D65] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
              >
                {submitting
                  ? "Entrando..."
                  : "Entrar"}
              </button>
            </form>

            <div className="mt-6 border-t border-[#E2E8F0] pt-5">
              <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                <span className="h-2 w-2 rounded-full bg-[#16A34A]" />

                Sessões monitoradas pelo
                BravHAS
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#94A3B8]">
            BravHAS • Head Administration
            System
          </p>
        </div>
      </section>
    </main>
  );
}