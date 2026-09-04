"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentSession } from "../services/getCurrentSession";

interface AuthGuardProps {
  children: ReactNode;
}

const DEVELOPMENT_PREVIEW_PREFIXES = ["/pessoas", "/rh", "/dp"];

function isDevelopmentPreview(pathname: string) {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return DEVELOPMENT_PREVIEW_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const previewAllowed = isDevelopmentPreview(pathname);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function validateAccess() {
      if (pathname === "/login" || previewAllowed) {
        if (active) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      const { authenticated } = await getCurrentSession();

      if (!active) return;

      if (!authenticated) {
        setAllowed(false);
        setChecking(false);
        router.replace("/login");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    void validateAccess();
    return () => {
      active = false;
    };
  }, [pathname, previewAllowed, router]);

  if (pathname === "/login" || previewAllowed) {
    return children;
  }

  if (checking) {
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

  if (!allowed) {
    return null;
  }

  return children;
}
