"use client";

import {
  type ReactNode,
  useEffect,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "../hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    authenticated,
    loading,
  } = useAuth();

  useEffect(() => {
    if (
      loading ||
      authenticated ||
      pathname === "/login"
    ) {
      return;
    }

    router.replace("/login");
  }, [
    authenticated,
    loading,
    pathname,
    router,
  ]);

  if (
    pathname === "/login"
  ) {
    return children;
  }

  if (
    loading ||
    !authenticated
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            BravHAS
          </p>

          <h2 className="mt-2 text-lg font-bold text-[#0B2947]">
            Validando acesso...
          </h2>

          <p className="mt-2 text-sm text-[#64748B]">
            Verificando sua sessão.
          </p>
        </div>
      </main>
    );
  }

  return children;
}